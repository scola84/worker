import Timer from './timer';

export default class Rotator extends Timer {
  constructor(options = {}) {
    super(options);

    this._begin = null;
    this._count = null;
    this._offset = null;
    this._wrap = null;

    this.setBegin(options.begin);
    this.setCount(options.count);
    this.setOffset(options.offset);
    this.setWrap(options.wrap);
  }

  setBegin(value = null) {
    this._begin = value;
    return this;
  }

  setCount(value = 10) {
    this._count = value;
    return this;
  }

  setOffset(value = 0) {
    this._offset = value;
    return this;
  }

  setWrap(value = false) {
    this._wrap = value;
    return this;
  }

  act(box, data, callback) {
    if (this._begin) {
      this._back(box, data, callback);
    } else {
      this._forward(box, data, callback);
    }
  }

  rotate(box, data, callback, count) {
    box.limit.offset = count > 0 && (count % box.limit.count) === 0 ?
      box.limit.offset + box.limit.count : 0;

    if (this._log === 'rotate') {
      console.log('rotator (%s): fn=rotate, limit=%j, count=%s, result=%s',
        this._id, box.limit, count, box.limit.offset === 0);
    }

    if (box.limit.offset > 0) {
      this.pass(box, data, callback);
      return false;
    }

    return true;
  }

  _back(box, data, callback) {
    const count = this.filter(box, data);

    if (this._log === 'rotate') {
      console.log('rotator (%s): fn=back, limit=%j, count=%s',
        this._id, box.limit, count);
    }

    const result = this._begin.rotate(box, data, callback, count);

    if (result === true) {
      box = this._wrap === true ? box.box : box;
      this.pass(box, data, callback);
    }

  }

  _forward(box, data, callback) {
    if (this._wrap === true) {
      box = { box };
    }

    box.limit = box.limit || {
      count: this._count,
      offset: 0
    };

    if (this._log === 'rotate') {
      console.log('rotator (%s): fn=forward, limit=%j',
        this._id, box.limit);
    }

    this.pass(box, data, callback);
  }
}
