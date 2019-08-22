import { Worker } from './worker';

export class Unifier extends Worker {
  constructor(options = {}) {
    super(options);

    this._collect = null;
    this._name = null;
    this._sync = null;

    this.setCollect(options.collect);
    this.setName(options.name);
    this.setSync(options.sync);
  }

  getOptions() {
    return Object.assign(super.getOptions(), {
      collect: this._collect,
      name: this._name
    });
  }

  getCollect() {
    return this._collect;
  }

  setCollect(value = false) {
    this._collect = value;
    return this;
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

  act(box, data, callback) {
    const unify = box.unify[this._name];
    unify.count += 1;

    if (this._collect === true) {
      unify.data = unify.data || [];

      if (unify.empty === false) {
        const index = typeof data.index === 'undefined' ?
          unify.data.length : data.index;

        unify.data[index] = data;
      }
    }

    const pass = unify.empty === true ||
      unify.count % unify.total === 0;

    this.log('info', box, data, unify);

    if (pass === false) {
      if (this._sync) {
        callback();
      }
    } else if (pass === true) {
      if (this._collect === true) {
        data = unify.data;
        delete unify.data;
      }

      if (this._wrap === true) {
        box = box.box;
      }

      this.pass(box, data, callback);
    }
  }

  decide(box, data) {
    if (this._decide) {
      return this._decide(box, data);
    }

    return typeof box.unify !== 'undefined';
  }

  err(box, error, callback) {
    this.handle(box, error, callback);
  }
}
