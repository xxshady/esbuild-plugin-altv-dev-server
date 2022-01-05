import * as alt from 'alt-server'

alt.on('playerConnect', (player) => {
  alt.log('~gl~[playerConnect]~w~', 'player:~cl~', player.name)
  alt.log('player streamSyncedMeta:', player.getStreamSyncedMeta('test'))

  player.pos = new alt.Vector3(0, 0, 72)
  player.model = 'mp_m_freemode_01'

  // any player's meta will be internally cleared on restart of this resource
  // in order to emulate a player's reconnect
  player.setStreamSyncedMeta('test', 123)

  alt.setTimeout(() => {
    // this vehicle will be automatically destroyed on restart of this resource
    const veh = new alt.Vehicle('sultan2', 0, 5, 71, 0, 0, 0)
    player.setIntoVehicle(veh, 1)
  }, 1000)
})