import Worker from './worker';

export default class Broadcaster extends Worker {
  constructor(methods) {
    super(methods);

    this._unify = null;
    this._workers = [];
  }

  unify(value) {
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
}
