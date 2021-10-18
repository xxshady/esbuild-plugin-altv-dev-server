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
    }
  })
})()