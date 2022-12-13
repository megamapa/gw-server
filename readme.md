<h1 align="center">GW-SERVER for node.js</h1>

<h5 align="center">Sponsors</h5>

<div align="center">
  <table cellpadding="5" cellspacing="0" border="0" align="center">
    <tr>
      <td><a href="https://targestar.com/"><img src="https://targestar.com/wp-content/uploads/2022/10/Targestar-favicon.png" width="200px"/></a></td>
      <td><a href="https://www.gpstracker-factory.com/"><img src="https://www.gpstracker-factory.com/wp-content/uploads/2018/05/logo.png" width="200px"/></a></td>
    </tr>
    <tr>
      <td colspan=2 align="center">
        <a href="https://github.com/sponsors/coreybutler"><img src="https://img.shields.io/github/sponsors/megamapa?label=Individual%20Sponsors&logo=github&style=social"/></a>
        &nbsp;<a href="https://github.com/sponsors/megamapa"><img src="https://img.shields.io/badge/-Become%20a%20Sponsor-yellow"/></a>
      </td>
    </tr>
  </table>
</div>
<br/>

## Overview

The GW-SERVER is a server made in [Node](https://nodejs.dev/en/) to work with Mobile DVR: GW-GR02,GW-GR03,GW-GR06.
If you need more information about this devices please visit [Target Star home page.](https://targestar.com/)

![gw-server for node](https://github.com/megamapa/gw-server/blob/main/img/gw-server-1.0.0-screenshot.png.png)

## Requirements
- [Node.js (v18.12.1)](https://nodejs.dev/en/)
- [NPM](https://github.com/npm/cli)
- [GIT](https://git-scm.com/downloads)
- [REDIS](https://github.com/redis/redis)
- [MySQL](https://www.mysql.com/)

## Getting started

> NOTE: This guide presumes you already have Node, NPM, GIT, REDIS and MySQL installed.

1. Clone the [gw-server](https://github.com/megamapa/gw-server):

```sh
git clone https://github.com/megamapa/gw-server && cd gw-server
```

2. Install the required Node dependencies:

```sh
npm install
```

3. Create DB files in MySQL server:

```sh
mysql> CREATE USER 'gw_us'@'localhost' IDENTIFIED BY 'P@s$w0rd123!';
mysql> GRANT CREATE, ALTER, DROP, INSERT, UPDATE, DELETE, SELECT, REFERENCES, RELOAD on *.* TO 'gw_us'@'localhost' WITH GRANT OPTION;
mysql> CREATE DATABASE gw_db;
mysql> use gw_db;
mysql> source src/gw_db.sql;
```

4. Create file ".env" and fill constants or rename "variables.sample.env":

```sh

# IP and port
SrvIP = 127.0.0.1
SrvPort = 50910

# MySQL database
DB_host = "127.0.0.1"
DB_name = "gw_db"
DB_user = "gw_us"
DB_pass = "P@s$w0rd123!"

# Redis database
RD_host = "127.0.0.1"
RD_Port = 6379

# Debug
ShowLog = true

```

## Run app
```sh
npm run server
```

## Documentation

If you want to go deeper, the [doc/][def] folder contains the protocols for communication between the server and the device.

## Author & support

This package was created by [MegaMapa](http://megamapa.com/) but hopefully developed and maintained by [Great Will](https://www.gpstracker-factory.com/) and others.

[def]: https://github.com/megamapa/gw-server/tree/main/docs