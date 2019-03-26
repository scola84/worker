import asyncQueue from 'async/queue';
import Worker from './worker';

const queues = {};

export default class Queuer extends Worker {
  static createQueue(concurrency, name, timeout) {
    const queue = asyncQueue((fn, callback) => {
      if (timeout !== null) {
        setTimeout(() => fn(callback), timeout);
      } else {
        fn(callback);
      }
    }, concurrency);

    if (name !== null) {
      if (typeof queues[name] !== 'undefined') {
        throw new Error(`Queue already defined (name=${name})`);
      }

      queues[name] = queue;
    }

    return queue;
  }

  constructor(options = {}) {
    super(options);

    this._concurrency = null;
    this._name = null;
    this._queue = null;
    this._timeout = null;

    this.setConcurrency(options.concurrency);
    this.setName(options.name);
    this.setTimeout(options.timeout);
  }

  setConcurrency(value = 1) {
    this._concurrency = value;
    return this;
  }

  setName(value = null) {
    this._name = value;
    return this;
  }

  setTimeout(value = null) {
    this._timeout = value;
    return this;
  }

  act(box, data) {
    if (this._queue === null) {
      this._createQueue();
    }

    this._queue.push((callback) => {
      if (this._wrap) {
        box = { box };
      }

      this.pass(box, data, (...args) => {
        callback(...args);

        if (this._log === 'queue') {
          console.log('queuer (%s): fn=callback, length=%s, running=%s',
            this._id, this._queue.length(), this._queue.running());
        }
      });
    });

    if (this._log === 'queue') {
      console.log('queuer (%s): fn=act, length=%s, running=%s',
        this._id, this._queue.length(), this._queue.running());
    }
  }

  _createQueue() {
    this._queue = this._name === null ?
      Queuer.createQueue(this._concurrency, this._name, this._timeout) :
      queues[this._name];

    if (typeof this._queue === 'undefined') {
      throw new Error(`Queue not defined (name=${this._name})`);
    }
  }
}
