import merge from 'lodash-es/merge';
import sprintf from 'sprintf-js';

const logger = {
  log(...args) {
    console.log(...args);
  }
};

const woptions = {
  filter: 'fail',
  format: '%(date)s %(description)s',
  id: 0,
  levels: {
    fail: {
      icon: '\x1b[31m✖\x1b[0m',
      logger
    },
    info: {
      icon: ' ',
      logger
    },
    pass: {
      icon: '\x1b[32m✔\x1b[0m',
      logger
    },
    skip: {
      icon: ' ',
      logger
    }
  }
};

export default class Worker {
  static getId() {
    return woptions.id;
  }

  static setOptions(options) {
    merge(woptions, options);
  }

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

    this.setAct(options.act);
    this.setDecide(options.decide);
    this.setDescription(options.description);
    this.setErr(options.err);
    this.setFilter(options.filter);
    this.setId(options.id);
    this.setLog(options.log);
    this.setMerge(options.merge);
  }

  getAct() {
    return this._act;
  }

  setAct(value = null) {
    this._act = value;
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

  setId(value = ++woptions.id) {
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

  act(box, data, callback) {
    data = this.filter(box, data);

    if (this._act) {
      this._act(box, data, callback);
    } else {
      data = this.merge(box, data);
      this.pass(box, data, callback);
    }
  }

  bypass(worker = null) {
    if (worker === null) {
      return this;
    }

    this._bypass = worker;
    return this;
  }

  clone() {
    return new this.constructor({
      act: this._act,
      decide: this._decide,
      err: this._err,
      filter: this._filter,
      log: this._log,
      merge: this._merge
    });
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
    } else {
      this.fail(box, error, callback);
    }
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
      if (this._workers) {
        return this._find(compare);
      } else if (this._worker) {
        return this._worker.find(compare);
      }
    } else if (this._parent) {
      return this._parent.find(compare, false);
    }

    return null;
  }

  handle(box, data, callback) {
    try {
      const decision = this.decide(box, data, callback);

      if (decision === true) {
        this.act(box, data, callback);
      } else if (decision === false) {
        this.skip(box, data, callback);
      } else if (this._bypass) {
        this._bypass.handle(box, data, callback);
      }
    } catch (error) {
      error.data = data;
      this.fail(box, error, callback);
    }
  }

  log(name, box, data, callback, ...extra) {
    const filter = woptions.filter === 'all' ?
      'pass,fail,skip,info' : woptions.filter;

    if (filter.indexOf(name) === -1) {
      if (this._log !== true) {
        return;
      }
    }

    let error = '';

    if (name === 'fail') {
      const unlogged = data instanceof Error === true &&
        data.logged !== true;
      const onlyFail = filter.indexOf(',') === -1;

      if (unlogged) {
        error = data;
        error.logged = true;
        data = '';
      } else if (onlyFail) {
        return;
      }

      if (error && error.data && error.data.password) {
        delete error.data.password;
      }
    }

    const level = woptions.levels[name];

    const description = this.resolve(this._description,
      box, data || error, ...extra);

    const options = {
      date: new Date().toISOString(),
      description: description || this.constructor.name,
      icon: level.icon,
      id: this._id,
      name: this.constructor.name,
      box,
      data,
      error,
      callback
    };

    const format = this.resolve(woptions.format,
      options, ...extra);

    if (format === null) {
      return;
    }

    try {
      level.logger.log(this.stringify(format, options), error);
    } catch (writeError) {
      console.log('Could not write to log', writeError);
    }
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

  resolve(fn, ...args) {
    if (typeof fn === 'function') {
      return this.resolve(fn(...args), ...args);
    }

    return fn;
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
