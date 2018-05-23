import Worker from './worker';

export default class Unifier extends Worker {
  constructor(options = {}) {
    super(options);

    this._collect = null;
    this._name = null;
    this._wrap = null;

    this.setCollect(options.collect);
    this.setName(options.name);
    this.setWrap(options.wrap);
  }

  setCollect(value = false) {
    this._collect = value;
    return this;
  }

  setName(value = 'default') {
    this._name = value;
    return this;
  }

  setWrap(value = false) {
    this._wrap = value;
    return this;
  }

  act(box, data, callback) {
    const unify = box.unify[this._name];
    unify.count += 1;

    if (this._collect === true) {
      unify.data = unify.data || [];
      unify.data[unify.data.length] = data;
    }

    if (unify.count % unify.total === 0) {
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
}
