import alt from 'alt-server'

(() => {
  const BaseObject = alt.BaseObject
  const Player = alt.Player
  const baseObjects = new Set()

  const clearPlayersMeta = overwritePlayerMetaMethods(Player)

  for (const key in alt) {
    const baseObjectChild = alt[key]

    if (!(
      baseObjectChild !== BaseObject &&
      baseObjectChild !== Player &&
      baseObjectChild.prototype instanceof BaseObject
    )) continue

    alt[key] = class extends baseObjectChild {
      // eslint-disable-next-line constructor-super
      constructor (...args) {
        try {
          super(...args)
          baseObjects.add(this)
          // alt.log('created baseobject:', baseObjectChild.name)
        } catch (error) {
          alt.logError(`failed create alt.${baseObjectChild.name} error:`)
          throw error
        }
      }

      destroy () {
        try {
          baseObjects.delete(this)
          super.destroy()
          // alt.log('destroyed baseobject:', baseObjectChild.name)
        } catch (error) {
          alt.logError(`failed destroy alt.${baseObjectChild.name} error:`)
          throw error
        }
      }
    }
  }

  alt.on('resourceStop', () => {
    // alt.log('resourceStop baseobjects:', baseObjects.size)
    for (const obj of baseObjects) {
      obj.destroy()
      clearPlayersMeta()
    }
  })

  function overwritePlayerMetaMethods (Player) {
    const proto = Player.prototype

    const metaStoreKey = Symbol('metaStoreKey')
    const syncedMetaStoreKey = Symbol('syncedMetaStoreKey')
    const streamSyncedMetaStoreKey = Symbol('streamSyncedMetaStoreKey')

    const originalSetMeta = Symbol('originalSetMeta')
    const originalSetSyncedMeta = Symbol('originalSetSyncedMeta')
    const originalSetStreamSyncedMeta = Symbol('originalSetStreamSyncedMeta')

    proto[originalSetMeta] = proto.setMeta
    proto[originalSetSyncedMeta] = proto.setSyncedMeta
    proto[originalSetStreamSyncedMeta] = proto.setStreamSyncedMeta

    const defineMetaSetter = (originalMethodKey, storeKey) =>
      function (key, value) {
        this[originalMethodKey](key, value)

        this[storeKey] = this[storeKey] || {}
        this[storeKey][key] = value
      }

    proto.setMeta = defineMetaSetter(originalSetMeta, metaStoreKey)
    proto.setSyncedMeta = defineMetaSetter(originalSetSyncedMeta, syncedMetaStoreKey)
    proto.setStreamSyncedMeta = defineMetaSetter(originalSetStreamSyncedMeta, streamSyncedMetaStoreKey)

    return () => {
      const players = alt.Player.all

      for (let i = 0; i < players.length; i++) {
        const player = players[i]

        for (const key in player[metaStoreKey]) {
          // alt.log('deleteMeta', key)
          player.deleteMeta(key)
        }

        for (const key in player[syncedMetaStoreKey]) {
          player.deleteSyncedMeta(key)
        }

        for (const key in player[streamSyncedMetaStoreKey]) {
          player.deleteStreamSyncedMeta(key)
        }
      }
    }
  }
})()
