import merge from 'lodash-es/merge';
import util from 'util';
import sprintf from 'sprintf-js';

const woptions = {
  depth: 0,
  format: '%(icon)s %(date)s %(description)s %(box)s %(data)s',
  id: 0,
  level: 1,
  levels: {
    fail: {
      depth: null,
      fn: 'error',
      format: null,
      icon: '\x1b[31m✖\x1b[0m',
      number: 1
    },
    pass: {
      depth: null,
      fn: 'log',
      format: null,
      icon: '\x1b[32m✔\x1b[0m',
      number: 2
    },
    info: {
      depth: null,
      fn: 'log',
      format: null,
      icon: ' ',
      number: 3
    },
    debug: {
      depth: null,
      fn: 'log',
      format: null,
      icon: ' ',
      number: 4
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

  check(object, properties, strict = false) {
    let property = null;

    for (let i = 0; i < properties.length; i += 1) {
      property = properties[i];

      if (typeof object[property] === 'undefined') {
        throw new Error(`Property ${property} is undefined`);
      }

      if (object[property] === null) {
        throw new Error(`Property ${property} is null`);
      }

      if (strict === true && object[property] === '') {
        throw new Error(`Property ${property} is an empty string`);
      }
    }
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

  copy(worker) {
    return this
      .setAct(worker.getAct())
      .setDecide(worker.getDecide())
      .setErr(worker.getErr())
      .setFilter(worker.getFilter())
      .setLog(worker.getLog())
      .setMerge(worker.getMerge());
  }

  decide(box, data, callback) {
    let decision = true;

    if (this._decide) {
      decision = this._decide(box, data);

      if (decision !== true) {
        this.log('info', box, data, callback);
      }
    }

    return decision;
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
        this.pass(box, data, callback);
      } else if (this._bypass) {
        this._bypass.handle(box, data, callback);
      }
    } catch (error) {
      error.data = data;
      this.fail(box, error, callback);
    }
  }

  log(name, box, data, callback, ...extra) {
    const level = woptions.levels[name];

    if (this._log !== true) {
      if (level.number > woptions.level) {
        return;
      }

      if (this._description === null) {
        if (woptions.level < 4) {
          if (name !== 'fail') {
            return;
          }
        }
      }
    }

    if (data instanceof Error === true) {
      if (data.logged !== true) {
        data.logged = true;
      } else {
        return;
      }
    }

    let format = level.format || woptions.format;

    if (typeof format === 'function') {
      format = format(box, data, ...extra);
    }

    let description = this._description;

    if (typeof description === 'function') {
      description = description(box, data, ...extra);
    }

    if (util) {
      if (Buffer.isBuffer(data)) {
        data = String(data);
      }

      if (typeof box === 'object') {
        box = util.inspect(box, {
          depth: level.depth === null ? woptions.depth : level.depth
        });
      }

      if (typeof data === 'object') {
        data = util.inspect(data, {
          depth: level.depth === null ? woptions.depth : level.depth
        });
      }
    }

    const options = {
      date: new Date().toISOString(),
      description: description || this.constructor.name,
      icon: level.icon,
      box,
      data,
      callback
    };

    try {
      console[level.fn](this.sprintf(format, options));
    } catch (error) {
      console.error(`${error.message}: %j`, options);
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

  sprintf(...args) {
    return sprintf.sprintf(...args);
  }
}
