import Worker from './worker';

export default class Streamer extends Worker {
  constructor(methods = {}) {
    super(methods);

    this._name = ['stream', this._id].join('_');

    this._data = methods.data;
    this._end = methods.end;
    this._stream = methods.stream;
  }

  data(box, data) {
    if (this._data) {
      this._data(box, data);
    } else {
      this.pass(box, data, (bx, resume) => {
        this.throttle(box, resume);
      });
    }
  }

  end(box) {
    if (this._end) {
      this._end(box);
    } else {
      this.pass(box, null);
    }
  }

  fail(box, error, callback) {
    this.throttle(box, false);
    super.fail(box, error, callback);
  }

  read(box) {
    this._createReadStream(box);
  }

  stream(box) {
    return this._stream(box);
  }

  throttle(box, resume) {
    const streamer = box[this._name];

    if (typeof streamer === 'undefined') {
      return;
    }

    if (resume === true) {
      streamer.stream.resume();
    } else {
      streamer.stream.pause();
    }
  }

  write(box, data, callback) {
    const streamer = this._createWriteStream(box);

    if (data === null) {
      streamer.stream.end();
      return;
    }

    if (streamer.paused === true) {
      streamer.data.push(data);
      return;
    }

    const write = streamer.stream.write(data);

    if (write === false) {
      this._pause(box, callback);
    } else if (streamer.data.length > 0) {
      this._resume(box, callback);
    }
  }

  _createReadStream(box) {
    const streamer = this._createStream(box);

    if (streamer.read === true) {
      return streamer;
    }

    streamer.read = true;

    streamer.stream.on('data', (data) => {
      this.data(box, data);
    });

    streamer.stream.once('end', () => {
      this.end(box);
    });

    return streamer;
  }

  _createStream(box) {
    let streamer = box[this._name];

    if (typeof streamer === 'undefined') {
      streamer = {
        data: [],
        paused: false,
        read: false,
        stream: this.stream(box),
        write: false
      };

      box[this._name] = streamer;

      if (streamer.stream.listenerCount('error') === 0) {
        streamer.stream.once('error', (error) => {
          this.fail(box, error);
        });
      }
    }

    return streamer;
  }

  _createWriteStream(box) {
    const streamer = this._createStream(box);

    if (streamer.write === true) {
      return streamer;
    }

    streamer.write = true;
    return streamer;
  }

  _pause(box, callback = () => {}) {
    box[this._name].paused = true;
    callback(box, false);

    box[this._name].stream.once('drain', () => {
      callback(box, true);
      this._resume(box, callback);
    });
  }

  _resume(box, callback) {
    box[this._name].paused = false;

    if (box[this._name].data.length === 0) {
      return;
    }

    this.write(box, box[this._name].data.shift(), callback);
  }
}
