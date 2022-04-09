import alt from 'alt-server'

(() => {
  const defaultJSFuncProps = {
    length: true,
    name: true,
    arguments: true,
    caller: true,
    prototype: true,
  }
  const pluginLogPrefix = '[esbuild-altv-dev]'
  const pluginMetaPrefix = '___ALTV_DEV_SERVER'
  const connectedPlayerIds = `${pluginMetaPrefix}_CONNECTED_PLAYER_IDS`

  const {
    BaseObject,
    WorldObject,
    Entity,
    Blip,
    Colshape,
    Player,
    resourceName,
    defaultDimension,
    setMeta: setAltMeta,
    getMeta: getAltMeta,
  } = alt

  const baseObjects = new Set()
  const clearPlayersMeta = overwritePlayerMetaMethods(Player)
  const clearAltMeta = overwriteAltMetaMethods()

  for (const key in alt) {
    const baseObjectClass = alt[key]
    const proto = baseObjectClass.prototype

    if (!(
      proto instanceof BaseObject &&
      baseObjectClass !== BaseObject &&
      baseObjectClass !== WorldObject &&
      baseObjectClass !== Entity &&
      baseObjectClass !== Blip &&
      baseObjectClass !== Colshape &&
      baseObjectClass !== Player
    )) continue

    alt[key] = wrapBaseObjectChildClass(baseObjectClass)
  }

  alt.on('resourceStop', () => {
    for (const obj of baseObjects) {
      obj.destroy()
    }

    clearPlayersMeta()
    clearAltMeta()
  })

  if (typeof ___ALTV_DEV_SERVER_HR_FS___ !== 'undefined') initHotReload()
  if (typeof ___ALTV_DEV_SERVER_RECONNECT_PLAYERS_DELAY___ !== 'undefined') initReconnectPlayers()
  if (typeof ___ALTV_DEV_SERVER_RES_COMMAND_NAME___ !== 'undefined') initResCommand(___ALTV_DEV_SERVER_RES_COMMAND_NAME___)

  initPlayerPrototypeTempFix()

  // TODO delete meta handling for better clearing in resource stop
  /**
   *
   * @param {typeof alt.Player} Player
   */
  function overwritePlayerMetaMethods (Player) {
    const proto = Player.prototype

    const metaStoreKey = Symbol('metaStoreKey')
    const syncedMetaStoreKey = Symbol('syncedMetaStoreKey')
    const streamSyncedMetaStoreKey = Symbol('streamSyncedMetaStoreKey')
    const localMetaStoreKey = Symbol('localMetaStoreKey')

    const originalSetMeta = Symbol('originalSetMeta')
    const originalSetSyncedMeta = Symbol('originalSetSyncedMeta')
    const originalSetStreamSyncedMeta = Symbol('originalSetStreamSyncedMeta')
    const originalSetLocalMeta = Symbol('originalSetLocalMeta')

    proto[originalSetMeta] = proto.setMeta
    proto[originalSetSyncedMeta] = proto.setSyncedMeta
    proto[originalSetStreamSyncedMeta] = proto.setStreamSyncedMeta
    proto[originalSetLocalMeta] = proto.setLocalMeta

    const defineMetaSetter = (originalMethodKey, storeKey) =>
      function (key, value) {
        this[originalMethodKey](key, value)

        this[storeKey] = this[storeKey] || {}
        this[storeKey][key] = value
      }

    proto.setMeta = defineMetaSetter(originalSetMeta, metaStoreKey)
    proto.setSyncedMeta = defineMetaSetter(originalSetSyncedMeta, syncedMetaStoreKey)
    proto.setStreamSyncedMeta = defineMetaSetter(originalSetStreamSyncedMeta, streamSyncedMetaStoreKey)
    proto.setLocalMeta = defineMetaSetter(originalSetLocalMeta, localMetaStoreKey)

    return () => {
      const players = alt.Player.all

      for (let i = 0; i < players.length; i++) {
        const player = players[i]

        for (const key in player[metaStoreKey]) {
          player.deleteMeta(key)
        }

        for (const key in player[syncedMetaStoreKey]) {
          player.deleteSyncedMeta(key)
        }

        for (const key in player[streamSyncedMetaStoreKey]) {
          player.deleteStreamSyncedMeta(key)
        }

        for (const key in player[localMetaStoreKey]) {
          player.deleteLocalMeta(key)
        }
      }
    }
  }

  function wrapBaseObjectChildClass (BaseObjectChild) {
    const proto = BaseObjectChild.prototype
    const originalDestroy = Symbol('originalDestroy')

    proto[originalDestroy] = proto.destroy

    proto.destroy = function () {
      try {
        baseObjects.delete(this)
        this[originalDestroy]()
        // alt.log('destroyed baseobject:', BaseObjectChild.name)
      } catch (error) {
        logError(`failed to destroy alt.${BaseObjectChild.name} error:`)
        throw error
      }
    }

    const WrappedBaseObjectChild = function (...args) {
      try {
        const baseObject = new BaseObjectChild(...args)

        baseObjects.add(baseObject)
        // fix prototype in inherited from altv classes
        baseObject.__proto__ = this.__proto__

        return baseObject
      } catch (error) {
        logError(`failed to create alt.${BaseObjectChild.name} error:`)
        throw error
      }
    }

    WrappedBaseObjectChild.prototype = BaseObjectChild.prototype
    Object.defineProperty(WrappedBaseObjectChild, 'name', {
      value: BaseObjectChild.name,
    })

    try {
      const originalKeys = Object.keys(BaseObjectChild)

      // wrap all static stuff from original altv class
      for (const key of originalKeys) {
        if (defaultJSFuncProps[key]) continue

        try {
          // alt.log(`wrapping class: ${BaseObjectChild.name} key: ${key}`)
          const { value, set } = Object.getOwnPropertyDescriptor(BaseObjectChild, key)

          // static method
          if (typeof value === 'function') {
            WrappedBaseObjectChild[key] = BaseObjectChild[key]
            // static getter/setter
          } else {
            Object.defineProperty(WrappedBaseObjectChild, key, {
              get: () => BaseObjectChild[key],
              set: set?.bind(BaseObjectChild),
            })
          }
        } catch (e) {
          logError(
            `detected broken alt.${BaseObjectChild.name} static property: ${key}. \n`,
            e.stack,
          )
        }
      }
    } catch (e) {
      logError(e.stack)
    }

    return WrappedBaseObjectChild
  }

  function initHotReload () {
    const MIN_FILE_CHANGE_MS = 200
    let lastBundleChange = 0

    ___ALTV_DEV_SERVER_HR_FS___.watch(___ALTV_DEV_SERVER_HR_BUNDLE_PATH___, () => {
      const now = +new Date()
      const elapsed = (now - lastBundleChange)

      if (elapsed < MIN_FILE_CHANGE_MS) return
      lastBundleChange = now

      log(`~cl~[hot-reload]~w~ restarting ~gl~${resourceName}~w~ resource`)
      restartResource()
    })

    if (typeof ___ALTV_DEV_SERVER_HR_CLIENT_PATH___ === 'string') {
      ___ALTV_DEV_SERVER_HR_FS___.watch(___ALTV_DEV_SERVER_HR_CLIENT_PATH___, () => {
        const now = +new Date()
        const elapsed = (now - lastBundleChange)

        if (elapsed < MIN_FILE_CHANGE_MS) return
        lastBundleChange = now

        log(`~cl~[hot-reload]~w~ restarting ~gl~${resourceName}~w~ resource (client change)`)
        restartResource()
      })
    }
  }

  function initReconnectPlayers () {
    const resourceRestartedKey = `${pluginMetaPrefix}_${resourceName}_RESTARTED___`
    const initialPos = { x: 0, y: 0, z: 72 }

    if (!getAltMeta(resourceRestartedKey)) {
      setAltMeta(resourceRestartedKey, true)
      return
    }

    /**
     * a temp fix for alt:V prototype bug https://github.com/altmp/altv-js-module/issues/106
     */
    const playerIds = getAltMeta(connectedPlayerIds)
    if (!playerIds?.length) return

    log(`start a timer for ~cl~${___ALTV_DEV_SERVER_RECONNECT_PLAYERS_DELAY___}~w~ ms to reconnect players (${playerIds.length})`)

    alt.setTimeout(() => {
      for (const id of playerIds) {
        const p = alt.Player.getByID(id)
        if (!p) continue

        p.dimension = defaultDimension
        p.pos = initialPos
        p.removeAllWeapons()
        p.clearBloodDamage()
        alt.emit('playerConnect', p)
      }
    }, ___ALTV_DEV_SERVER_RECONNECT_PLAYERS_DELAY___)
  }

  /**
   * a temp fix for alt:V prototype bug https://github.com/altmp/altv-js-module/issues/106
   */
  function initPlayerPrototypeTempFix () {
    const players = []

    alt.Player.all = players

    const updateMeta = () => setAltMeta(
      connectedPlayerIds,
      players.map(p => p.id),
    )

    alt.on('playerConnect', (player) => {
      players.push(player)
      updateMeta()
    })

    alt.on('playerDisconnect', (player) => {
      const idx = players.indexOf(player)
      if (idx === -1) return

      players.splice(idx, 1)
      updateMeta()
    })
  }

  function initResCommand (commandName) {
    const reconnectPlayersLog = typeof ___ALTV_DEV_SERVER_RECONNECT_PLAYERS_DELAY___ !== 'undefined'
      ? ' and reconnect players'
      : ''

    const commandLog = `~cl~[res]~w~ restarting ~gl~${resourceName}~w~ resource${reconnectPlayersLog}`

    alt.on('consoleCommand', (command) => {
      if (command !== commandName) return
      log(commandLog)
      restartResource()
    })
  }

  // TODO delete meta handling for better clearing in resource stop
  function overwriteAltMetaMethods () {
    const metaStoreKey = Symbol('metaStoreKey')
    const syncedMetaStoreKey = Symbol('syncedMetaStoreKey')

    const originalSetMeta = Symbol('originalSetMeta')
    const originalSetSyncedMeta = Symbol('originalSetSyncedMeta')

    alt[originalSetMeta] = alt.setMeta
    alt[originalSetSyncedMeta] = alt.setSyncedMeta

    const defineMetaSetter = (originalMethodKey, storeKey) =>
      function (key, value) {
        alt[originalMethodKey](key, value)

        alt[storeKey] = alt[storeKey] || {}
        alt[storeKey][key] = value
      }

    alt.setMeta = defineMetaSetter(originalSetMeta, metaStoreKey)
    alt.setSyncedMeta = defineMetaSetter(originalSetSyncedMeta, syncedMetaStoreKey)

    return () => {
      for (const key in alt[metaStoreKey]) alt.deleteMeta(key)
      for (const key in alt[syncedMetaStoreKey]) alt.deleteSyncedMeta(key)
    }
  }

  // TODO: add handling of "clientReady" client event
  function restartResource () {
    alt.restartResource(resourceName)
  }

  function logError (...args) {
    alt.logError(pluginLogPrefix, ...(args[0].stack ? [args[0].stack] : args))
    alt.logError(pluginLogPrefix, '(If this error is not due to your code, open an issue:')
    alt.logError(pluginLogPrefix, 'https://github.com/xxshady/esbuild-plugin-altv-dev-server/issues/new)', '\n')
  }

  function log (...args) {
    alt.log(`~lm~${pluginLogPrefix}~w~`, ...args)
  }
})()
