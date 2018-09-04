import Timer from './timer';

export default class Rotator extends Timer {
  constructor(options = {}) {
    super(options);

    this._count = null;
    this._offset = null;

    this.setCount(options.count);
    this.setOffset(options.offset);
  }

  setCount(value = 10) {
    this._count = value;
    return this;
  }

  setOffset(value = 0) {
    this._offset = value;
    return this;
  }

  act(box, data, callback) {
    box.limit = box.limit || {
      count: this._count,
      offset: 0
    };

    this.pass(box, data, callback);
  }

  rotate(box, count) {
    box.limit.offset = (count % box.limit.count) === 0 ?
      box.limit.offset + box.limit.count : 0;
  }
}
