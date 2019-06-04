import Worker from './worker';

export default class Broadcaster extends Worker {
  constructor(options = {}) {
    super(options);

    this._name = null;
    this._sync = null;
    this._unify = null;
    this._workers = [];

    this.setName(options.name);
    this.setSync(options.sync);
    this.setUnify(options.unify);
  }

  getOptions() {
    return Object.assign(super.getOptions(), {
      name: this._name,
      unify: this._unify
    });
  }

  getName() {
    return this._name;
  }

  setName(value = 'default') {
    this._name = value;
    return this;
  }

  getSync() {
    return this._sync;
  }

  setSync(value = false) {
    this._sync = value;
    return this;
  }

  getUnify() {
    return this._unify;
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

    if (this._sync) {
      this._passSync(box, data, callback);
    } else {
      this._passAsync(box, data, callback);
    }
  }

  _passAsync(box, data, callback) {
    for (let i = 0; i < this._workers.length; i += 1) {
      this._workers[i].handle(box, data, callback);
    }
  }

  _passSync(box, data, callback) {
    const unify = box.unify[this._name];

    const cb = unify.count === (unify.total - 1) ?
      callback :
      () => this._passSync(box, data, callback);

    this._workers[unify.count].handle(box, data, cb);
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
