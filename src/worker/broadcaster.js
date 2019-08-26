import { Worker } from './worker'

export class Broadcaster extends Worker {
  constructor (options = {}) {
    super(options)

    this._downstreams = null
    this._name = null
    this._sync = null
    this._unify = null

    this.setDownstreams(options.downstreams)
    this.setName(options.name)
    this.setSync(options.sync)
    this.setUnify(options.unify)
  }

  getOptions () {
    return Object.assign(super.getOptions(), {
      name: this._name,
      sync: this._sync,
      unify: this._unify
    })
  }

  getDownstreams () {
    return this._downstreams
  }

  setDownstreams (value = []) {
    this._downstreams = value
    return this
  }

  getName () {
    return this._name
  }

  setName (value = 'default') {
    this._name = value
    return this
  }

  getSync () {
    return this._sync
  }

  setSync (value = false) {
    this._sync = value
    return this
  }

  getUnify () {
    return this._unify
  }

  setUnify (value = true) {
    this._unify = value
    return this
  }

  connect (worker = null) {
    if (worker === null) {
      return this
    }

    if (Array.isArray(worker)) {
      this.connect(worker[0])
      return worker[1]
    }

    this._downstreams.push(worker)
    return super.connect(worker)
  }

  find (compare, up = false) {
    let found = super.find(compare, up)

    if (found !== null) {
      return found
    }

    for (let i = 0; i < this._downstreams.length; i += 1) {
      found = this.downstreams[i].find(compare, up)

      if (found) {
        return found
      }
    }

    return found
  }

  pass (box, data, callback) {
    if (this._wrap === true) {
      box = { box }
    }

    if (this._unify === true) {
      const unify = {
        count: 0,
        empty: false,
        total: this._downstreams.length
      }

      box.unify = box.unify || {}
      box.unify[this._name] = unify

      this.log('info', box, data, box.unify)
    }

    if (this._sync) {
      this.passSync(box, data, callback)
      return
    }

    this.passAsync(box, data, callback)
  }

  passAsync (box, data, callback) {
    for (let i = 0; i < this._downstreams.length; i += 1) {
      this._downstreams[i].handle(box, data, callback)
    }
  }

  passSync (box, data, callback) {
    const unify = box.unify[this._name]

    const cb = unify.count === (unify.total - 1)
      ? callback
      : () => this.passSync(box, data, callback)

    this._downstreams[unify.count].handle(box, data, cb)
  }
}
