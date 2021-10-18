
// ----- esbuild-plugin-altv-dev-server -----
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

// ----- esbuild-plugin-altv-dev-server -----

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

// src/main.ts
var alt2 = __toModule(require_alt_server());
alt2.on("playerConnect", (player) => {
  alt2.log("~gl~[playerConnect]~w~", "player:~cl~", player.name);
  player.pos = new alt2.Vector3(0, 0, 72);
  player.model = "mp_m_freemode_01";
  alt2.setTimeout(() => {
    const veh = new alt2.Vehicle("sultan2", 0, 5, 71, 0, 0, 0);
    player.setIntoVehicle(veh, 1);
  }, 1e3);
});
alt2.on("resourceStart", () => {
  const { resourceName } = alt2;
  const isAlreadyStartedKey = `${resourceName}:isAlreadyStarted`;
  const isAlreadyStarted = alt2.getMeta(isAlreadyStartedKey) || false;
  alt2.log("[resourceStart]", "isAlreadyStarted:", isAlreadyStarted);
  if (!isAlreadyStarted) {
    alt2.setMeta(isAlreadyStartedKey, true);
    return;
  }
  alt2.setTimeout(() => {
    const players = alt2.Player.all;
    for (let i = 0; i < players.length; i++) {
      alt2.emit("playerConnect", players[i]);
    }
  }, 500);
});
