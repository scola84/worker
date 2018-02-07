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

  connect(worker = null) {
    if (worker === null) {
      return this;
    }

    this._workers.push(worker.setParent(this));
    return worker;
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
