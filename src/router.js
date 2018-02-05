import Worker from './worker';

export default class Router extends Worker {
  constructor(methods) {
    super(methods);
    this._workers = {};
  }

  act(box, data, callback) {
    if (this._act) {
      this._act(box, data, callback);
    } else {
      this.pass(box.name, box, data, callback);
    }
  }

  connect(name, worker) {
    if (worker === null) {
      return this;
    }

    this._workers[name] = worker;
    return super.connect(worker);
  }

  disconnect(name) {
    delete this._workers[name];
    return this;
  }

  inject(name, worker) {
    return super.connect(name, worker);
  }

  pass(name, box, data, callback) {
    if (this._workers[name]) {
      this._workers[name].handle(box, data, callback);
    }
  }

  through(name, [input, output]) {
    this.connect(name, input);
    return output;
  }

  _find(compare) {
    const names = Object.keys(this._workers);
    let found = null;

    for (let i = 0; i < names.length; i += 1) {
      found = this._workers[names[i]].find(compare);

      if (found) {
        return found;
      }
    }

    return found;
  }
}
