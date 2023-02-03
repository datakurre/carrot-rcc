Changelog
=========


0.8.0 (2023-02-03)
------------------

- Fix issue, where bad neodoc (for --help) use caused slow startup
  [datakurre]
- Fix issue, which caused topic subscriptions were started twice
  [datakurre]
- Fix to properly handle retries and raise incident on failing
  'RPA.Robocorp.WorkItems.Release input work item'.
  [datakurre]
- Fix regression where execution without output work item returned complete
  input work item instead
  [datakurre]
- Add support for retries and retryTimeout keys on robot.yaml task
  [datakurre]
- Add support for 'RPA.Robocorp.WorkItems.Release input work item' for
  reporting otherwise successful run as either application or business error
  [datakurre]


0.7.1 (2022-10-25)
------------------

- Fix polling to sane defaults and map '--poll-interval' directly to long polling timeout
  [datakurre]


0.7.0 (2022-10-24)
------------------

- Change to allow the type of process variables to change on task completion
  [m0lentum]
- Fix README with recent RCC commands
  [datakurre]
