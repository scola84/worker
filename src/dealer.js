import Broadcaster from './broadcaster';

export default class Dealer extends Broadcaster {
  constructor(methods) {
    super(methods);
    this._pointer = 0;
  }

  pass(box, data, callback) {
    this._workers[this._pointer].handle(box, data, callback);

    this._pointer =
      this._pointer === this._workers.length - 1 ?
      0 : this._pointer + 1;
  }
}
