import { Worker } from './worker';

export class Slicer extends Worker {
  constructor(options = {}) {
    super(options);

    this._count = null;
    this._name = null;
    this._unify = null;

    this.setCount(options.count);
    this.setName(options.name);
    this.setUnify(options.unify);
  }

  getOptions() {
    return Object.assign(super.getOptions(), {
      count: this._count,
      name: this._name,
      unify: this._unify
    });
  }

  getCount() {
    return this._count;
  }

  setCount(value = 1) {
    this._count = value;
    return this;
  }

  getName() {
    return this._name;
  }

  setName(value = 'default') {
    this._name = value;
    return this;
  }

  getUnify() {
    return this._unify;
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

      this.log('info', box, data, box.unify);
    }

    if (items.length === 0) {
      if (this._bypass) {
        this._bypass.handle(box, data, callback);
      }
    }

    for (let i = 0; i < items.length; i += this._count) {
      this.pass(
        ...this.merge(box, data, items, i, i + this._count),
        callback
      );
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
