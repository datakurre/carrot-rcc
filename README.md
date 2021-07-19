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
  --poll-interval[=<milliseconds>]         [env: CLIENT_POLL_INTERVAL] [default: 30000]
  --log-level[=<debug|info|warn|error>]    [env: CLIENT_LOG_LEVEL] [default: info]

  --rcc-executable[=<path>]                [env: RCC_EXECUTABLE] [default: rcc]
  --rcc-encoding[=<encoding>]              [env: RCC_ENCODING] [default: utf-8]
  --rcc-telemetry                          [env: RCC_TELEMETRY] (default: do not track)

  -h, --help
```
