import Worker from './worker';

export default class Slicer extends Worker {
  constructor(options = {}) {
    super(options);

    this._count = null;
    this._name = null;
    this._unify = null;
    this._wrap = null;

    this.setCount(options.count);
    this.setName(options.name);
    this.setUnify(options.unify);
    this.setWrap(options.wrap);
  }

  setCount(value = 1) {
    this._count = value;
    return this;
  }

  setName(value = 'default') {
    this._name = value;
    return this;
  }

  setUnify(value = true) {
    this._unify = value;
    return this;
  }

  setWrap(value = false) {
    this._wrap = value;
    return this;
  }

  act(box, data, callback) {
    const items = this.filter(box, data);

    if (this._wrap === true) {
      box = { box };
    }

    if (this._unify === true) {
      box.unify = box.unify || {};

      box.unify[this._name] = {
        count: 0,
        total: Math.ceil(items.length / this._count)
      };
    }

    let arg1 = null;
    let arg2 = null;

    if (items.length === 0) {
      box.unify[this._name].total = 1;
      [arg1, arg2] = this.merge(box, data, items, 0, 0);
      this.pass(arg1, arg2, callback);
    }

    for (let i = 0; i < items.length; i += this._count) {
      [arg1, arg2] = this.merge(box, data, items, i, i + this._count);
      this.pass(arg1, arg2, callback);
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
}
