import Worker from './worker';

export default class Broadcaster extends Worker {
  constructor(methods) {
    super(methods);
    this._workers = [];
  }

  connect(worker) {
    this._workers.push(worker);
    return worker;
  }

  pass(box, data, callback) {
    for (let i = 0; i < this._workers.length; i += 1) {
      this._workers[i].handle(box, data, callback);
    }
  }
}
