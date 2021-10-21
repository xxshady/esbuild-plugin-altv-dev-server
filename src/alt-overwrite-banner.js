import alt from 'alt-server'

(() => {
  const defaultJSFuncProps = {
    length: true,
    name: true,
    arguments: true,
    caller: true,
    prototype: true,
  }

  const {
    BaseObject,
    WorldObject,
    Entity,
    Blip,
    Colshape,
    Player,
  } = alt

  const baseObjects = new Set()
  const clearPlayersMeta = overwritePlayerMetaMethods(Player)

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
        alt.logError(`failed destroy alt.${BaseObjectChild.name} error:`)
        throw error
      }
    }

    const WrappedBaseObjectChild = function (...args) {
      try {
        const baseObject = new BaseObjectChild(...args)

        baseObjects.add(baseObject)
        // fix prototype in inherited from BaseObjectChild classes
        baseObject.__proto__ = this.__proto__

        return baseObject
        // alt.log('created baseobject:', BaseObjectChild.name)
      } catch (error) {
        alt.logError(`failed create alt.${BaseObjectChild.name} error:`)
        throw error
      }
    }

    WrappedBaseObjectChild.prototype = BaseObjectChild.prototype
    Object.defineProperty(WrappedBaseObjectChild, 'name', {
      value: BaseObjectChild.name,
    })

    const originalDescriptors = Object.getOwnPropertyDescriptors(BaseObjectChild)

    // wrap all static stuff from BaseObjectChild
    for (const key in originalDescriptors) {
      if (defaultJSFuncProps[key]) continue

      const { value, set } = originalDescriptors[key]

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
    }

    return WrappedBaseObjectChild
  }
})()
