let id = 0;

export default class Worker {
  constructor(methods = {}) {
    this._id = 'worker_' + (++id);

    this._act = methods.act;
    this._decide = methods.decide;
    this._err = methods.err;

    this._parent = null;
    this._worker = null;
  }

  act(box, data, callback) {
    if (this._act) {
      this._act(box, data, callback);
    } else {
      this.pass(box, data, callback);
    }
  }

  connect(worker) {
    this._worker = worker.parent(this);
    return worker;
  }

  decide(box) {
    if (this._decide) {
      return this._decide(box);
    }

    return true;
  }

  err(box, error, callback) {
    if (this._err) {
      this._err(box, error, callback);
    } else {
      this.fail(box, error, callback);
    }
  }

  fail(box, error, callback) {
    if (this._worker) {
      this._worker.err(box, error, callback);
    }
  }

  find(compare, up = false) {
    if (compare(this) === true) {
      return this;
    }

    if (up === false) {
      if (this._worker) {
        return this._worker.find(compare);
      }
    } else if (this._parent) {
      return this._parent.find(compare, false);
    }

    return null;
  }

  handle(box, data, callback) {
    try {
      const decision = this.decide(box, data);

      if (decision === true) {
        this.act(box, data, callback);
      } else if (decision === false) {
        this.pass(box, data, callback);
      }
    } catch (error) {
      this.fail(box, error, callback);
    }
  }

  inject(worker) {
    worker.connect(this._worker);
    this.connect(worker);

    return worker;
  }

  parent(parent) {
    this._parent = parent;
    return this;
  }

  pass(box, data, callback) {
    if (this._worker) {
      this._worker.handle(box, data, callback);
    }
  }

  through([input, output]) {
    this.connect(input);
    return output;
  }
}
