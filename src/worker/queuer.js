import createQueue from 'async/queue'
import { Worker } from './worker'

const queues = {}

export class Queuer extends Worker {
  static createQueue (concurrency, name = null) {
    if (queues[name]) {
      return queues[name]
    }

    const queue = createQueue((fn, callback) => {
      fn(callback)
    }, concurrency)

    if (name !== null) {
      queues[name] = queue
    }

    return queue
  }

  constructor (options = {}) {
    super(options)

    this._concurrency = null
    this._handler = null
    this._pub = null
    this._queue = null
    this._queuer = null
    this._sub = null

    this.setConcurrency(options.concurrency)
    this.setQueue(options.queue)

    if (options.handler) {
      this.setHandler(options.handler)
      this.startHandler()
    }

    if (options.queuer) {
      this.setQueuer(options.queuer)
      this.startQueuer()
    }
  }

  getOptions () {
    return Object.assign(super.getOptions(), {
      concurrency: this._concurrency,
      handler: this._handler,
      pub: this._pub,
      queue: this._queue,
      queuer: this._queuer,
      sub: this._sub
    })
  }

  getConcurrency () {
    return this._concurrency
  }

  setConcurrency (value = 1) {
    this._concurrency = value
    return this
  }

  getHandler () {
    return this._handler
  }

  setHandler (value = null) {
    this._handler = value
    return this
  }

  getPub () {
    return this._pub
  }

  setPub (value = null) {
    this._pub = value
    return this
  }

  getQueue () {
    return this._queue
  }

  setQueue (value = null) {
    this._queue = value
    return this
  }

  getQueuer () {
    return this._queuer
  }

  setQueuer (value = null) {
    this._queuer = value
    return this
  }

  getSub () {
    return this._sub
  }

  setSub (value = null) {
    this._sub = value
    return this
  }

  act (box, data) {
    if (this._queuer !== null) {
      this.pushToRemote(box, data)
    } else if (this._handler === null) {
      this.pushToLocal(box, data)
    }
  }

  createBox (callback, data) {
    const box = { callback }

    const unify = {
      count: 0,
      empty: false,
      total: 1
    }

    box.unify = box.unify || {}
    box.unify[this._name] = unify

    return box
  }

  createQueue (box) {
    this._queue = Queuer.createQueue(
      this._concurrency,
      this._name
    )
  }

  handleRemote (callback) {
    this._handler.rpop(this._name, (error, data) => {
      if (error) {
        callback(error)
        return
      }

      if (data === null) {
        callback()
        return
      }

      try {
        data = JSON.parse(data)
      } catch (jsonError) {
        callback(jsonError)
        return
      }

      this.pass(this.createBox(callback), data)
    })
  }

  pushFromRemote () {
    if (this._queue === null) {
      this.createQueue()
    }

    if (this._queue.length() === this._concurrency) {
      return
    }

    this._queue.push((callback) => {
      this.handleRemote(callback)
    })
  }

  pushToLocal (box, data) {
    if (this._queue === null) {
      this.createQueue(box)
    }

    this._queue.push((callback) => {
      this.pass(this.createBox(callback), data)
    })
  }

  pushToRemote (box, data) {
    try {
      data = JSON.stringify(data)
    } catch (error) {
      this.log('fail', box, error)
      return
    }

    this._queuer.lpush(this._name, data, (error) => {
      if (error) {
        this.log('fail', box, error)
        return
      }

      this._pub.publish(this._name, 1)
    })
  }

  startHandler () {
    this._queue.unsaturated(() => {
      this.pushFromRemote()
    })

    const sub = this._handler.duplicate()

    sub.on('error', (error) => {
      this.log('fail', null, error)
    })

    sub.on('message', () => {
      this.pushFromRemote()
    })

    sub.subscribe(this._name)

    this.setSub(sub)
  }

  startQueuer () {
    const pub = this._queuer.duplicate()

    pub.on('error', (error) => {
      this.log('fail', null, error)
    })

    this.setPub(pub)
  }
}
