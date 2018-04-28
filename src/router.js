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
      const name = this.filter(box, data);
      this.pass(name, box, data, callback);
    }
  }

  connect(name, worker = null) {
    if (worker === null) {
      return this;
    }

    if (Array.isArray(worker)) {
      this.connect(name, worker[0]);
      return worker[1];
    }

    this._workers[name] = worker;
    return super.connect(worker);
  }

  filter(box, data, context) {
    if (this._filter) {
      return this._filter(box, data, context);
    }

    return box.name;
  }

  pass(name, box, data, callback) {
    if (this._workers[name]) {
      this._workers[name].handle(box, data, callback);
    }
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
