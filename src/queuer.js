import queue from 'async/queue';
import Worker from './worker';

export default class Queuer extends Worker {
  constructor(options = {}) {
    super(options);

    this._concurrency = null;
    this._delay = null;
    this._queue = null;

    this.setConcurrency(options.concurrency);
    this.setDelay(options.delay);
  }

  setConcurrency(value = 1) {
    this._concurrency = value;
    return this;
  }

  setDelay(value = null) {
    this._delay = value;
    return this;
  }

  act(box, data, callback) {
    if (this._queue === null) {
      this._createQueue();
    }

    this._queue.push({ box, data, callback });

    if (this._log === 'queue') {
      console.log('queuer (%s): fn=act, length=%s, running=%s',
        this._id, this._queue.length(), this._queue.running());
    }
  }

  _createQueue() {
    this._queue = queue(({ box, data }, callback) => {
      if (this._delay === null) {
        return this._execute(box, data, callback);
      }

      return setTimeout(() => {
        this._execute(box, data, callback);
      }, this._delay);
    }, this._concurrency);
  }

  _execute(box, data, callback) {
    this.pass(box, data, (...args) => {
      callback(...args);

      if (this._log === 'queue') {
        console.log('queuer (%s): fn=callback, length=%s, running=%s',
          this._id, this._queue.length(), this._queue.running());
      }
    });
  }
}
