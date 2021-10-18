import alt from 'alt-server'

(() => {
  const BaseObject = alt.BaseObject
  const baseObjects = new Set()

  for (const key in alt) {
    const baseObjectChild = alt[key]

    if (!(
      baseObjectChild.prototype instanceof BaseObject &&
      baseObjectChild !== BaseObject
    )) continue

    alt[key] = class extends baseObjectChild {
      // eslint-disable-next-line constructor-super
      constructor (...args) {
        try {
          super(...args)
          baseObjects.add(this)
          // alt.log('created baseobject:', baseObjectChild.name)
        } catch (e) {
          alt.logError(`failed create ${baseObjectChild.name} error:`, e.stack)
        }
      }

      destroy () {
        try {
          baseObjects.delete(this)
          super.destroy()
          // alt.log('destroyed baseobject:', baseObjectChild.name)
        } catch (e) {
          alt.logError(`failed destroy ${baseObjectChild.name} error:`, e.stack)
        }
      }
    }
  }

  alt.on('resourceStop', () => {
    // alt.log('resourceStop baseobjects:', baseObjects.size)
    for (const obj of baseObjects) {
      obj.destroy()
    }
  })
})()