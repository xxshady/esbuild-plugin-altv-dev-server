import { Plugin } from 'esbuild'

export interface IReconnectPlayers {
  delay: number
}

export interface IHotReload {
  clientPath: string
}

export interface IStartupErrorsHandling {
  /**
   * default is `true`
   */
  moveExternalsOnTop?: boolean
}

export interface IOptions {
  /**
   * default is `false`
   */
  hotReload?: boolean | IHotReload
  /**
   * default value is dynamic and equivalent to `hotReload` (as boolean) option
   */
  handleStartupErrors?: boolean | IStartupErrorsHandling
  /**
   * default value is dynamic and equivalent to `hotReload` (as boolean) option
   */
  reconnectPlayers?: boolean | IReconnectPlayers
}

declare function altvServerDev (options?: IOptions): Plugin

export default altvServerDev