import { Plugin } from 'esbuild'

export interface IReconnectPlayers {
  delay: number
}

export interface IHotReload {
  clientPath: string
}

export interface IOptions {
  hotReload?: boolean | IHotReload
  handleStartupErrors?: boolean
  reconnectPlayers?: boolean | IReconnectPlayers
}

declare function altvServerDev (options?: IOptions): Plugin

export default altvServerDev