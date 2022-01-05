
// --------------------- esbuild-plugin-altv-dev-server ---------------------
import ___ALTV_DEV_SERVER_HR_FS___ from "fs"
const ___ALTV_DEV_SERVER_HR_BUNDLE_PATH___ = "C:/altv-dev/ts-test-gm/resources/example-altv-resource/server-dist.js"
const ___ALTV_DEV_SERVER_HR_CLIENT_PATH___ = "C:/altv-dev/ts-test-gm/resources/example-altv-resource/client-dist.js"
const ___ALTV_DEV_SERVER_RECONNECT_PLAYERS_DELAY___ = 200
/* global ___ALTV_DEV_SERVER_HR_FS___ ___ALTV_DEV_SERVER_HR_BUNDLE_PATH___ ___ALTV_DEV_SERVER_RECONNECT_PLAYERS_DELAY___ ___ALTV_DEV_SERVER_HR_CLIENT_PATH___ */
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
    resourceName,
    defaultDimension,
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
    }

    clearPlayersMeta()
  })

  if (typeof ___ALTV_DEV_SERVER_HR_FS___ !== 'undefined') initHotReload()
  if (typeof ___ALTV_DEV_SERVER_RECONNECT_PLAYERS_DELAY___ !== 'undefined') initReconnectPlayers()

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
        logError(`failed destroy alt.${BaseObjectChild.name} error:`)
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
        // alt.log('created baseobject:', BaseObjectChild.name)
      } catch (error) {
        logError(`failed create alt.${BaseObjectChild.name} error:`)
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

    ___ALTV_DEV_SERVER_HR_FS___.watch(___ALTV_DEV_SERVER_HR_BUNDLE_PATH___, (...args) => {
      const now = +new Date()
      const elapsed = (now - lastBundleChange)

      if (elapsed < MIN_FILE_CHANGE_MS) return
      lastBundleChange = now

      log(`~cl~[hot-reload]~w~ restarting ~gl~${resourceName}~w~ resource...`)
      alt.restartResource(resourceName)
    })

    if (typeof ___ALTV_DEV_SERVER_HR_CLIENT_PATH___ === 'string') {
      ___ALTV_DEV_SERVER_HR_FS___.watch(___ALTV_DEV_SERVER_HR_CLIENT_PATH___, () => {
        const now = +new Date()
        const elapsed = (now - lastBundleChange)

        if (elapsed < MIN_FILE_CHANGE_MS) return
        lastBundleChange = now

        log(`~cl~[hot-reload]~w~ restarting ~gl~${resourceName}~w~ resource... (client change)`)
        alt.restartResource(resourceName)
      })
    }
  }

  function initReconnectPlayers () {
    const resourceRestartedKey = `___ALTV_DEV_SERVER_${resourceName}_RESTARTED___`
    const initialPos = { x: 0, y: 0, z: 72 }

    if (!alt.getMeta(resourceRestartedKey)) {
      alt.setMeta(resourceRestartedKey, true)
      return
    }

    log(`start a timer for ~cl~${___ALTV_DEV_SERVER_RECONNECT_PLAYERS_DELAY___}~w~ ms to reconnect players`)

    const players = alt.Player.all

    for (const p of players) {
      p.dimension = defaultDimension
      p.pos = initialPos
      p.removeAllWeapons()
      p.clearBloodDamage()
    }

    alt.setTimeout(() => {
      for (const p of players) {
        alt.emit('playerConnect', p)
      }
    }, ___ALTV_DEV_SERVER_RECONNECT_PLAYERS_DELAY___)
  }

  function logError (...args) {
    alt.logError(
      '[esbuild-altv-dev]',
      'Please open issue on github of this plugin. \n',
      ...(args[0].stack ? [args[0].stack] : args),
    )
  }

  function log (...args) {
    alt.log('~lm~[esbuild-altv-dev]~w~', ...args)
  }
})()
try {

// --------------------- esbuild-plugin-altv-dev-server ---------------------

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[Object.keys(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __reExport = (target, module, desc) => {
  if (module && typeof module === "object" || typeof module === "function") {
    for (let key of __getOwnPropNames(module))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module[key], enumerable: !(desc = __getOwnPropDesc(module, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module) => {
  return __reExport(__markAsModule(__defProp(module != null ? __create(__getProtoOf(module)) : {}, "default", module && module.__esModule && "default" in module ? { get: () => module.default, enumerable: true } : { value: module, enumerable: true })), module);
};

// altv-dev-server:alt-server
var require_alt_server = __commonJS({
  "altv-dev-server:alt-server"(exports, module) {
    module.exports = alt;
  }
});

// server-src/main.ts
var alt2 = __toModule(require_alt_server());
alt2.on("playerConnect", (player) => {
  alt2.log("~gl~[playerConnect]~w~", "player:~cl~", player.name);
  player.pos = new alt2.Vector3(0, 0, 71);
  player.model = "mp_m_freemode_01";
});

} catch (e) {
  alt.nextTick(() => {
    alt.logError(e.stack)
    alt.logError('[altv-dev-server] Failed to load resource', alt.resourceName)
  })
}
