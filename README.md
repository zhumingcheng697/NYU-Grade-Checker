# NYU-Grade-Checker

**A Script that Automatically Checks Grade on [NYU Albert](https://m.albert.nyu.edu/app/dashboard/grades).**

## Features

- Check for latest grades regularly after [set interval](#how-to-configure-configjson)

- Check for latest grades with [simple CLI commands](#cli-commands)

## How to Set Up

1. Clone this repo.

    ```bash
    $ git clone https://github.com/zhumingcheng697/NYU-Grade-Checker.git
    ```

2. Install necessary node modules.

    ```bash
    $ npm install
    ```

3. Configure either [`config.json`](#how-to-configure-configjson) or [`credential.txt`](#how-to-configure-credentialtxt).
   
   > The only way to customize the interval at which the program checks for new grades is through [`config.json`](#how-to-configure-configjson).

   > If you have set up `config.json` correctly, `credential.txt` will be ignored even if it has been set up.

4. Run the script `nyu-grade-checker.js`.

    ```bash
    $ node nyu-grade-checker.js
    ```
   or

    ```bash
    $ npm start
    ```

5. Start checking your latest grades!

## How to Configure `config.json`

You need to set your NetID and your password in `config.json`:

```json
{
  "net_id": <your_net_id>,
  "password": <your_password>
}
```

You can also optionally set the interval in minute at which the program checks for new grade in `config.json`:

```json
{
  "net_id": <your_net_id>,
  "password": <your_password>,
  "interval": <positive_interval_in_minute>
}
```

> The interval has to be a positive number equal to or greater than 5, or it will be set to 60 by default.

## How to Configure `credential.txt`

You need to set your NetID and your password in `credential.txt`:

```txt
<your_net_id>

<your_password>
```

> If you want to customize the interval at which the program checks for new grades, you have to [configure `config.json`](#how-to-configure-configjson) instead.

## CLI Commands

All the commands below will let the program check for the latest grades again:

- `grade`

- `check`
  
- `get`
