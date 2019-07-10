import shortid from 'shortid';
import { Worker } from './worker';

export class Dealer extends Worker {
  constructor(options = {}) {
    super(options);

    this._beat = null;
    this._dealer = null;
    this._handler = null;
    this._name = null;
    this._pub = null;
    this._sub = null;

    this.setBeat(options.beat);
    this.setDealer(options.dealer);
    this.setHandler(options.handler);
    this.setName(options.name);

    if (options.dealer) {
      this.setPub(options.dealer.duplicate());
      this.startDealer();
    }

    if (options.handler) {
      this.setSub(options.handler.duplicate());
      this.startHandler();
    }
  }

  getDealer() {
    return this._dealer;
  }

  setDealer(value = null) {
    this._dealer = value;
    return this;
  }

  getHandler() {
    return this._handler;
  }

  setHandler(value = null) {
    this._handler = value;
    return this;
  }

  getBeat() {
    return this._beat;
  }

  setBeat(value = 3 * 1000) {
    this._beat = value;
    return this;
  }

  getName() {
    return this._name;
  }

  setName(value = null) {
    this._name = value;
    return this;
  }

  getPub() {
    return this._pub;
  }

  setPub(value = null) {
    this._pub = value;
    return this;
  }

  getSub() {
    return this._sub;
  }

  setSub(value = null) {
    this._sub = value;
    return this;
  }

  act(box, data, callback) {
    const idList = `${this._name}:id`;
    const tashHash = `${this._name}:task`;

    this._dealer.rpoplpush(idList, idList, (error, id) => {
      if (error) {
        this.fail(box, error, callback);
        return;
      }

      if (id === null) {
        this.fail(box, new Error('No handlers found'), callback);
        return;
      }

      const task = shortid();

      this._dealer.hset(tashHash, task, JSON.stringify(data));

      this._pub.publish(this._name, JSON.stringify({
        id,
        task
      }));
    });
  }

  start() {
    if (this._handler) {
      this.startHandler();
    }

    if (this._dealer) {
      this.startDealer();
    }
  }

  startDealer() {
    this._dealer.on('error', (error) => {
      this.log('fail', null, error);
    });

    this._pub.on('error', (error) => {
      this.log('fail', null, error);
    });

    this.checkBeat();
  }

  startHandler() {
    this._handler.on('error', (error) => {
      this.log('fail', null, error);
    });

    this._sub.on('error', (error) => {
      this.log('fail', null, error);
    });

    this._sub.on('message', (channel, message) => {
      this.handleMessage(message);
    });

    this._sub.subscribe(this._name);
    this.sendBeat();
  }

  checkBeat() {
    const beatHash = `${this._name}:beat`;

    this._dealer.hgetall(beatHash, (error, beat) => {
      if (error) {
        this.log('fail', null, error);
        return;
      }

      if (beat === null) {
        return;
      }

      const id = Object.keys(beat);

      for (let i = 0; i < id.length; i += 1) {
        this.handleCheckBeat(id[i], beat[id[i]]);
      }
    });

    setTimeout(() => this.checkBeat(), this._beat);
  }

  handleCheckBeat(id, beat) {
    const beatHash = `${this._name}:beat`;
    const idList = `${this._name}:id`;

    const threshold = new Date(
      Date.now() - this._beat - 3000
    ).toISOString();

    this._dealer.lrem(idList, 0, id);

    if (beat > threshold) {
      this._dealer.lpush(idList, id);
    } else {
      this._dealer.hdel(beatHash, id);
    }
  }

  handleMessage(message) {
    try {
      message = JSON.parse(message);
    } catch (jsonError) {
      this.log('fail', null, jsonError);
      return;
    }

    if (message.id !== this._id) {
      return;
    }

    const taskHash = `${this._name}:task`;

    this._handler.hget(taskHash, message.task, (error, task) => {
      if (error) {
        this.log('fail', null, error);
        return;
      }

      if (task === null) {
        this.log('fail', null, new Error('Task not found'));
        return;
      }

      try {
        task = JSON.parse(task);
      } catch (jsonError) {
        this.log('fail', null, jsonError);
        return;
      }

      this.pass({}, task, () => {
        this._handler.hdel(taskHash, message.task);
      });
    });
  }

  sendBeat() {
    const beatHash = `${this._name}:beat`;
    const now = new Date().toISOString();
    this._handler.hset(beatHash, this._id, now);
    setTimeout(() => this.sendBeat(), this._beat);
  }
}
