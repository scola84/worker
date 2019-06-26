import asyncQueue from 'async/queue';
import { Worker } from './worker';

const queues = {};

export class Queuer extends Worker {
  static createQueue(concurrency, name, timeout) {
    function handle(fn, callback) {
      if (timeout === null) {
        fn(callback);
        return;
      }

      setTimeout(() => fn(callback), timeout);
    }

    const queue = asyncQueue(handle, concurrency);

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
    this.setQueue(options.queue);
    this.setTimeout(options.timeout);
  }

  getOptions() {
    return Object.assign(super.getOptions(), {
      concurrency: this._concurrency,
      name: this._name,
      timeout: this._timeout
    });
  }

  getConcurrency() {
    return this._concurrency;
  }

  setConcurrency(value = 1) {
    this._concurrency = value;
    return this;
  }

  getName() {
    return this._name;
  }

  setName(value = null) {
    this._name = value;
    return this;
  }

  getQueue() {
    return this._queue;
  }

  setQueue(value = null) {
    this._queue = value;
    return this;
  }

  getTimeout() {
    return this._timeout;
  }

  setTimeout(value = null) {
    this._timeout = value;
    return this;
  }

  act(box, data) {
    if (this._queue === null) {
      this.createQueue();
    }

    this._queue.push((callback) => {
      if (this._wrap) {
        box = { box };
      }

      this.pass(box, data, (...args) => {
        callback(...args);
        this.log('info', box, data, 'callback');
      });
    });

    this.log('info', box, data, 'act');
  }

  createQueue() {
    this._queue = this._name === null ?
      Queuer.createQueue(this._concurrency, this._name, this._timeout) :
      queues[this._name];

    if (typeof this._queue === 'undefined') {
      throw new Error(`Queue not defined (name=${this._name})`);
    }
  }
}
