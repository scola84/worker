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
      scheduleJob(this._schedule, () => this.handle());
    }

    if (this._interval !== null) {
      setInterval(() => this.handle(), this._interval);
    }

    if (this._immediate === true) {
      this.handle();
    }
  }
}
