import Worker from './worker';

export default class Streamer extends Worker {
  constructor(options = {}) {
    super(options);

    this._name = ['stream', this._id].join('_');

    this._data = null;
    this._end = null;
    this._stream = null;

    this.setData(options.data);
    this.setEnd(options.end);
    this.setStream(options.stream);
  }

  getOptions() {
    return Object.assign(super.getOptions(), {
      data: this._data,
      end: this._end,
      stream: this._stream
    });
  }

  getData() {
    return this._data;
  }

  setData(value = null) {
    this._data = value;
    return this;
  }

  getEnd() {
    return this._end;
  }

  setEnd(value = null) {
    this._end = value;
    return this;
  }

  getStream() {
    return this._stream;
  }

  setStream(value = null) {
    this._stream = value;
    return this;
  }

  createReadStream(box, data) {
    const streamer = this.createStream(box, data);

    if (streamer.read === true) {
      return streamer;
    }

    streamer.read = true;

    streamer.stream.on('data', (d) => {
      this.data(box, d);
    });

    streamer.stream.once('end', () => {
      this.end(box);
    });

    return streamer;
  }

  createStream(box, data) {
    let streamer = box[this._name];

    if (typeof streamer === 'undefined') {
      streamer = {
        data: [],
        paused: false,
        read: false,
        stream: this.stream(box, data),
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

  createWriteStream(box) {
    const streamer = this.createStream(box);

    if (streamer.write === true) {
      return streamer;
    }

    streamer.write = true;
    return streamer;
  }

  data(box, data) {
    if (this._log === 'data') {
      console.log(String(data));
      console.log();
    }

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

  pause(box, callback = () => {}) {
    box[this._name].paused = true;
    callback(box, false);

    box[this._name].stream.once('drain', () => {
      callback(box, true);
      this.resume(box, callback);
    });
  }

  read(box, data) {
    this.createReadStream(box, data);
  }

  resume(box, callback) {
    box[this._name].paused = false;

    if (box[this._name].data.length === 0) {
      return;
    }

    this.write(box, box[this._name].data.shift(), callback);
  }

  stream(box, data) {
    return this._stream(box, data);
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
    if (this._log === 'data') {
      console.log(String(data));
      console.log();
    }

    const streamer = this.createWriteStream(box, data);

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
      this.pause(box, callback);
    } else if (streamer.data.length > 0) {
      this.resume(box, callback);
    }
  }
}
