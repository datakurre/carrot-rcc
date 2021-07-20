Camunda external task Robot Framework RCC client
================================================

**Technology preview.**

`carrot-rcc` is an opinionated [Camunda external task](https://docs.camunda.org/manual/latest/user-guide/process-engine/external-tasks/) client for executing [Robot Framework](https://robotframework.org/rpa/) [RPA framework](https://rpaframework.org/) tasks. It is based on Robocorp [RCC toolchain](https://robocorp.com/docs/rcc/overview) and [Camunda external task client for Node JS](https://github.com/camunda/camunda-external-task-client-js).

`carrot-rcc` executes robots build and wrapped into zip files as instructed by [Robocorp documentation](https://robocorp.com/docs/). Single `carrot-rcc` service can subscribe multiple topics, execute tasks concurrently, but only locally on the same computer. `carrot-rcc` works on Windows, Linux and most probably also on MacOS.

```bash
usage: carrot-rcc [<robots>...]
                  [--base-url] [--authorization]
                  [--worker-id] [--max-tasks] [--poll-interval] [--log-level]
                  [--rcc-executable] [--rcc-encoding] [--rcc-telemetry]
                  [-h] [--help]

<robots> could also be passed as a comma separated env RCC_ROBOTS

options:

  --base-url[=<url>]                       [env: CAMUNDA_API_BASE_URL] [default: http://localhost:8080/engine-rest]
  --authorization[=<header>]               [env: CAMUNDA_API_AUTHORIZATION] [example: Basic ZGVtbzpkZW1v]

  --worker-id[=<string>]                   [env: CLIENT_WORKER_ID] [default: carrot-rcc]
  --max-tasks[=<cpus>]                     [env: CLIENT_MAX_TASKS] [default: [cpu count]]
  --poll-interval[=<milliseconds>]         [env: CLIENT_POLL_INTERVAL] [default: 10000]
  --log-level[=<debug|info|warn|error>]    [env: CLIENT_LOG_LEVEL] [default: info]

  --rcc-executable[=<path>]                [env: RCC_EXECUTABLE] [default: rcc]
  --rcc-encoding[=<encoding>]              [env: RCC_ENCODING] [default: utf-8]
  --rcc-telemetry                          [env: RCC_TELEMETRY] (default: do not track)

  -h, --help
TODO
```

* On startup, every given robot.zip is examined for their task names `robot.yaml`.
* Then `carrot-rcc` subscribes every task name as they were Camunda external task topics.
* On a new task, its variables (also files) are saved as a local [robot work item](https://robocorp.com/docs/libraries/rpa-framework/rpa-robocloud-items).
* Next [RCC](https://robocorp.com/docs/rcc/overview) is called to resolve robot's dependencies and execute the robot.
* Finally, `carrot-rcc` saves execution logs and changed and added variables from the robot's saved work item back to Camunda (with task execution context) and either completes of fails the task at Camunda.

![](https://github.com/datakurre/carrot-rcc/raw/main/example-process.gif)


Usage
=====

`carrot-rcc` requires [NodeJS](https://nodejs.org/en/) 12 or later and expects [RCC](https://downloads.robocorp.com/rcc/releases/index.html) to be on its PATH (or configured using ``--rcc-executable`` argument).

Yet, it is possible to bootstrap everything with just RCC:

1. Create a directory for `carrot-rcc` and download [RCC](https://downloads.robocorp.com/rcc/releases/index.html) into that directory.

2. Download an example [conda.yaml](https://raw.githubusercontent.com/datakurre/carrot-rcc/main/conda.yaml) defining the requirements for `carrot-rcc`.

3. Install `carrot-rcc` into RCC managed environment with

   ```bash
   $ rcc env new conda.yaml
   ```
   or
   ```bash
   $ rcc.exe env new conda.yaml
   ```

4. The hard part. Figure out from the logs where RCC did create the environment. Then copy a few files back and forth to give you access the environment and installed `carrot-rcc` and give `carrot-rcc` access to RCC with

   ```bash
   $ cp /home/user/.robocorp/live/850002f365eee60f/rcc_activate.sh .
   $ cp rcc /home/user/.robocorp/live/850002f365eee60f/bin
   ```
   or
   ```bash
   $ copy C:\Users\User\AppData\Local\robocorp\live\850002f365eee60f\rcc_activate.cmd .
   $ copy C:\Users\User\AppData\Local\robocorp\live\850002f365eee60f\Scripts\carrot-rcc.exe .
   $ copy rcc.exe C:\Users\User\AppData\Local\robocorp\live\850002f365eee60f
   ```

5. Finally, activate environment with

   ```bash
   $ source rcc_activate.sh
   ```
   or
   ```bash
   $ rcc_activate.cmd
   ```

Done, now `carrot-rcc` should be ready to be run, for example with:

```bash
$ carrot-rcc robot.zip --base-url=http://localhost:8080/engine-rest --log-level=debug
```
or
```bash
$ carrot-rcc.exe robot.zip --base-url=http://192.168.86.156:8080/engine-rest --log-level=debug
```

The project's repository includes [an example Camunda process](https://github.com/datakurre/carrot-executor/tree/main/camunda/deployment) with an [an example RCC compatible robot](https://github.com/datakurre/carrot-rcc/blob/main/xkcd-bot/robot.zip?raw=true) available.

![](https://github.com/datakurre/carrot-rcc/raw/main/example-process.png)
