import createQueue from 'async/queue';
import { Worker } from './worker';

let queues = {};

export class Queuer extends Worker {
  static getQueues() {
    return queues;
  }

  static setQueues(value) {
    queues = value;
  }

  static createQueue(concurrency, name = null) {
    if (queues[name]) {
      return queues[name];
    }

    const queue = createQueue((fn, callback) => {
      fn(callback);
    }, concurrency);

    if (name !== null) {
      queues[name] = queue;
    }

    return queue;
  }

  constructor(options = {}) {
    super(options);

    this._concurrency = null;
    this._name = null;
    this._queue = null;

    this.setConcurrency(options.concurrency);
    this.setName(options.name);
    this.setQueue(options.queue);
  }

  getOptions() {
    return Object.assign(super.getOptions(), {
      concurrency: this._concurrency,
      name: this._name
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

  act(box, data, callback) {
    if (this._queue === null) {
      this._queue = Queuer.createQueue(
        this._concurrency,
        this._name
      );
    }

    this._queue.push((finish) => {
      if (this._wrap) {
        box = { box };
      }

      this.pass(box, data, (next) => {
        this.log('info', box, data, 'callback');

        finish();

        if (next) {
          next(callback);
        }
      });
    });

    this.log('info', box, data, 'act');
  }
}
