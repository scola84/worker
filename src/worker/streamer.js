import fs from 'fs-extra';
import { Worker } from './worker';

export class Streamer extends Worker {
  constructor(options = {}) {
    super(options);

    this._read = null;
    this._write = null;

    this.setRead(options.read);
    this.setWrite(options.write);
  }

  getOptions() {
    return Object.assign(super.getOptions(), {
      read: this._read,
      write: this._write
    });
  }

  getRead() {
    return this._read;
  }

  setRead(value = null) {
    this._read = value;
    return this;
  }

  getWrite() {
    return this._write;
  }

  setWrite(value = null) {
    this._write = value;
    return this;
  }

  act(box, data, callback) {
    if (this._read) {
      this.read(box);
    } else if (this._write) {
      this.write(box, data, callback);
    }
  }

  createReadStream(box, data, callback) {
    this._read(box, data, callback);
  }

  createWriteStream(box, data, callback) {
    this._write(box, data, callback);
  }

  data(box, data) {
    if (this._write) {
      this.write(box, data, (bx, resume) => {
        this.throttle(box, resume);
      });
    } else {
      this.pass(box, data, (bx, resume) => {
        this.throttle(box, resume);
      });
    }
  }

  end(box) {
    if (this._write) {
      this.write(box, null);
    } else {
      this.pass(box, null);
    }
  }

  fail(box, error, callback) {
    this.throttle(box, false);
    super.fail(box, error, callback);
  }

  pause(box, callback = () => {}) {
    const stream = box['writer_' + this._id];

    if (stream.paused) {
      return;
    }

    stream.paused = true;

    stream.once('drain', () => {
      stream.paused = false;
      callback(box, true);
    });

    callback(box, false);
  }

  read(box, data) {
    this.startRead(box, data);
  }

  startRead(box, data, callback = () => {}) {
    if (box['reader_' + this._id]) {
      callback(null, box['reader_' + this._id]);
      return;
    }

    this.createReadStream(box, data, (createError, stream) => {
      if (createError) {
        this.fail(box, createError);
        return;
      }

      if (typeof stream === 'string') {
        stream = fs.createReadStream(stream);
      }

      box['reader_' + this._id] = stream;

      if (stream.listenerCount('error') === 0) {
        stream.once('error', (error) => {
          delete box['reader_' + this._id];
          stream.removeAllListeners();
          this.fail(box, error);
        });
      }

      stream.on('data', (dat) => {
        this.data(box, dat);
      });

      stream.once('end', () => {
        delete box['reader_' + this._id];
        stream.removeAllListeners();
        this.end(box);
      });

      callback(null, stream);
    });
  }

  startWrite(box, data, callback) {
    if (box['writer_' + this._id]) {
      callback(null, box['writer_' + this._id]);
      return;
    }

    this.createWriteStream(box, data, (createError, stream) => {
      if (createError) {
        this.fail(box, createError);
        return;
      }

      if (typeof stream === 'string') {
        stream = fs.createWriteStream(stream);
      }

      box['writer_' + this._id] = stream;

      stream.paused = false;

      if (stream.listenerCount('error') === 0) {
        stream.once('error', (error) => {
          delete box['writer_' + this._id];
          stream.removeAllListeners();
          this.fail(box, error);
        });
      }

      stream.once('finish', () => {
        delete box['writer_' + this._id];
        stream.removeAllListeners();
        this.pass(box, null);
      });

      callback(null, stream);
    });
  }

  throttle(box, resume) {
    const stream = box['reader_' + this._id];

    if (typeof stream === 'undefined') {
      return;
    }

    if (resume) {
      box['reader_' + this._id].resume();
    } else {
      box['reader_' + this._id].pause();
    }
  }

  write(box, data, callback) {
    this.startWrite(box, data, (error, stream) => {
      if (data === null) {
        stream.end();
        return;
      }

      const write = stream.write(data);

      if (write === false) {
        this.pause(box, callback);
      }
    });
  }
}
