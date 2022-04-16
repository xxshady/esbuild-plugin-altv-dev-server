# esbuild-plugin-altv-dev-server

[esbuild](https://esbuild.github.io/) plugin for extremely fast development using JS/TS on [alt:V](https://altv.mp)

[![youtube](http://img.youtube.com/vi/pbezU0NRTLk/0.jpg)](http://www.youtube.com/watch?v=pbezU0NRTLk)

This plugin allows you to see code changes immediately (hot reload) without reconnecting and restarting the server 
(to restart resource manually, you can use [alt:V resource server commands](https://docs.altv.mp/articles/commandlineargs.html#:~:text=start%20%5Bresourcename%5D,Restarts%20a%20server%20resource%20by%20name)

## Client-side caution

Client-side is not currently fully supported at the moment, see issue #10

If your client-side script uses some events or other stuff that relay connect/disconnect information to the client, such as `"connectionComplete"`, `"disconnect"`, then you have to emulate their behavior in the dev environment yourself or replace them, e.g. `"disconnect"` can be replaced with `"resourceStop"`

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

[Ready alt:V resource example](/example-altv-resource)

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
      // you can also specify the path to the client, 
      // so that the plugin can restart the resource when the client code changes
      // (see example usage in example resource)
      // hotReload: { clientPath?: string }
      
      // These options (reconnectPlayers, handleStartupErrors) are enabled automatically with hotReload
      // and can be omitted:

      // enables auto emulation of players reconnect to the server
      // with some delay after resource start (default 200ms)
      // (for e.g. you need to wait until your database is loaded or any other async stuff)
      // default = hotReload (as boolean)
      reconnectPlayers: boolean | { delay?: number },
      
      // Handles exceptions during the resource startup "[Error] Failed to load resource <name>"
      // sub-option "moveExternalsOnTop" true by default
      // default = hotReload (as boolean)
      handleStartupErrors: boolean | { moveExternalsOnTop?: boolean }
    })]
    : [],
})
```

### How it works?
Internally all the created serverside alt:V entities (baseobjects) and other data of server players are automatically deleted
on "resourceStop" event of your script resource.
Client scripts are automatically re-downloaded and reloaded when using [server restart command](https://docs.altv.mp/articles/commandlineargs.html#server-commands)

The "dev" in the name means that this plugin is intended only for developing a server script. 
