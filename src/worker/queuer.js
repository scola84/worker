import createQueue from 'async/queue';
import { Worker } from './worker';

const queues = {};

export class Queuer extends Worker {
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
    this._drain = null;
    this._handler = null;
    this._name = null;
    this._queue = null;
    this._queuer = null;
    this._saturated = null;
    this._unsaturated = null;

    this.setConcurrency(options.concurrency);
    this.setDrain(options.drain);
    this.setName(options.name);
    this.setQueue(options.queue);
    this.setSaturated(options.saturated);
    this.setUnsaturated(options.unsaturated);

    if (options.handler) {
      this.setHandler(options.handler);
      this.startHandler();
    }

    if (options.queuer) {
      this.setQueuer(options.queuer);
      this.startQueuer();
    }
  }

  getOptions() {
    return Object.assign(super.getOptions(), {
      concurrency: this._concurrency,
      drain: this._drain,
      handler: this._handler,
      name: this._name,
      queue: this._queue,
      queuer: this._queuer,
      saturated: this._saturated,
      unsaturated: this._unsaturated
    });
  }

  getConcurrency() {
    return this._concurrency;
  }

  setConcurrency(value = 1) {
    this._concurrency = value;
    return this;
  }

  getDrain() {
    return this._drain;
  }

  setDrain(value = () => {}) {
    this._drain = value;
    return this;
  }

  getHandler() {
    return this._handler;
  }

  setHandler(value = null) {
    this._handler = value;
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

  getQueuer() {
    return this._queuer;
  }

  setQueuer(value = null) {
    this._queuer = value;
    return this;
  }

  getSaturated() {
    return this._saturated;
  }

  setSaturated(value = () => {}) {
    this._saturated = value;
    return this;
  }

  getUnsaturated() {
    return this._unsaturated;
  }

  setUnsaturated(value = () => {}) {
    this._unsaturated = value;
    return this;
  }

  act(box, data) {
    if (this._queuer !== null) {
      this.pushToRemote(box, data);
    } else if (this._handler === null) {
      this.pushToLocal(box, data);
    }
  }

  createQueue(box) {
    this._queue = Queuer.createQueue(
      this._concurrency,
      this._name
    );

    this._queue.saturated = () => {
      this._saturated(box);
    };

    this._queue.unsaturated = () => {
      this._unsaturated(box);
    };

    this._queue.drain = () => {
      this._drain(box);
    };
  }

  handleRemote(callback) {
    this._handler.rpop(this._name, (error, data) => {
      if (error) {
        callback();
        this.log('fail', null, error);
        return;
      }

      if (data === null) {
        callback();
        this._queue.unsaturated = () => {};
        return;
      }

      try {
        data = JSON.parse(data);
      } catch (jsonError) {
        callback();
        this.log('fail', null, jsonError);
        return;
      }

      this.pass({}, data, callback);
    });
  }

  pushFromRemote() {
    if (this._queue === null) {
      this.createQueue();
    }

    if (this._queue.length() === this._concurrency) {
      return;
    }

    this._queue.unsaturated = () => {
      this.pushFromRemote();
    };

    this._queue.push((callback) => {
      this.handleRemote(callback);
    });
  }

  pushToLocal(box, data) {
    if (this._queue === null) {
      this.createQueue(box);
    }

    if (this._queue.length() === this._concurrency) {
      this._queue.saturated();
    }

    this._queue.push((callback) => {
      this.pass(box, data, callback);
    });
  }

  pushToRemote(box, data) {
    try {
      data = JSON.stringify(data);
    } catch (error) {
      this.log('fail', box, error);
      return;
    }

    this._queuer.lpush(this._name, data, (error) => {
      if (error) {
        this.log('fail', box, error);
        return;
      }

      this._pub.publish(this._name, 1);
    });
  }

  startHandler() {
    this._sub = this._handler.duplicate();

    this._sub.on('error', (error) => {
      this.log('fail', null, error);
    });

    this._sub.on('message', () => {
      this.pushFromRemote();
    });

    this._sub.subscribe(this._name);
  }

  startQueuer() {
    this._pub = this._queuer.duplicate();

    this._pub.on('error', (error) => {
      this.log('fail', null, error);
    });
  }
}
