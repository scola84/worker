import queue from 'async/queue';
import Worker from './worker';

export default class Queuer extends Worker {
  constructor(options = {}) {
    super(options);

    this._concurrency = 0;
    this._queue = null;

    this.setConcurrency(options.concurrency);
  }

  setConcurrency(value = 0) {
    this._concurrency = value;
    return this;
  }

  act(box, data, callback) {
    if (this._queue === null) {
      this._buildQueue();
    }

    this._queue.push({ box, data, callback });
  }

  _buildQueue() {
    this._queue = queue(({ box, data }, callback) => {
      this.pass(box, data, callback);
    }, this._concurrency);
  }
}
