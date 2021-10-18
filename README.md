# esbuild-plugin-altv-dev-server

[esbuild](https://esbuild.github.io/) plugin for extremely fast serverside development using JS/TS on alt:V.

This plugin imports `alt-server` once at the top of the bundle and replaces all your `alt-server` imports with its common variable.
The "dev" in the name means that this plugin is intended only for developing a server script. It allows you to use the server restart command
on your resource without the need for a complete restart of the server, as well as a reconnect on the client, 
because internally all the created alt:V entities (baseobjects) are automatically deleted on "resourceStop" of your script resource

### Installation

#### Download the plugin

The plugin is available via npm:

```
npm i -D esbuild-plugin-altv-dev-server
```

```
yarn add -D esbuild-plugin-altv-dev-server
```

#### Add the plugin to your esbuild config

```js
import altvDevServer from "esbuild-plugin-altv-dev-server"

esbuild.build({
  entryPoints: ["src/main.js"],
  outfile: "dist/bundle.js",
  bundle: true,
  plugins: [altvDevServer()],
})
```
