import { Timer } from './timer';

export class Rotator extends Timer {
  constructor(options = {}) {
    super(options);

    this._begin = null;
    this._count = null;
    this._offset = null;

    this.setBegin(options.begin);
    this.setCount(options.count);
    this.setOffset(options.offset);
  }

  getOptions() {
    return Object.assign(super.getOptions(), {
      begin: this._begin,
      count: this._count,
      offset: this._offset,
    });
  }

  getBegin() {
    return this._begin;
  }

  setBegin(value = null) {
    this._begin = value;
    return this;
  }

  getCount() {
    return this._count;
  }

  setCount(value = 10) {
    this._count = value;
    return this;
  }

  getOffset() {
    return this._offset;
  }

  setOffset(value = 0) {
    this._offset = value;
    return this;
  }

  act(box, data, callback) {
    if (this._begin) {
      this.backward(box, data, callback);
      return;
    }

    this.forward(box, data, callback);
  }

  backward(box, data, callback) {
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

  err(box, error, callback) {
    this.act(box, error.data, callback);
  }

  forward(box, data, callback) {
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
}
