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
    const unsliced = this.filter(box, data);

    if (this._unify === true) {
      if (typeof box.unify !== 'undefined') {
        box._unify = box._unify || [];
        box._unify[box._unify.length] = box.unify;
      }

      box.unify = {
        count: 0,
        total: Math.ceil(unsliced.length / this._count)
      };
    }

    let arg1 = null;
    let arg2 = null;

    for (let i = 0; i < unsliced.length; i += this._count) {
      [arg1, arg2] = this.merge(box, data, unsliced, i, i + this._count);
      this.pass(arg1, arg2, callback);
    }
  }

  merge(box, data, unsliced, begin, end) {
    if (this._merge) {
      return this._merge(box, data, unsliced, begin, end);
    }

    return [box, unsliced.slice(begin, end)];
  }
}
