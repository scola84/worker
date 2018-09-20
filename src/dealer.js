import Broadcaster from './broadcaster';

export default class Dealer extends Broadcaster {
  constructor(methods) {
    super(methods);
    this._pointer = 0;
  }

  pass(box, data, callback) {
    if (this._log === 'deal') {
      console.log('dealer (%s): pointer=%s, workers=%s',
        this._id, this._pointer, Object.keys(this._workers));
    }

    this._workers[this._pointer].handle(box, data, callback);

    this._pointer = this._pointer === this._workers.length - 1 ?
      0 : this._pointer + 1;
  }
}
