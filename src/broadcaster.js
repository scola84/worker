import Worker from './worker';

export default class Broadcaster extends Worker {
  constructor(options = {}) {
    super(options);

    this._name = null;
    this._unify = null;
    this._workers = [];

    this.setName(options.name);
    this.setUnify(options.unify);
  }

  setName(value = 'default') {
    this._name = value;
    return this;
  }

  setUnify(value = true) {
    this._unify = value;
    return this;
  }

  connect(worker = null) {
    if (worker === null) {
      return this;
    }

    if (Array.isArray(worker)) {
      this.connect(worker[0]);
      return worker[1];
    }

    this._workers.push(worker);
    return super.connect(worker);
  }

  inject(worker, index) {
    if (worker === null) {
      return this;
    }

    if (Array.isArray(worker)) {
      this.inject(worker[0], index);
      return worker[1];
    }

    this._workers.splice(index, 0, worker);
    return worker;
  }

  pass(box, data, callback) {
    if (this._wrap === true) {
      box = { box };
    }

    if (this._unify === true) {
      const unify = {
        count: 0,
        empty: false,
        total: this._workers.length
      };

      box.unify = box.unify || {};
      box.unify[this._name] = unify;

      if (this._log === 'unify') {
        console.log('broadcaster (%s): count=%s, total=%s, empty=%s',
          this._name, unify.count, unify.total, unify.empty);
      }
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
