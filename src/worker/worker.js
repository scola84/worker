import sprintf from 'sprintf-js';
import { log } from '../helper';

let id = 0;

export class Worker {
  constructor(options = {}) {
    this._description = null;
    this._id = null;

    this._bypass = null;
    this._parent = null;
    this._worker = null;

    this._act = null;
    this._decide = null;
    this._err = null;
    this._filter = null;
    this._log = null;
    this._merge = null;
    this._wrap = null;

    this.setAct(options.act);
    this.setBypass(options.bypass);
    this.setDecide(options.decide);
    this.setDescription(options.description);
    this.setErr(options.err);
    this.setFilter(options.filter);
    this.setId(options.id);
    this.setLog(options.log);
    this.setMerge(options.merge);
    this.setParent(options.parent);
    this.setWrap(options.wrap);
    this.setWorker(options.worker);
  }

  getOptions() {
    return {
      act: this._act,
      decide: this._decide,
      description: this._description,
      err: this._err,
      filter: this._filter,
      log: this._log,
      merge: this._merge,
      wrap: this._wrap
    };
  }

  getAct() {
    return this._act;
  }

  setAct(value = null) {
    this._act = value;
    return this;
  }

  getBypass() {
    return this._bypass;
  }

  setBypass(value = null) {
    this._bypass = value;
    return this;
  }

  getDecide() {
    return this._decide;
  }

  setDecide(value = null) {
    this._decide = value;
    return this;
  }

  getDescription() {
    return this._description;
  }

  setDescription(value = null) {
    this._description = value;
    return this;
  }

  getErr() {
    return this._err;
  }

  setErr(value = null) {
    this._err = value;
    return this;
  }

  getFilter() {
    return this._filter;
  }

  setFilter(value = null) {
    this._filter = value;
    return this;
  }

  getId() {
    return this._id;
  }

  setId(value = ++id) {
    this._id = value;
    return this;
  }

  getLog() {
    return this._log;
  }

  setLog(value = false) {
    this._log = value;
    return this;
  }

  getMerge() {
    return this._merge;
  }

  setMerge(value = null) {
    this._merge = value;
    return this;
  }

  getParent() {
    return this._parent;
  }

  setParent(value = null) {
    this._parent = value;
    return this;
  }

  getWrap() {
    return this._wrap;
  }

  setWrap(value = false) {
    this._wrap = value;
    return this;
  }

  getWorker() {
    return this._worker;
  }

  setWorker(value = null) {
    this._worker = value;
    return this;
  }

  act(box, data, callback) {
    data = this.filter(box, data);

    if (this._act) {
      this._act(box, data, callback);
      return;
    }

    data = this.merge(box, data);
    this.pass(box, data, callback);
  }

  bypass(worker = null) {
    if (worker === null) {
      return this;
    }

    this._bypass = worker;
    return this;
  }

  connect(worker = null) {
    if (worker === null) {
      return this;
    }

    if (Array.isArray(worker)) {
      this.connect(worker[0]);
      return worker[1];
    }

    this._worker = worker.setParent(this);
    return worker;
  }

  decide(box, data, callback) {
    if (this._decide) {
      return this._decide(box, data, callback);
    }

    return true;
  }

  err(box, error, callback) {
    if (this._err) {
      this._err(box, error, callback);
      return;
    }

    this.fail(box, error, callback);
  }

  fail(box, error, callback) {
    this.log('fail', box, error, callback);

    if (this._bypass) {
      this._bypass.err(box, error, callback);
    } else if (this._worker) {
      this._worker.err(box, error, callback);
    }
  }

  filter(box, data, ...extra) {
    if (this._filter) {
      return this._filter(box, data, ...extra);
    }

    return data;
  }

  find(compare, up = false) {
    if (compare(this) === true) {
      return this;
    }

    if (up === false) {
      if (this._worker) {
        return this._worker.find(compare, up);
      }
    } else if (this._parent) {
      return this._parent.find(compare, up);
    }

    return null;
  }

  handle(box, data, callback) {
    try {
      this.handleTry(box, data, callback);
    } catch (error) {
      error.data = error.data || data;
      this.fail(box, error, callback);
    }
  }

  handleTry(box, data, callback) {
    const decision = this.decide(box, data, callback);

    if (decision === true) {
      this.act(box, data, callback);
    } else if (decision === false) {
      this.skip(box, data, callback);
    } else if (this._bypass) {
      this._bypass.handle(box, data, callback);
    }
  }

  log(name, box, data, callback, ...extra) {
    log(this, name, box, data, callback, ...extra);
  }

  merge(box, data, ...extra) {
    if (this._merge) {
      return this._merge(box, data, ...extra);
    }

    return data;
  }

  pass(box, data, callback) {
    this.log('pass', box, data, callback);

    if (this._worker) {
      this._worker.handle(box, data, callback);
    }
  }

  prepend(worker) {
    return this._parent
      .connect(worker)
      .connect(this);
  }

  resolve(box, data, value, ...args) {
    if (typeof value === 'function') {
      value = value(box, data, ...args);
      return this.resolve(box, data, value, ...args);
    }

    return value;
  }

  skip(box, data, callback) {
    this.log('skip', box, data, callback);

    if (this._worker) {
      this._worker.handle(box, data, callback);
    }
  }

  stringify(string, values) {
    if (Array.isArray(values)) {
      return values.filter((v) => v).join(string);
    }

    return sprintf.sprintf(string, values);
  }
}
