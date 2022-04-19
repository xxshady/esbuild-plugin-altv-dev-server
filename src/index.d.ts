import { Plugin } from 'esbuild'

export interface IReconnectPlayers {
  delay: number
}

export interface IHotReload {
  clientPath: string
  /**
   * ! EXPERIMENTAL !
   * 
   * It makes sure that server bundle is finally built 
   * and only then starts resource restart
   * 
   * default is `false`
   */
  serverBundleValidation?: boolean
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
   * Adds command "res" (for manual restart) to server console  (client soon).
   * 
   * Default is `true`
   */
  resCommand?: boolean
}

declare function altvServerDev (options?: IOptions): Plugin

export default altvServerDev