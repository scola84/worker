import { Broadcaster } from './broadcaster';

export class Dealer extends Broadcaster {
  constructor(options) {
    super(options);
    this._pointer = 0;
  }

  pass(box, data, callback) {
    this.log('info', box, data, this._pointer);

    this._workers[this._pointer].handle(box, data, callback);

    this._pointer = this._pointer === this._workers.length - 1 ?
      0 : this._pointer + 1;
  }
}
