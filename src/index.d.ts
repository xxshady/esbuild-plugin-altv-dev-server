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
   * Default is `false`
   */
  hotReload?: boolean | IHotReload
  /**
   * Default value is dynamic and equivalent to `hotReload` (as boolean) option
   */
  handleStartupErrors?: boolean | IStartupErrorsHandling
  /**
   * Default value is dynamic and equivalent to `hotReload` (as boolean) option
   */
  reconnectPlayers?: boolean | IReconnectPlayers
  
  /**
   * Default is `true`. Adds command "res" (for manual restart) to server console  (client soon)
   */
  resCommand?: boolean
}

declare function altvServerDev (options?: IOptions): Plugin

export default altvServerDev