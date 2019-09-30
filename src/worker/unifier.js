import { Worker } from './worker'

export class Unifier extends Worker {
  constructor (options = {}) {
    super(options)

    this._collect = null
    this.setCollect(options.collect)
  }

  getOptions () {
    return Object.assign(super.getOptions(), {
      collect: this._collect
    })
  }

  getCollect () {
    return this._collect
  }

  setCollect (value = false) {
    this._collect = value
    return this
  }

  unify (box, data) {
    if (box.callback) {
      box.callback()
    }

    const unify = box.unify[this._name]

    if (this._collect === true) {
      unify.data = unify.data || []

      if (unify.empty === false) {
        const index = typeof data.index === 'undefined'
          ? unify.data.length
          : data.index

        unify.data[index] = data
      }
    }

    unify.count += 1

    const pass = unify.empty === true ||
      unify.count % unify.total === 0

    if (pass === true) {
      if (this._collect === true) {
        data = unify.data
        delete unify.data
      }

      if (this._wrap === true) {
        box = box.box
      }
    }

    return [box, data]
  }

  act (box, data) {
    this.pass(...this.unify(box, data))
  }

  decide (box, data) {
    if (this._decide) {
      return this._decide(box, data)
    }

    return typeof box.unify !== 'undefined'
  }

  err (box, error) {
    this.fail(...this.unify(box, error))
  }
}
