import util from 'util';

let id = 0;

const logOptions = {
  depth: 0,
  level: 0
};

export default class Worker {
  static getId() {
    return id;
  }

  static setOptions(options) {
    Object.assign(logOptions, options);
  }

  constructor(options = {}) {
    this._act = null;
    this._bypass = null;
    this._decide = null;
    this._err = null;
    this._filter = null;
    this._id = null;
    this._log = null;
    this._merge = null;
    this._parent = null;
    this._worker = null;

    this.setAct(options.act);
    this.setDecide(options.decide);
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
    return worker;
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

  decide(box, data) {
    if (this._decide) {
      return this._decide(box, data);
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
    this.log('error', box, error, callback);

    if (this._bypass) {
      this._bypass.err(box, error, callback);
    } else if (this._worker) {
      this._worker.err(box, error, callback);
    }
  }

  filter(box, data, context) {
    if (this._filter) {
      return this._filter(box, data, context);
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
      const decision = this.decide(box, data);

      if (decision === true) {
        this.act(box, data, callback);
      } else if (decision === false) {
        this.pass(box, data, callback);
      } else if (this._bypass) {
        this._bypass.handle(box, data, callback);
      }
    } catch (error) {
      this.fail(box, error, callback);
    }
  }

  log(name, ...args) {
    if (logOptions.level === 0) {
      return;
    }

    if (name === 'info') {
      if (logOptions.level > 1) {
        args = args.slice(0, logOptions.level - 2);
      } else if (this._log !== true) {
        return;
      }
    } else if (name === 'error') {
      if (args[1] instanceof Error === true && args[1].logged !== true) {
        args[1].logged = true;
      } else if (logOptions.level > 1) {
        name = 'info';
        args = [];
      } else {
        return;
      }
    }

    if (args.length > 0 && util) {
      args[0] = util.inspect(args[0], { depth: logOptions.depth });
    }

    console[name](new Date().toISOString(),
      this.constructor.name, this.getId(),
      ...args);
  }

  merge(box, data, object) {
    if (this._merge) {
      return this._merge(box, data, object);
    }

    return data;
  }

  pass(box, data, callback) {
    this.log('info', box, data, callback);

    if (this._worker) {
      this._worker.handle(box, data, callback);
    }
  }
}
