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

    this._workers.forEach((worker) => {
      found = found || worker.find(compare);
    });

    return found;
  }
}
