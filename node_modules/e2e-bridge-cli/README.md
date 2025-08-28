# e2e-bridge-cli

A command-line interface to E2E Bridge based on Node.js

## Features

* xUML, Node.js or Java Services
    * list
    * deploy
    * remove
    * start
    * stop
    * kill
    * view / set service preferences
    * view service status
    * download repository

* xUML and Node.js
    * view / set service settings

* xUML Services only
    * view extended information
    * list / view model notes
    * view / set custom notes
    * list running sessions
    * cancelling running sessions

* Node.js Services only
    * pack

* Resources (general, java, xslt)
    * list
    * delete
    * upload

* Global variables
    * list
    
* User groups  (available as of **Bridge API 2.8.0**)
    * list
    * create
    * modify
    * delete
    
* Users  (available as of **Bridge API 2.8.0**)
    * list
    * create
    * modify
    * delete

* Continuous delivery
	* deliver
* Can be installed as global utility

## Installation
``` bash
$ npm install [-g] e2e-bridge-cli
```
Global installation may require additional privileges.

## Usage
This guide assumes global installation. If you installed locally, replace `e2ebridge` with `node path/to/app.js` (or, on linux `path/to/app.js`).

To list services:
``` bash
$ e2ebridge services [[-n|--nodejs]|[-j|--java]] [Bridge connection]
```

To view / set service preferences:
- If no `pref * *` arguments are given, the current service preferences are displayed
  ``` bash
  $ e2ebridge preferences ${ServiceName} [[-n|--nodejs]|[-j|--java]] [pref ${PreferenceName} ${PreferenceValue}]... [Bridge connection]
  ```

To list available model notes for xUML service:
``` bash
$ e2ebridge modelnotes ${ServiceName} [Bridge connection]
```

To view chosen model notes for xUML service:
``` bash
$ e2ebridge modelnotes ${ServiceName} ${NotesFileName} [Bridge connection]
```

To view / set service settings:
- If no `set * *` arguments are given, the current service settings are displayed
  ``` bash
  $ e2ebridge settings ${ServiceName} [-n|--nodejs] [set ${SettingName} ${SettingValue}]... [Bridge connection]
  ```

To start or remove a xUML, Node.js (-n) or Java (-j) service:
``` bash
$ e2ebridge start|remove ${ServiceName} [[-n|--nodejs]|[-j|--java]] [Bridge connection]
```

To stop or kill a xUML, Node.js (-n) or Java (-j) service:
``` bash
$ e2ebridge stop|kill ${ServiceName} [[-n|--nodejs]|[-j|--java]] [Bridge connection] [Stop options]
```

To upload a resource:
``` bash
$ e2ebridge resources --upload ${FilePath} [Bridge connection]
```

To list user groups or get single group:
``` bash
$ e2ebridge groups [${id}] [Bridge connection]
```

To remove user group:
``` bash
$ e2ebridge groups ${id} (-d|--delete) [Bridge connection]
```

To create or modify user group:
``` bash
$ e2ebridge groups ${id} [-m|--modify] [--name ${GroupName}] [--role ${AssignedRole}] [Bridge connection]
```

To list users or get single user:
``` bash
$ e2ebridge users [${id}] [Bridge connection]
```

To remove user:
``` bash
$ e2ebridge users ${id} (-d|--delete) [Bridge connection]
```

To create user:
``` bash
$ e2ebridge users ${id} --name ${UserName} [--active [true|false]] --group ${GroupName} --user-password ${UserPassword} [Bridge connection]
```

To modify user:
``` bash
$ e2ebridge users ${id} (-m|--modify) [--name ${UserName}] [--active [true|false]] [--group ${GroupName}] [--user-password ${UserPassword}] [Bridge connection]
```

To pack a Node.js service:
- A .e2eignore file can be used to ignore some files when packing.
- Path to directory is mandatory.
- If path to repository is omitted a "<package.name>-<package.version>.zip" file is created in the current working directory. If package information is missing an error will be thrown.
- During pack no file should be modified otherwise error "Didn't get expected byte count" can happen.
  To prevent packing the current package or older packages place them outside the source
  folder or put package names into .e2eignore.
  ``` bash
  $ e2ebridge pack ${path/to/directory} [${path/to/repository}]
  ```

To deploy a service:
- If path to repository is a directory it will be packed and published. Only useful for Node.js services.
- If path to repository is omitted the current directory is used. Only useful for Node.js services.
  ``` bash
  $ e2ebridge deploy [${path/to/repository}|${path/to/directory}] [Bridge connection] [-o [deployment option]]...
  ```
  
To deliver services to Bridge instances

``` bash
$ e2ebridge deliver --domain ${DomainName} [--node ${NodeName}]... [--solution ${SolutionName}]... [--service ${ServiceName}]... [--break-on-error] [--dry-run]
```
See [documentation of deliver command](README_deliver.md "e2e-bridge-cli: deliver Command") for more information and examples.

To get usage help:
``` bash
$ e2ebridge --help
```

### Bridge connection:
* `-s|--scheme http[s]|--protocol http[s]` The scheme/protocol to be used. Defaults to https.
* `-h|--host <FQDN bridge host>` The host, that runs the bridge. Defaults to localhost.
* `-p|--port <bridge port>` The port of the bridge. Defaults to 8080.
* `-u|--user <bridge user>` User that has the right to perform operation on bridge.
Required. If not given, you'll be prompted for it.
* `-P|--password <password for bridge user>` Password for the user.
Required. If not given, you'll prompted for it, what is recommended as giving your password
in command line will expose it in your shell's history. Password is masked during prompt.

### Deployment options:
* **startup**: Launch service after deployment.
* **overwrite**: Overwrite existing service if one already exists.
* **overwritePrefs**: Overwrite settings and preferences too.
* **npmInstall**: Run 'npm install --ignore-scripts' (applies to Node.js services only)
* **runScripts**: Run 'npm install' (applies to Node.js services only)
* **instanceName=\<instance name\>**: Choose a different instance name  (applies to Node.js services only)
* **stopTimeout=\<seconds\>**: Allow at least that many seconds before assuming that stop command failed (available as of **Bridge API 2.9.0**)
* **allowKill**: If stopping the service before deployment fails, try to kill it (available as of **Bridge API 2.9.0**)

### Stop options
* **stopTimeout=\<seconds\>**: Allow at least that many seconds before assuming that stop command failed (available as of **Bridge API 2.9.0**)

### Other Switches:
* `-n|--nodejs` Assume that the service is a Node.js service. This is ignored for "deploy" and illegal for "kill".
* `-N` The same as `-n`. Kept for backwards compatibility only.
* `-j|--java` Assume that the service is a Java service.
* `-g|--git` Use "git archive" for building the repository. This is ignored for all commands but "pack".

### Service Preferences:
Currently the Bridge supports the following preferences:
- All services:
  * automaticStartup : boolean
  * automaticRestart : boolean
  * owner : string \[readonly\]

- xUML services:
  * bridgeServerLogLevel : string \[None, Fatal, Error, Warning, Info, Debug\]
  * transactionLogLevel  : string \[None, Custom, Service, IOExternal, IOInternal\]
  * transactionLogRotInterval : \[HOURLY, DAILY\]

- Node.js and Java services:
  * minimumUptimeInSeconds : integer
  * uiUrl: string
  * uiTabTitle : string

- Java services:
  * remoteDebugPort : integer


## Migrating from version 1
* Support for nodes has been dropped. Therefore the `-n` parameter now signals a Node.js service. The `-N` continues to work though.

* The deployment options is no more a comma-separated list. To pass multiple options, use multiple `-o` parameters.
Also the names of the options got changed. Changes are summarized in the below table:

    | Old name              | New name     |
    |-----------------------|--------------|
    |settings               |overwritePrefs|
    |npm_install            |npmInstall    |
    |npm_install_run_scripts|runScripts    |
    |instance_name          |instanceName  |

* The `--shrinkwrap` option has been dropped. Npm 5 or newer should be used as it automatically creates `package-lock.json` which provides the same functionality. This file will always be packed if present.


## Usage Examples
* __List__ all Node-js services
  ``` bash
  $ e2ebridge services --nodejs -u admin -P admin
  ```
  Output:
  ``` bash
  ┌──────────────────┬────────┬─────────┐
  │     Service      │  Type  │ Status  │
  ├──────────────────┼────────┼─────────┤
  │ e2e-dashboard-ui │ NodeJs │ Stopped │
  │ helloworld       │ NodeJs │ Running │
  └──────────────────┴────────┴─────────┘
  ```
* __Deploy__ *PurchaseOrderExample* to localhost
    ``` bash
    $ e2ebridge deploy /tmp/PurchaseOrderExample.rep -u admin -P admin
    ```

* __Deploy__ *PurchaseOrderExample* to some development server. Overwrite existing instance and startup service afterwards. Additionally do not expose your password in command line (you'll be prompted for it)
    ``` bash
    $ e2ebridge deploy /tmp/PurchaseOrderExample.rep -u admin -h devserver.my.org -o startup -o overwrite
    ```

* __Start__ *PurchaseOrderExample* on some development server.
    ``` bash
    $ e2ebridge start PurchaseOrderExample -u admin -h devserver.my.org
    ```

* __Start__ myNodeServie on some development server (a Node.js service).
    ``` bash
    $ e2ebridge start myNodeService -u admin -h devserver.my.org -n
    ```

* __Set automatic startup__ of *PurchaseOrderExample* on some development server.
    ``` bash
    $ e2ebridge preferences PurchaseOrderExample pref automaticStartup true -u admin -h devserver.my.org
    ```
    Output:
    ```
  ┌───────────────────────────┬───────┐
  │         Property          │ Value │
  ├───────────────────────────┼───────┤
  │ bridgeServerLogLevel      │ Info  │
  │ transactionLogLevel       │ None  │
  │ transactionLogRotInterval │ DAILY │
  │ automaticStartup          │ true  │
  │ automaticRestart          │ false │
  │ owner                     │ admin │
  └───────────────────────────┴───────┘
    ````

* Set Setting "global_Settings::Folder Name to move mails in that are skipped" of *PurchaseOrderExample* on some development server.
    ``` bash
    $ e2ebridge settings PurchaseOrderExample set "global_Settings::Folder Name to move mails in that are skipped" "SKIPPED" -u admin -h devserver.my.org
    ```
    Output:
A tabular list of all settings. The changed setting is printed in bold.

* Set MyNodeService's settings from local file:
    ```bash
    $ e2ebridge settings MyNodeService --upload ~/settings/MyNodeService.json -n -u admin
    ```
    Output:
JSON object representing the service's new settings.
