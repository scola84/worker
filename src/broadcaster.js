import Worker from './worker';

export default class Broadcaster extends Worker {
  constructor(options = {}) {
    super(options);

    this._unify = null;
    this._workers = [];

    this.unify(options.unify);
  }

  unify(value = null) {
    this._unify = value;
    return this;
  }

  connect(worker) {
    this._workers.push(worker);
    return worker;
  }

  disconnect(worker, index = -1) {
    if (index === -1) {
      for (let i = 0; i < this._workers.length; i += 1) {
        if (this._workers[i] === worker) {
          index = i;
        }
      }
    }

    this._workers.splice(index, 1);
    return this;
  }

  inject(worker, index) {
    this._workers.splice(index, 0, worker);
    return worker;
  }

  pass(box, data, callback) {
    if (this._unify !== null && typeof box.unify === 'undefined') {
      box.unify = { total: this._unify };
    }

    for (let i = 0; i < this._workers.length; i += 1) {
      this._workers[i].handle(box, data, callback);
    }
  }

  _find(compare) {
    let found = null;

    for (let i = 0; i < this._workers.length; i += 1) {
      found = this._workers[i].find(compare);

      if (found) {
        return found;
      }
    }

    return found;
  }
}
