import Worker from './worker';

export default class Slicer extends Worker {
  constructor(options = {}) {
    super(options);

    this._count = null;
    this._unify = null;

    this.setCount(options.count);
    this.setUnify(options.unify);
  }

  setCount(value = 1) {
    this._count = value;
    return this;
  }

  setUnify(value = true) {
    this._unify = value;
    return this;
  }

  act(box, data, callback) {
    const items = this.filter(box, data);

    if (this._unify === true) {
      if (typeof box.unify !== 'undefined') {
        box._unify = box._unify || [];
        box._unify[box._unify.length] = box.unify;
      }

      box.unify = {
        count: 0,
        total: Math.ceil(items.length / this._count)
      };
    }

    let arg1 = null;
    let arg2 = null;

    if (items.length === 0) {
      box.unify.total = 1;
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

    return [box, items.slice(begin, end)];
  }
}
