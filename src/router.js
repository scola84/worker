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
    this._workers[name] = worker;
    return super.connect(worker);
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
}
