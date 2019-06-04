import Worker from './worker';

export default class Router extends Worker {
  constructor(options) {
    super(options);
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

  find(compare, up = false) {
    let found = super.find(compare, up);

    if (found !== null) {
      return found;
    }

    const names = Object.keys(this._workers);

    for (let i = 0; i < names.length; i += 1) {
      found = this._workers[names[i]].find(compare, up);

      if (found) {
        return found;
      }
    }

    return found;
  }

  pass(name, box, data, callback) {
    if (this._log === 'route') {
      console.log('router (%s): name=%s, workers=%s',
        this._id, name, Object.keys(this._workers));
    }

    if (this._workers[name]) {
      this._workers[name].handle(box, data, callback);
    } else if (this._bypass) {
      this._bypass.handle(box, data, callback);
    }
  }
}
