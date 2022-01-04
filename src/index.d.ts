import { Plugin } from 'esbuild'

interface IOptions {
  hotReload?: boolean
  handleStartupErrors?: boolean
}

declare function altvServerDev (options?: IOptions): Plugin

export default altvServerDev