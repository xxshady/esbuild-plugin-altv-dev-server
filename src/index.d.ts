import { Plugin } from 'esbuild'

export interface IReconnectPlayers {
  delay: number
}

export interface IOptions {
  hotReload?: boolean
  handleStartupErrors?: boolean
  reconnectPlayers?: boolean | IReconnectPlayers
}

declare function altvServerDev (options?: IOptions): Plugin

export default altvServerDev