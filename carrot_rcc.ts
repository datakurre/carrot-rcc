#!/usr/bin/env node

import { spawn, spawnSync } from "child_process";
import fs from "fs";
import { IncomingMessage, ServerResponse, createServer } from "http";
import os from "os";
import path from "path";

import Zip from "adm-zip";
import {
  Client,
  Interceptor,
  Task,
  TypedValue,
  logger,
} from "camunda-external-task-client-js";
import dotenv from "dotenv";
import { fdir as FD, PathsOutput } from "fdir";
import mime from "mime-types";
import neodoc from "neodoc";
import * as rest from "typed-rest-client";
import { IRequestOptions } from "typed-rest-client";
import YAML from "yaml";

import * as api from "./Camunda";

const crypto = require("crypto");

type PatchVariablesDto = api.components["schemas"]["PatchVariablesDto"];
type VariableValueDto = api.components["schemas"]["VariableValueDto"];
type ProcessEngineDto = api.components["schemas"]["ProcessDefinitionDto"];

interface VaultSecretResponseData {
  data: Record<string, string>;
}

interface VaultSecretResponse {
  data: VaultSecretResponseData;
}

dotenv.config();

const args = neodoc.run(`
usage: carrot-rcc [<robots>...]
                  [--base-url] [--authorization]
                  [--worker-id] [--max-tasks] [--poll-interval] [--log-level]
                  [--rcc-executable] [--rcc-encoding] [--rcc-telemetry]
                  [--vault-addr] [--vault-token]
                  [--healthz-host] [--healthz-port]
                  [-h] [--help]

<robots> could also be passed as a comma separated env RCC_ROBOTS

options:

  --base-url[=<url>]                       [env: CAMUNDA_API_BASE_URL] [default: http://localhost:8080/engine-rest]
  --authorization[=<header>]               [env: CAMUNDA_API_AUTHORIZATION] [example: Basic ZGVtbzpkZW1v]

  --worker-id[=<string>]                   [env: CLIENT_WORKER_ID] [default: carrot-rcc]
  --max-tasks[=<cpus>]                     [env: CLIENT_MAX_TASKS] [default: ${
    os.cpus().length
  }]
  --poll-interval[=<milliseconds>]         [env: CLIENT_POLL_INTERVAL] [default: 1000]
  --log-level[=<debug|info|warn|error>]    [env: CLIENT_LOG_LEVEL] [default: info]

  --rcc-executable[=<path>]                [env: RCC_EXECUTABLE] [default: rcc]
  --rcc-encoding[=<encoding>]              [env: RCC_ENCODING] [default: utf-8]
  --rcc-telemetry                          [env: RCC_TELEMETRY] (default: do not track)

  --vault-addr[=<addr>]                    [env: VAULT_ADDR] [default: http://127.0.0.1:8200]
  --vault-token[=<token>]                  [env: VAULT_TOKEN] [default: token]

  --healthz-host[=<host>]                  [env: HEALTHZ_HOST] [default: localhost]
  --healthz-port[=<port>]                  [env: HEALTHZ_PORT] (default: disabled)

  -h, --help

examples:

  $ carrot-rcc robot1.zip

  $ carrot-rcc robot1.zip robot2.zip --log-level=debug

  $ RCC_ROBOTS="robot1.zip,robot2.zip" LOG_LEVEL="debug" carrot-rcc

  $ CAMUNDA_API_AUTHORIZATION="Bearer MY_TOKEN" carrot-rcc robot1.zip
`);

const RCC_ROBOTS = (args["<robots>"] || []).concat(
  process.env.RCC_ROBOTS ? process.env.RCC_ROBOTS.split(",") : []
);

const CAMUNDA_API_BASE_URL = args["--base-url"];
const CAMUNDA_API_AUTHORIZATION = args["--authorization"];

const CLIENT_LOG_LEVEL = args["--log-level"].toLowerCase();
const CLIENT_MAX_TASKS = args["--max-tasks"];
const CLIENT_POLL_INTERVAL = args["--poll-interval"];
const CLIENT_WORKER_ID = args["--worker-id"];

const RCC_EXECUTABLE = args["--rcc-executable"];
const RCC_ENCODING = args["--rcc-encoding"];
const RCC_TELEMETRY = !!args["--rcc-telemetry"];

const VAULT_ADDR = args["--vault-addr"];
const VAULT_TOKEN = args["--vault-token"];

const HEALTHZ_HOST = args["--healthz-host"];
const HEALTHZ_PORT = !isNaN(parseInt(args["--healthz-port"]))
  ? parseInt(args["--healthz-port"])
  : 0;

// Disable telemetry by default
if (!RCC_TELEMETRY) {
  spawnSync(RCC_EXECUTABLE, ["configuration", "identity", "-t"], {
    env: process.env,
  });
}

// Dummy logger
const LOG = {
  error: (...args: any[]) => {
    if (["error", "warn", "info", "debug"].includes(CLIENT_LOG_LEVEL)) {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (["warn", "info", "debug"].includes(CLIENT_LOG_LEVEL)) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (["info", "debug"].includes(CLIENT_LOG_LEVEL)) {
      console.log(...args);
    }
  },
  debug: (...args: any[]) => {
    if (["debug"].includes(CLIENT_LOG_LEVEL)) {
      console.log(...args);
    }
  },
};

const toAbsolute = (p: string): string =>
  fs.existsSync(p) && !path.isAbsolute(p) ? path.join(process.cwd(), p) : p;

const CAMUNDA_TOPICS: Record<string, string> = {};
const CAMUNDA_TOPICS_VAULT: Record<string, Record<string, string>> = {};

for (const candidate of RCC_ROBOTS) {
  const robot = toAbsolute(candidate);
  if (robot && fs.existsSync(robot)) {
    const zip = new Zip(robot);
    const entries = zip.getEntries();
    entries.forEach((entry) => {
      if (entry.entryName == "robot.yaml") {
        const data = entry.getData().toString(RCC_ENCODING as BufferEncoding);
        const yaml = YAML.parse(data);
        const secrets = yaml.vault || {};
        for (const task of Object.keys(yaml.tasks || {})) {
          CAMUNDA_TOPICS[task] = robot;
          CAMUNDA_TOPICS_VAULT[task] = secrets;
        }
      }
    });
  }
}
if (Object.keys(CAMUNDA_TOPICS).length < 1) {
  LOG.warn("RCC_ROBOTS invalid or missing:", RCC_ROBOTS);
}

const AuthorizationHeaderInterceptor: Interceptor = (config: any): any => {
  return CAMUNDA_API_AUTHORIZATION
    ? {
        ...config,
        headers: {
          ...config.headers,
          Authorization: CAMUNDA_API_AUTHORIZATION,
        },
      }
    : config;
};

const client = new Client({
  baseUrl: CAMUNDA_API_BASE_URL,
  workerId: CLIENT_WORKER_ID,
  maxTasks: CLIENT_MAX_TASKS,
  maxParallelExecutions: CLIENT_MAX_TASKS,
  // interval: 0, would fill server logs on connection errors due to
  // camunda-external-task-client-js not allowing to modify interval
  interval: Math.max(1000, CLIENT_POLL_INTERVAL),
  lockDuration: CLIENT_POLL_INTERVAL * 20,
  autoPoll: true,
  interceptors: [AuthorizationHeaderInterceptor],
  asyncResponseTimeout: CLIENT_POLL_INTERVAL * 10,
  use: (logger as any).level(CLIENT_LOG_LEVEL),
});

LOG.debug((client as any).options);
LOG.debug(CAMUNDA_TOPICS);
LOG.debug(CAMUNDA_TOPICS_VAULT);

const isEqual = async (
  old: TypedValue | undefined,
  current: any
): Promise<boolean> => {
  if (old === undefined) {
    return false;
  }
  switch (old.type) {
    case "File":
      return false;
    default:
      return old.value === current;
  }
};

const inferType = async (
  old: TypedValue | undefined,
  current: any
): Promise<string> => {
  if (old?.type === "object") {
    // We can only save deserialized objects back as JSON
    return "Json";
  } else if (old?.type) {
    return old.type[0].toUpperCase() + old.type.substr(1);
  } else if (typeof current === "boolean") {
    return "Boolean";
  } else if (typeof current === "string") {
    if (current.match(/^\d{4}-\d{2}-\d{2}T?[0-9:.Z]*$/)) {
      return "Date";
    } else {
      return "String";
    }
  } else if (typeof current.getMonth === "function") {
    return "Date";
  } else if (typeof current === "number") {
    if (!`${current}`.match(/\./)) {
      return "Integer";
    } else {
      return "Double";
    }
  }
  return "Json";
};

const TZ: string = ((): string => {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const base = Math.floor(offset / 60) * -100 + (offset % 60);
  if (offset == 0) {
    return "+0000";
  } else if (base >= 1000) {
    return `+${base}`;
  } else if (base >= 100) {
    return `+0${base}`;
  } else if (base >= 10) {
    return `+00${base}`;
  } else if (base >= 1) {
    return `+000${base}`;
  } else if (base <= -1000) {
    return `-${base}`;
  } else if (base <= -100) {
    return `-0${base}`;
  } else if (base <= -10) {
    return `-00${base}`;
  } else if (base <= -1) {
    return `-000${base}`;
  } else {
    return "+0000";
  }
})();

interface File {
  name: string;
  hex: string;
}

const load = async (
  task: Task,
  tasksDir: string,
  itemsDir: string,
  topic: string
): Promise<Record<string, File>> => {
  const camunda = new rest.RestClient("carrot-rcc", CAMUNDA_API_BASE_URL, []);
  const options: IRequestOptions = {
    additionalHeaders: CAMUNDA_API_AUTHORIZATION
      ? {
          Authorization: CAMUNDA_API_AUTHORIZATION,
        }
      : {},
    queryParameters: {
      params: {
        deserializeValue: "true",
      },
    },
  };
  const vault = new rest.RestClient("carrot-rcc", `${VAULT_ADDR}/v1/`, []);
  const vaultOptions: IRequestOptions = {
    additionalHeaders: {
      "X-Vault-Token": VAULT_TOKEN,
    },
  };
  const files: Record<string, File> = {};
  // Fetch and prepare robot
  await new Promise((resolve, reject) => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const exec = spawn(
      RCC_EXECUTABLE,
      ["robot", "unwrap", "-d", tasksDir, "-z", CAMUNDA_TOPICS[topic]],
      {
        env: process.env,
      }
    );
    exec.stdout.on("data", (data) => stdout.push(data.toString()));
    exec.stderr.on("data", (data) => stderr.push(data.toString()));
    exec.on("close", (code) =>
      code === 0
        ? resolve(stdout.join("") + stderr.join(""))
        : reject(stdout.join("") + stderr.join(""))
    );
  });
  // Fetch and prepare items
  await new Promise(async (resolve) => {
    const variables = task.variables.getAll();
    const typed = task.variables.getAllTyped();
    // TODO: This could be optimized to make parallel variable fetch
    for (const name of Object.keys(typed)) {
      if (typed[name].type === "object") {
        // fixes camunda-external-task-client-js not deserializing lists / maps
        let variable =
          (await camunda.get<VariableValueDto>(
            `execution/${task.executionId}/localVariables/${name}`,
            options
          )) ||
          (await camunda.get<VariableValueDto>(
            `process-instance/${task.processInstanceId}/variables/${name}`,
            options
          ));
        variables[name] = variable.result?.value;
      } else if (typed[name].type === "file") {
        // fixes camunda-external-task-client-js not supporting local scope files
        const file = await (async () => {
          // Try to load file first from local variable scope
          typed[
            name
          ].value.remotePath = `/execution/${task.executionId}/localVariables/${name}/data`;
          try {
            return await typed[name].value.load();
          } catch (e) {
            // If the file is not on the local scope, try process scope
            typed[
              name
            ].value.remotePath = `/process-instance/${task.processInstanceId}/variables/${name}/data`;
            return await typed[name].value.load();
          }
        })();
        const filename = path.join(itemsDir, file.filename);
        delete variables[name];
        await new Promise((resolve) => {
          fs.writeFile(filename, file.content, resolve);
        });
        const hashSum = crypto.createHash("sha256");
        hashSum.update(file.content);
        files[name] = {
          name: filename.replace(/\\/g, "\\\\"),
          hex: hashSum.digest("hex"),
        };
      }
    }
    const items = [
      {
        payload: variables,
        files: Object.fromEntries(
          Object.entries<File>(files).map(([name, file]) => [name, file.name])
        ),
      },
    ];
    fs.writeFile(
      path.join(itemsDir, "items.json"),
      JSON.stringify(items),
      resolve
    );
  });
  // Save secrets
  await new Promise(async (resolve) => {
    const secrets: Record<string, Record<string, string>> = {};
    // Try to resolve Vault secrets
    for (const [key, path] of Object.entries(
      CAMUNDA_TOPICS_VAULT[topic] || {}
    )) {
      const apiPath = path.replace(/^\//, "");
      try {
        const response = await vault.get<VaultSecretResponse>(
          apiPath,
          vaultOptions
        );
        secrets[key] = response.result?.data?.data || {};
        if (!response.result?.data?.data) {
          LOG.warn(`Vault secret "${path}" was not resolved.`);
        }
      } catch (e) {
        LOG.warn(`Vault secret "${path}" was not resolved. ${e}`);
      }
    }
    // Save resolved secrets with env as extra secrets
    fs.writeFile(
      path.join(itemsDir, "vault.json"),
      JSON.stringify({
        ...secrets,
        env: process.env,
      }),
      resolve
    );
  });
  return files;
};

const failReason = async (tasksDir: string): Promise<string> => {
  let reason = "fail";
  const taskFiles = new FD().withFullPaths().crawl(tasksDir).sync();
  for (const file of taskFiles as PathsOutput) {
    if (path.basename(file) === "output.xml") {
      const xml = fs.readFileSync(file).toString("utf-8");
      for (const match of xml.matchAll(/status="FAIL"[^>]*.([^<]*)/g)) {
        reason = match[1].trim() || reason;
      }
    }
  }
  return reason;
};

const inlineScreenshots = async (
  log: string,
  dirname: string
): Promise<string> => {
  for (const match of log.matchAll(/img src=\\"([^"]+)/g)) {
    const src = match[1].replace(/\\$/, "");
    let file: string;
    if (src.startsWith("data:")) {
      continue;
    } else if (path.isAbsolute(src)) {
      if (fs.existsSync(src)) {
        file = src;
      } else {
        continue;
      }
    } else if (fs.existsSync(path.join(dirname, src))) {
      file = path.join(dirname, src);
    } else {
      continue;
    }
    const type = mime.lookup(file) || "application/octet-stream";
    const data = (
      await new Promise<Buffer>((resolve) =>
        fs.readFile(file, (err, data) => resolve(data))
      )
    ).toString("base64");
    const uri = `data:${type};base64,${data}`;
    log = log
      .replace(new RegExp(`a href=\\\\"${src}\\\\"`, "g"), "a")
      .replace(
        new RegExp(`img src=\\\\"${src}\\\\" width=\\\\"800px\\\\"`, "g"),
        `img src=\\"${uri}\\" style=\\"max-width:800px\\"`
      )
      .replace(
        new RegExp(`img src=\\\\"${src}\\\\"`, "g"),
        `img src=\\"${uri}\\"`
      );
  }
  return log;
};

const save = async (
  task: Task,
  tasksDir: string,
  itemsDir: string,
  files: Record<string, File>,
  stdout: string,
  stderr: string,
  code: number
): Promise<void> => {
  const camunda = new rest.RestClient(
    "carrot-executor",
    CAMUNDA_API_BASE_URL,
    []
  );

  const options: IRequestOptions = {
    additionalHeaders: CAMUNDA_API_AUTHORIZATION
      ? {
          Authorization: CAMUNDA_API_AUTHORIZATION,
        }
      : {},
  };

  const old = task.variables.getAllTyped();
  const { payload: current, files: filenames } = JSON.parse(
    fs.readFileSync(
      fs.existsSync(path.join(itemsDir, "items.output.json"))
        ? path.join(itemsDir, "items.output.json")
        : path.join(itemsDir, "items.json")
    ) as unknown as string
  )[0];
  const patch: PatchVariablesDto = {
    modifications: {},
  };

  if (patch.modifications) {
    for (const name of Object.keys(current)) {
      if (await isEqual(old[name], current[name])) {
        continue;
      }
      switch (await inferType(old[name], current[name])) {
        case "Boolean":
          patch.modifications[name] = {
            value: !!current[name],
            type: "Boolean",
          };
          break;
        case "Date":
          patch.modifications[name] = {
            value: (typeof current[name].getMonth === "function"
              ? current[name].toISOString()
              : `${current[name].substring(0, 10)}T${current[name].substring(
                  11
                )}${TZ}`
            ).replace(/Z$/, "+0000"),
            type: "Date",
          };
          break;
        case "Double":
          patch.modifications[name] = {
            value: current[name],
            type: "Double",
          };
          break;
        case "File":
          break;
        case "Integer":
          patch.modifications[name] = {
            value: current[name],
            type: "Integer",
          };
          break;
        case "Json":
          patch.modifications[name] = {
            value: JSON.stringify(current[name]) || "null",
            type: "Json",
          };
          break;
        case "String":
          patch.modifications[name] = {
            value: `${current[name]}` || null,
            type: "String",
          };
          break;
        default:
          patch.modifications[name] = {
            value: current[name],
            type: old?.[name]?.type
              ? old[name].type[0].toUpperCase() + old[name].type.substr(1)
              : "String",
          };
      }
    }

    for (const [name, file] of Object.entries<string>(filenames)) {
      const filename = fs.existsSync(path.join(itemsDir, file))
        ? path.join(itemsDir, file)
        : fs.existsSync(path.join(tasksDir, file))
        ? path.join(tasksDir, file)
        : fs.existsSync(file)
        ? toAbsolute(file)
        : null;

      if (filename !== null) {
        const fileBuffer = fs.readFileSync(filename);

        // Skip unmodified files
        if (files[name]) {
          const hashSum = crypto.createHash("sha256");
          hashSum.update(fileBuffer);
          if (files[name].hex === hashSum.digest("hex")) {
            continue;
          }
        }

        // Set to new and changed file variables
        const type = mime.lookup(file) || "application/octet-stream";
        patch.modifications[name] = {
          value: fileBuffer.toString("base64"),
          type: "File",
          valueInfo: {
            filename: path.basename(file),
            mimetype: type,
            mimeType: type,
            encoding: "utf-8",
          },
        };
      }
    }

    const taskFiles = new FD().withFullPaths().crawl(tasksDir).sync();
    for (const file of taskFiles as PathsOutput) {
      if (path.basename(file) === "log.html") {
        const dirname = path.dirname(file);
        const log = fs.readFileSync(file).toString("utf-8");
        patch.modifications["log"] = {
          value: Buffer.from(await inlineScreenshots(log, dirname)).toString(
            "base64"
          ),
          type: "File",
          valueInfo: {
            filename: "log.html",
            mimetype: "text/html",
            mimeType: "text/html",
            encoding: "utf-8",
          },
        };
        break;
      }
    }
    if ((code > 0 && stdout) || old["stdout"]) {
      patch.modifications["stdout"] = {
        value: Buffer.from(stdout, "utf-8").toString("base64"),
        type: "File",
        valueInfo: {
          filename: "stdout.txt",
          mimetype: "text/plain",
          mimeType: "text/plain",
          encoding: "utf-8",
        },
      };
    }
    if ((code > 0 && stderr) || old["stderr"]) {
      patch.modifications["stderr"] = {
        value: Buffer.from(stderr, "utf-8").toString("base64"),
        type: "File",
        valueInfo: {
          filename: "stderr.txt",
          mimetype: "text/plain",
          mimeType: "text/plain",
          encoding: "utf-8",
        },
      };
    }

    if (Object.keys(patch.modifications).length > 0) {
      await camunda.create<never>(
        `execution/${task.executionId}/localVariables`,
        patch,
        options
      );
    }
  }
};

const extendLockError: Map<string, string> = new Map();
client.on("extendLock:error", ({ id }, e) => {
  if (id) {
    extendLockError.set(id, `${e}`);
  }
});

const handleFailureError: Map<string, string> = new Map();
client.on("handleFailure:error", ({ id }, e) => {
  if (id) {
    handleFailureError.set(id, `${e}`);
  }
});

const completeError: Map<string, string> = new Map();
// @ts-ignore // outdated @types
client.on("complete:error", ({ id }, e) => {
  if (id) {
    completeError.set(id, `${e}`);
  }
});

for (const topic of Object.keys(CAMUNDA_TOPICS)) {
  client.subscribe(topic, async ({ task, taskService }) => {
    LOG.debug("Received task", task.topicName, task.id);

    // Resolve lock expiration
    const lockExpiration =
      new Date(task.lockExpirationTime as string).getTime() -
      new Date().getTime();

    // Extend lock expiration
    const extendLock = async () => {
      await taskService.extendLock(task, lockExpiration);

      // On error, stop extending lock expiration
      if (task.id && !extendLockError.has(task.id)) {
        extendLockTimeout = setTimeout(extendLock, lockExpiration / 3.0);
      } else if (task.id) {
        extendLockError.delete(task.id);
      }
    };

    // Schedule initial lock expiration
    let extendLockTimeout = setTimeout(extendLock, lockExpiration / 2);

    // Execute with temporary working directory
    const tasksDir = await fs.mkdtempSync(path.join(os.tmpdir(), "rcc-tasks-"));
    const itemsDir = await fs.mkdtempSync(path.join(os.tmpdir(), "rcc-items-"));
    try {
      // Prepare robot
      const files = await load(task, tasksDir, itemsDir, topic);

      // Execute robot
      await new Promise((resolve, reject) => {
        const stdout: string[] = [];
        const stderr: string[] = [];
        const exec = spawn(RCC_EXECUTABLE, ["run", "--task", topic], {
          cwd: tasksDir,
          env: {
            RPA_SECRET_MANAGER: "RPA.Robocloud.Secrets.FileSecrets",
            RPA_SECRET_FILE: `${itemsDir}/vault.json`,
            RPA_WORKITEMS_ADAPTER: "RPA.Robocloud.Items.FileAdapter",
            RPA_INPUT_WORKITEM_PATH: `${itemsDir}/items.json`,
            RPA_OUTPUT_WORKITEM_PATH: `${itemsDir}/items.output.json`,
            RC_WORKSPACE_ID: "1",
            RC_WORKITEM_ID: "1",
            ...process.env,
          },
        });
        exec.stdout.on("data", (data) => {
          stdout.push(data.toString());
          LOG.debug(data.toString());
        });
        exec.stderr.on("data", (data) => {
          stderr.push(data.toString());
          LOG.debug(data.toString());
        });
        exec.on("close", async (code) => {
          let errorMessage = "error";
          if (code !== null && code > 0 && code < 251) {
            errorMessage = await failReason(tasksDir);
          }
          try {
            await save(
              task,
              tasksDir,
              itemsDir,
              files,
              stdout.join(""),
              stderr.join(""),
              code || 0
            );
          } catch (e) {
            LOG.error(`${e}`);
            stderr.push(`${e}`);
            code = 255; // Unexpected error
          }
          if (code === 0) {
            let retries = 0;
            while (retries < 3) {
              code = 0;
              retries++;
              try {
                await taskService.complete(task);
              } catch (e) {
                LOG.error(`${e}`);
                stderr.push(`${e}`);
                code = 255; // Unexpected error
              }
              if (task.id && completeError.has(task.id)) {
                stderr.push(`${completeError.get(task.id)}`);
                completeError.delete(task.id);
                code = 255; // Unexpected error
              } else {
                break;
              }
              // Retry to work around optimistic locking exceptions
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * retries)
              );
            }
          }
          return code === 0
            ? resolve(task)
            : reject({
                error: {
                  message: errorMessage,
                },
                stack:
                  errorMessage === "error"
                    ? stdout.join("") + stderr.join("")
                    : stdout
                        .join("")
                        .replace(/[a-zA-Z0-9\-.]+==[a-zA-Z0-9\-.]+\n/g, ""),
              });
        });
      });
    } catch (e: any) {
      LOG.debug(e);
      await taskService.handleFailure(task, {
        errorMessage: `${e?.error?.message ?? e}`,
        errorDetails: e.stack || JSON.stringify(e),
      });
      // TODO: Maybe do something special on handleFailureError
      if (task.id && handleFailureError.has(task.id)) {
        handleFailureError.delete(task.id);
      }
    } finally {
      // Cleanup
      fs.rmdirSync(tasksDir, { recursive: true });
      fs.rmdirSync(itemsDir, { recursive: true });

      // Stop extending expiration timeout
      clearTimeout(extendLockTimeout);
      if (task.id && extendLockError.has(task.id)) {
        extendLockError.delete(task.id);
      }

      LOG.debug("Completed task", task.topicName, task.id);
    }
  });
}

if (HEALTHZ_HOST && HEALTHZ_PORT) {
  (async () => {
    const camunda = new rest.RestClient("carrot-rcc", CAMUNDA_API_BASE_URL, []);
    const options: IRequestOptions = {
      additionalHeaders: CAMUNDA_API_AUTHORIZATION
        ? {
            Authorization: CAMUNDA_API_AUTHORIZATION,
          }
        : {},
    };
    const healthz = async (req: IncomingMessage, res: ServerResponse) => {
      try {
        await camunda.get<ProcessEngineDto[]>("engine", options);
        res.writeHead(200);
        res.end(JSON.stringify({ status: "ok" }));
      } catch (e) {
        res.writeHead(500);
        res.end(JSON.stringify({ status: `${e}` }));
      }
    };
    LOG.info(`Healthz: http://${HEALTHZ_HOST}:${HEALTHZ_PORT}/healthz`);
    createServer(healthz).listen(HEALTHZ_PORT, HEALTHZ_HOST);
  })();
}

client.start();
