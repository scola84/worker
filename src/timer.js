import { scheduleJob } from 'node-schedule';
import Worker from './worker';

export default class Timer extends Worker {
  constructor(options = {}) {
    super(options);

    this._immediate = null;
    this._interval = null;
    this._schedule = null;

    this.setImmediate(options.immediate);
    this.setInterval(options.interval);
    this.setSchedule(options.schedule);
  }

  setImmediate(value = null) {
    this._immediate = value;
    return this;
  }

  setInterval(value = null) {
    this._interval = value;
    return this;
  }

  setSchedule(value = null) {
    this._schedule = value;
    return this;
  }

  start() {
    if (this._schedule !== null) {
      scheduleJob(this._schedule, () => {
        if (this._log === 'time') {
          console.log('timer (%s): schedule=%s',
            this._id, this._schedule);
        }

        this._execute();
      });
    }

    if (this._interval !== null) {
      setInterval(() => {
        if (this._log === 'time') {
          console.log('timer (%s): interval=%s',
            this._id, this._interval);
        }

        this._execute();
      }, this._interval);
    }

    if (this._immediate === true) {
      this._execute();
    }
  }

  _execute() {
    const box = {};
    const data = this.filter(box);

    this.handle(box, data);
  }
}
