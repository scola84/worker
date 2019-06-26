import { Worker } from './worker';

export class Manager extends Worker {
  constructor(options = {}) {
    super(options);

    this._names = null;
    this._pool = {};

    this.setNames(options.names);
  }

  getOptions() {
    return Object.assign(super.getOptions(), {
      names: this._names
    });
  }

  getNames() {
    return this._names;
  }

  setNames(value = null) {
    this._names = value;
    return this;
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

    const name = box._names.shift();
    const worker = this._pool[name];

    this.log('info', box, data, name);

    if (worker) {
      worker.handle(box, data, callback);
      return;
    }

    this.handle(box, data, callback);
  }

  fail(box, error, callback) {
    super.fail(box._original || box, error, callback);
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
