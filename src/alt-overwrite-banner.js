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
      constructor (...args) {
        super(...args)
        baseObjects.add(this)
        // alt.log('created baseobject:', baseObjectChild.name)
      }

      destroy () {
        baseObjects.delete(this)
        // alt.log('destroyed baseobject:', baseObjectChild.name)
        super.destroy()
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