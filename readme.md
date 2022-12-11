<h1 align="center">GW-SERVER for node.js</h1>

<h5 align="center">Sponsors</h5>

<div align="center">
  <table cellpadding="5" cellspacing="0" border="0" align="center">
    <tr>
      <td><a href="https://www.gpstracker-factory.com/"><img src="https://www.gpstracker-factory.com/wp-content/uploads/2018/05/logo.png" width="200px"/></a></td>
    </tr>
    <tr>
      <td align="center">
        <a href="https://github.com/sponsors/coreybutler"><img src="https://img.shields.io/github/sponsors/megamapa?label=Individual%20Sponsors&logo=github&style=social"/></a>
        &nbsp;<a href="https://github.com/sponsors/megamapa"><img src="https://img.shields.io/badge/-Become%20a%20Sponsor-yellow"/></a>
      </td>
    </tr>
  </table>
</div>
<br/>

## Overview

The gw-server is a server made in [Node](https://nodejs.dev/en/) to work with Mobile DVR: GW-GR02,GW-GR03,GW-GR06.
If you need more information about this devices please visit [Great Will home page](https://www.gpstracker-factory.com/mobile-digital-video-recorders/)
## Requirements
- Node.js (v18.12.1)
- Git
- NPM
- REDIS

## Getting started

> NOTE: This guide presumes you already have Node, NPM and Git installed

1. Clone the [gw-server](https://github.com/megamapa/gw-server):

```sh
git clone https://github.com/megamapa/gw-server
```

2. Install the required Node dependencies:

```sh
npm install
```

3. Create DB files in MySQL server:

```sh
create dbsql.sql
```

4. Create file ".env" and fill constants:

```sh

# IP and port
SrvIP = 127.0.0.1
SrvPort = 99999

# SQL database
DB_host = "127.0.0.1"
DB_name = "gw_db"
DB_user = "gw_us"
DB_pass = "*******"

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

## Author & support

This package was created by [MegaMapa](http://megamapa.com/) but hopefully developed and maintained by [Great Will](https://www.gpstracker-factory.com/) and others.
