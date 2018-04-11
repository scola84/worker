import Worker from './worker';

export default class Unifier extends Worker {
  constructor(options = {}) {
    super(options);

    this._collect = null;
    this.setCollect(options.collect);
  }

  setCollect(value = false) {
    this._collect = value;
    return this;
  }

  act(box, data, callback) {
    box.unify.count += 1;

    if (this._collect === true) {
      box.unify.data = box.unify.data || [];
      box.unify.data[box.unify.data.length] = data;
    }

    if (box.unify.count === box.unify.total) {
      if (this._collect === true) {
        data = box.unify.data;
        delete box.unify.data;
      }

      if (typeof box._unify !== 'undefined') {
        box.unify = box._unify.pop();

        if (box._unify.length === 0) {
          delete box._unify;
        }
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
