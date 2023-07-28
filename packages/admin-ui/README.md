# Mojaloop vnext admin UI


### Install
See notes in root dir of this repository
More information on how to install NVM: https://github.com/nvm-sh/nvm

## Use correct Node.js version
```bash
nvm use
```
(in the project directory)

## Install
```bash
npm install
```

## How to start the web app

### Start the local development server
In the root directory of the project (which contains the file "package.json"):

```bash
npm start
```

### Open the application in the browser

At this time a browser can be pointed to http://localhost:4200/ to start the application.


### Login

Try these default development credentials:
- user - superPass
- admin - superMegaPass


### Issues starting

 - opensslErrorStack (Only for node 18 and above versions) :
    - WINDOWS : On the terminal enter : ```export export NODE_OPTIONS=--openssl-legacy-provider```
    - UNIX : On the terminal : ```unset NODE_OPTIONS```
