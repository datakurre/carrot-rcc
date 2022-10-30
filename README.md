Camunda external task Robot Framework RCC client
================================================

**Technology preview.**

`carrot-rcc` is an opinionated [Camunda external task](https://docs.camunda.org/manual/latest/user-guide/process-engine/external-tasks/) client for executing [Robot Framework](https://robotframework.org/rpa/) [RPA framework](https://rpaframework.org/) automation tasks. It is based on Robocorp [RCC toolchain](https://robocorp.com/docs/rcc/overview) and [Camunda external task client for Node JS](https://github.com/camunda/camunda-external-task-client-js).

`carrot-rcc` executes automation tasks built and wrapped into robot.zip packages as instructed by [Robocorp documentation](https://robocorp.com/docs/). Single `carrot-rcc` service can subscribe multiple topics and execute tasks from same or different robot-packages concurrently, although only locally on the same computer. `carrot-rcc` should work fine on Windows, Linux and on MacOS.

```bash
usage: carrot-rcc [<robots>...]
                  [--base-url] [--authorization]
                  [--worker-id] [--max-tasks] [--poll-interval]
                  [--rcc-executable] [--rcc-encoding] [--rcc-telemetry]
                  [--rcc-controller] [--rcc-fixed-spaces]
                  [--vault-addr] [--vault-token]
                  [--healthz-host] [--healthz-port]
                  [--log-level]
                  [-h] [--help]

<robots> could also be passed as a comma separated env RCC_ROBOTS

options:

  --base-url[=<url>]                       [env: CAMUNDA_API_BASE_URL] [default: http://localhost:8080/engine-rest]
  --authorization[=<header>]               [env: CAMUNDA_API_AUTHORIZATION] [example: Basic ZGVtbzpkZW1v]

  --worker-id[=<string>]                   [env: CLIENT_WORKER_ID] [default: carrot-rcc]
  --max-tasks[=<cpus>]                     [env: CLIENT_MAX_TASKS] [default: [cpu count]]
  --poll-interval[=<milliseconds>]         [env: CLIENT_POLL_INTERVAL] [default: 60000]
  --log-level[=<debug|info|warn|error>]    [env: CLIENT_LOG_LEVEL] [default: info]

  --rcc-executable[=<path>]                [env: RCC_EXECUTABLE] (or RCC_EXE) [default: rcc]
  --rcc-controller[=<controller>]          [env: RCC_CONTROLLER] [default: carrot]
  --rcc-encoding[=<encoding>]              [env: RCC_ENCODING] [default: utf-8]
  --rcc-telemetry                          [env: RCC_TELEMETRY] (default: do not track)
  --rcc-fixed-spaces                       [env: RCC_FIXED_SPACES] (default: circulate spaces)

  --vault-addr[=<addr>]                    [env: VAULT_ADDR] [default: http://127.0.0.1:8200]
  --vault-token[=<token>]                  [env: VAULT_TOKEN] [default: token]

  -h, --help

examples:

  $ carrot-rcc robot1.zip

  $ carrot-rcc robot1.zip robot2.zip --log-level=debug

  $ RCC_ROBOTS="robot1.zip,robot2.zip" LOG_LEVEL="debug" carrot-rcc

  $ CAMUNDA_API_AUTHORIZATION="Bearer MY_TOKEN" carrot-rcc robot1.zip
```

Design
======

When `carrot-rcc` is started, it examines every given robot-package and examines available task names from their `robot.yaml`. Currently, `carrot-rcc` can only find packages preloaded onto local filesystem.

Then `carrot-rcc` subscribes every found task name as they were Camunda external task topics, and starts listening for new tasks for its topics to become available at Camunda.

[![](https://mermaid.ink/img/eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgcGFydGljaXBhbnQgQ2FtdW5kYVxuICAgIHBhcnRpY2lwYW50IENhcnJvdFxuICAgIHBhcnRpY2lwYW50IFJDQ1xuICAgIHBhcnRpY2lwYW50IFJvYm90XG4gICAgUGFydGljaXBhbnQgV29yayBpdGVtXG5cbiAgICBDYXJyb3QtPj5DYW11bmRhOiBGZXRjaCBhbmQgbG9ja1xuICAgIGxvb3BcbiAgICBDYW11bmRhLT4-K0NhcnJvdDogVGFza1xuICAgIHBhclxuICAgIENhcnJvdC0-PitSQ0M6IFVucGFjayByb2JvdFxuICAgIFJDQy0tPj4tQ2Fycm90OiBbZXhpdCBjb2RlXVxuICAgIENhcnJvdC0-PitXb3JrIGl0ZW06IENyZWF0ZSB3b3JrIGl0ZW1cbiAgICBDYXJyb3QtPj4rUkNDOiBSdW4gcm9ib3RcbiAgICBOb3RlIG92ZXIgUkNDOiBTZXR1cCBlbnZpcm9ubWVudFxuICAgIFJDQy0-PitSb2JvdDogUnVuIHJvYm90XG4gICAgUm9ib3QtPj5Xb3JrIGl0ZW06IExvYWQgd29yayBpdGVtXG4gICAgV29yayBpdGVtLS0-PlJvYm90OiBbd29yayBpdGVtXVxuICAgIE5vdGUgb3ZlciBSb2JvdDogQXV0b21hdGlvblxuICAgIFJvYm90LT4-V29yayBpdGVtOiBTYXZlIHdvcmsgaXRlbVxuICAgIFJvYm90LS0-Pi1SQ0M6IFtleGl0IGNvZGVdXG4gICAgTm90ZSBvdmVyIFJDQzogVGVhcmRvd24gZW52aXJvbm1lbnRcbiAgICBSQ0MtLT4-LUNhcnJvdDogW2V4aXQgY29kZV1cbiAgICBhbmRcbiAgICBsb29wXG4gICAgQ2Fycm90LS0-PkNhbXVuZGE6IEV4dGVuZCBsb2NrXG4gICAgZW5kXG4gICAgZW5kXG4gICAgQ2Fycm90LT4-V29yayBpdGVtOiBMb2FkIHdvcmsgaXRlbVxuICAgIFdvcmsgaXRlbS0tPj4tQ2Fycm90OiBbd29yayBpdGVtXVxuICAgIENhcnJvdC0tPj5DYW11bmRhOiBVcGRhdGUgdmFyaWFibGVzXG4gICAgYWx0XG4gICAgQ2Fycm90LS0-PkNhbXVuZGE6IENvbXBsZXRlIHRhc2tcbiAgICBlbHNlXG4gICAgQ2Fycm90LS0-Pi1DYW11bmRhOiBIYW5kbGUgZmFpbHVyZVxuICAgIGVuZFxuICAgIGVuZFxuIiwibWVybWFpZCI6eyJ0aGVtZSI6ImRlZmF1bHQifSwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ)](https://mermaid-js.github.io/mermaid-live-editor/edit##eyJjb2RlIjoic2VxdWVuY2VEaWFncmFtXG4gICAgcGFydGljaXBhbnQgQ2FtdW5kYVxuICAgIHBhcnRpY2lwYW50IENhcnJvdFxuICAgIHBhcnRpY2lwYW50IFJDQ1xuICAgIHBhcnRpY2lwYW50IFJvYm90XG4gICAgUGFydGljaXBhbnQgV29yayBpdGVtXG5cbiAgICBDYXJyb3QtPj5DYW11bmRhOiBGZXRjaCBhbmQgbG9ja1xuICAgIGxvb3BcbiAgICBDYW11bmRhLT4-K0NhcnJvdDogVGFza1xuICAgIHBhclxuICAgIENhcnJvdC0-PitSQ0M6IFVucGFjayByb2JvdFxuICAgIFJDQy0tPj4tQ2Fycm90OiBbZXhpdCBjb2RlXVxuICAgIENhcnJvdC0-PitXb3JrIGl0ZW06IENyZWF0ZSB3b3JrIGl0ZW1cbiAgICBDYXJyb3QtPj4rUkNDOiBSdW4gcm9ib3RcbiAgICBOb3RlIG92ZXIgUkNDOiBTZXR1cCBlbnZpcm9ubWVudFxuICAgIFJDQy0-PitSb2JvdDogUnVuIHJvYm90XG4gICAgUm9ib3QtPj5Xb3JrIGl0ZW06IExvYWQgd29yayBpdGVtXG4gICAgV29yayBpdGVtLS0-PlJvYm90OiBbd29yayBpdGVtXVxuICAgIE5vdGUgb3ZlciBSb2JvdDogQXV0b21hdGlvXG4gICAgUm9ib3QtPj5Xb3JrIGl0ZW06IFNhdmUgd29yayBpdGVtXG4gICAgUm9ib3QtLT4-LVJDQzogW2V4aXQgY29kZV1cbiAgICBOb3RlIG92ZXIgUkNDOiBUZWFyZG93biBlbnZpcm9ubWVudFxuICAgIFJDQy0tPj4tQ2Fycm90OiBbZXhpdCBjb2RlXVxuICAgIGFuZFxuICAgIGxvb3BcbiAgICBDYXJyb3QtLT4-Q2FtdW5kYTogRXh0ZW5kIGxvY2tcbiAgICBlbmRcbiAgICBlbmRcbiAgICBDYXJyb3QtPj5Xb3JrIGl0ZW06IExvYWQgd29yayBpdGVtXG4gICAgV29yayBpdGVtLS0-Pi1DYXJyb3Q6IFt3b3JrIGl0ZW1dXG4gICAgQ2Fycm90LS0-PkNhbXVuZGE6IFVwZGF0ZSB2YXJpYWJsZXNcbiAgICBhbHRcbiAgICBDYXJyb3QtLT4-Q2FtdW5kYTogQ29tcGxldGUgdGFza1xuICAgIGVsc2VcbiAgICBDYXJyb3QtLT4-LUNhbXVuZGE6IEhhbmRsZSBmYWlsdXJlXG4gICAgZW5kXG4gICAgZW5kXG4iLCJtZXJtYWlkIjoie1xuICBcInRoZW1lXCI6IFwiZGVmYXVsdFwiXG59IiwidXBkYXRlRWRpdG9yIjpmYWxzZSwiYXV0b1N5bmMiOnRydWUsInVwZGF0ZURpYWdyYW0iOmZhbHNlfQ)

On a new task, `carrot-rcc` remembers which topic was mapped to which task on which robot-package, and unpacks the correct robot-package into a new temporary directory. Then it creates another temporary directory with all external task variables and files as a local [robot work item](https://robocorp.com/docs/libraries/rpa-framework/rpa-robocorp-workitems).

Similarly to work item, for convenience, all `carrot-rcc` process environment variables are made available as `env` secret to keep their use out of Robot Framework logs when used with [RPA framework's Secrets -library](https://robocorp.com/docs/libraries/rpa-framework/rpa-robocorp-vault).

Next [RCC](https://robocorp.com/docs/rcc/overview) is called to resolve robot's dependencies and execute the robot. Robot package may declare any available Conda or Pip package as its dependency. For example, this makes it possible to have [fully functional browser automation stack as a task dependency](https://github.com/datakurre/carrot-rcc/blob/main/xkcd-bot/conda.yaml) independently what the local machine actually has available. RCC caches the dependency environments on the machine to enable their fast re-use.

Finally, `carrot-rcc` saves all the changed and added variables from the saved work item back to Camunda. In addition, it also saves full [Robot Framework execution logs](https://robotframework.org/robotframework/latest/RobotFrameworkUserGuide.html#log-file). All these are saved back into the task execution context, to leave their further use for the BPMN designer. At the end `carrot-rcc` either completes of fails the task at Camunda.

[![Screencast of carrot-rcc in action](https://github.com/datakurre/carrot-rcc/raw/main/example-process.gif)](https://github.com/datakurre/carrot-rcc/raw/main/example-process.gif)


Usage
=====

`carrot-rcc` requires only [NodeJS](https://nodejs.org/en/) 12 or later and expects [RCC](https://downloads.robocorp.com/rcc/releases/index.html) to be on the environment PATH. RCC location may also be configured manually with ``--rcc-executable`` argument.

It is also possible to bootstrap everything with just using RCC:

1. Create a directory for `carrot-rcc` and download [RCC](https://downloads.robocorp.com/rcc/releases/index.html) into that directory.

2. Download an example [conda.yaml](https://raw.githubusercontent.com/datakurre/carrot-rcc/main/conda.yaml) defining the requirements for `carrot-rcc`.

3. Install `carrot-rcc` into RCC managed environment with

   ```bash
   $ rcc holotree variables conda.yaml > activate.sh
   ```
   or
   ```bash
   $ rcc.exe holotree variables conda.yaml > activate.bat
   ```

4. And activate the environment:

   ```bash
   $ source activate.sh
   ```
   or
   ```bash
   $ .\activate.bat
   ```

Done. Now `carrot-rcc` should be ready to be run, for example:

```bash
$ carrot-rcc robot.zip --base-url=http://localhost:8080/engine-rest --log-level=debug
```
or
```bash
$ carrot-rcc.exe robot.zip --base-url=http://192.168.86.156:8080/engine-rest --log-level=debug
```

The project's repository includes [example Camunda processes](https://github.com/datakurre/carrot-rcc/tree/main/camunda/deployment) with example RCC compatible robots ([1](https://github.com/datakurre/carrot-rcc/blob/main/xkcd-bot/robot.zip?raw=true), [2](https://github.com/datakurre/carrot-rcc/blob/main/fleamarket-bot/robot.zip?raw=true)) available.

![](https://github.com/datakurre/carrot-rcc/raw/main/example-process.png)

Vault support
=============

`carrot-rcc` has some support for [HashiCorp Vault KV secrets engine](https://www.vaultproject.io/docs/secrets/kv). When working `VAULT_ADDR` and `VAULT_TOKEN` set, `carrot_rcc` will resolve secrets defined in each robots' `robot.yaml` each time before a robot execution. 

An example `robot.yaml` with secrets:

```yaml
tasks:

  Camunda Topic:
    robotTaskName:
      My Robot Task

vault:
  my-secret: /secret-engine-path/data/my-secret-path

condaConfigFile:
  conda.yaml

artifactsDir:
  output
```

Note: `carrot-rcc` does NOT manage renewal for the given `VAULT_TOKEN`.
