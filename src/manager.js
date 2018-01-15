import Worker from './worker';

export default class Manager extends Worker {
  constructor(methods = {}) {
    super(methods);

    this._names = methods.names;
    this._pool = {};
  }

  act(box, data, callback) {
    if (typeof box._names === 'undefined') {
      box = Object.assign({ _original: box }, box);
      box._names = this.names(box);
    }

    if (box._names.length === 0) {
      this.pass(box._original, data, callback);
      return;
    }

    const worker = this._pool[box._names.shift()];

    if (worker) {
      worker.handle(box, data, callback);
    } else {
      this.handle(box, data, callback);
    }
  }

  fail(box, error, callback) {
    if (this._worker) {
      this._worker.err(box._original || box, error, callback);
    }
  }

  manage(name, worker) {
    this._pool[name] = worker;
    return worker.connect(this);
  }

  names(box) {
    if (this._names) {
      return this._names(box);
    }

    return [];
  }
}
