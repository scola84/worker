let id = 0;
let logLevel = 0;

export default class Worker {
  static getId() {
    return id;
  }

  static setLogLevel(level) {
    logLevel = level;
  }

  constructor(options = {}) {
    this._act = null;
    this._decide = null;
    this._err = null;
    this._filter = null;
    this._id = null;
    this._merge = null;
    this._parent = null;
    this._worker = null;

    this.setAct(options.act);
    this.setDecide(options.decide);
    this.setErr(options.err);
    this.setId(options.id);
    this.setFilter(options.filter);
    this.setMerge(options.merge);
  }

  getId() {
    return this._id;
  }

  setAct(value = null) {
    this._act = value;
    return this;
  }

  setDecide(value = null) {
    this._decide = value;
    return this;
  }

  setErr(value = null) {
    this._err = value;
    return this;
  }

  setFilter(value = null) {
    this._filter = value;
    return this;
  }

  setId(value = ++id) {
    this._id = value;
    return this;
  }

  setMerge(value = null) {
    this._merge = value;
    return this;
  }

  setParent(value = null) {
    this._parent = value;
    return this;
  }

  act(box, data, callback) {
    if (this._act) {
      this._act(box, data, callback);
    } else {
      this.pass(box, data, callback);
    }
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
    if (logLevel > 0) {
      if (error instanceof Error === true) {
        if (error.logged !== true) {
          error.logged = true;
          this.log('error', box, error, callback);
        }
      }
    }

    if (this._worker) {
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
      }
    } catch (error) {
      this.fail(box, error, callback);
    }
  }

  log(name, ...args) {
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
    if (logLevel > 1) {
      this.log('info', [box, data, callback].slice(0, logLevel - 1));
    }

    if (this._worker) {
      this._worker.handle(box, data, callback);
    }
  }
}
