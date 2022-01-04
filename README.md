# esbuild-plugin-altv-dev-server

[esbuild](https://esbuild.github.io/) plugin for extremely fast serverside development using JS/TS on [alt:V](https://altv.mp).

[![youtube](http://img.youtube.com/vi/M70sMF3eXN0/0.jpg)](http://www.youtube.com/watch?v=M70sMF3eXN0)

This tool allows you to use [server restart command](https://docs.altv.mp/articles/commandlineargs.html#server-commands) on your resource 
without the need for a complete restart of the server, as well as a reconnect on the client

#### So far, the plugin does not have the option of hot code reloading. [See planned feature](https://github.com/xxshady/esbuild-plugin-altv-dev-server/issues/3)

## Installation

### Download the plugin

The plugin is available via npm:

```
yarn add -D esbuild-plugin-altv-dev-server
```
```
npm i -D esbuild-plugin-altv-dev-server
```

### Usage

```js
import altvDevServer from "esbuild-plugin-altv-dev-server"

// change this depending on the build mode of the code
const devMode = true

esbuild.build({
  entryPoints: ["src/main.js"],
  outfile: "dist/bundle.js",
  bundle: true,
  watch: devMode,
  plugins: devMode 
    ? [altvDevServer({
      // enables auto restart of your resource,
      // emulation of reconnect players to the server (reconnectPlayers option) 
      // and resource startup error handling (handleStartupErrors option)
      hotReload: boolean,
      
      // these options are enabled automatically with hotReload and can be omitted:

      // enables auto emulation of players reconnect to the server
      // with some delay after resource start (default 200ms)
      // (for e.g. you need to wait until your database is loaded or any other async stuff)
      reconnectPlayers: boolean | { delay: number (ms) },
      // Handles exceptions during the resource startup "[Error] Failed to load resource <name>"
      handleStartupErrors: boolean
    })]
    : [],
})
```

### How it works?
Internally all the created serverside alt:V entities (baseobjects) and other data of server players are automatically deleted
on "resourceStop" event of your script resource.
Client scripts are automatically re-downloaded and reloaded when using [server restart command](https://docs.altv.mp/articles/commandlineargs.html#server-commands)

The "dev" in the name means that this plugin is intended only for developing a server script. 
