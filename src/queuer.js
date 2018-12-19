import asyncQueue from 'async/queue';
import Worker from './worker';

const queues = {};

export default class Queuer extends Worker {
  static createQueue(concurrency, name) {
    return createQueue(concurrency, name);
  }

  constructor(options = {}) {
    super(options);

    this._concurrency = null;
    this._name = null;
    this._queue = null;

    this.setConcurrency(options.concurrency);
    this.setName(options.name);
  }

  setConcurrency(value = 1) {
    this._concurrency = value;
    return this;
  }

  setName(value = null) {
    this._name = value;
    return this;
  }

  act(box, data) {
    if (this._queue === null) {
      this._createQueue();
    }

    this._queue.push((callback) => {
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
      createQueue(this._concurrency) :
      queues[this._name];
  }
}

function createQueue(concurrency, name) {
  const queue = asyncQueue((fn, callback) => {
    fn(callback);
  }, concurrency);

  if (typeof name !== 'undefined') {
    if (typeof queues[name] !== 'undefined') {
      throw new Error(`Queue already defined (name=${name})`);
    }

    queues[name] = queue;
  }

  return queue;
}
