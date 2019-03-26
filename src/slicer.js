import Worker from './worker';

export default class Slicer extends Worker {
  constructor(options = {}) {
    super(options);

    this._count = null;
    this._name = null;
    this._pick = null;
    this._unify = null;

    this.setCount(options.count);
    this.setName(options.name);
    this.setPick(options.pick);
    this.setUnify(options.unify);
  }

  setCount(value = 1) {
    this._count = value;
    return this;
  }

  setName(value = 'default') {
    this._name = value;
    return this;
  }

  setPick(value = { index: 1, total: 1 }) {
    this._pick = value;
    return this;
  }

  setUnify(value = true) {
    this._unify = value;
    return this;
  }

  act(box, data, callback) {
    const items = this.filter(box, data);

    if (this._wrap === true) {
      box = { box };
    }

    if (this._unify === true) {
      const unify = {
        count: 0,
        empty: items.length === 0,
        total: Math.ceil(items.length / this._count)
      };

      box.unify = box.unify || {};
      box.unify[this._name] = unify;

      if (this._log === 'unify') {
        console.log('slicer (%s): count=%s, total=%s, empty=%s',
          this._name, unify.count, unify.total, unify.empty);
      }
    }

    let arg1 = null;
    let arg2 = null;

    if (items.length === 0) {
      if (this._bypass) {
        [box, data] = this.merge(box, data, items, 0, 0);
        this._bypass.handle(box, data, callback);
      }
    }

    for (let i = 0; i < items.length; i += this._count) {
      [arg1, arg2] = this.merge(box, data, items, i, i + this._count);
      this._pickAndPass(arg1, arg2, callback, i);
    }
  }

  merge(box, data, items, begin, end) {
    if (this._merge) {
      return this._merge(box, data, items, begin, end);
    }

    data = items.slice(begin, end);
    data = this._count === 1 ? data.pop() : data;

    return [box, data];
  }

  _pickAndPass(box, data, callback, index) {
    if (this._count > 1) {
      this.pass(box, data, callback);
      return;
    }

    if (((index % this._pick.total) + 1) === this._pick.index) {
      this.pass(box, data, callback);
      return;
    }

    if (this._bypass) {
      this._bypass.handle(box, data, callback);
    }
  }
}
