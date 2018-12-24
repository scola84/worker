import { scheduleJob } from 'node-schedule';
import Worker from './worker';

export default class Timer extends Worker {
  constructor(options = {}) {
    super(options);

    this._interval = null;
    this._schedule = null;

    this.setInterval(options.interval);
    this.setSchedule(options.schedule);
  }

  setInterval(value = null) {
    this._interval = value;
    return this;
  }

  setSchedule(value = null) {
    this._schedule = value;
    return this;
  }

  start(mode = 1) {
    if ((mode & 1) === 0) {
      return;
    }

    if (this._schedule !== null) {
      this._executeSchedule();
    }

    if (this._interval !== null) {
      this._executeInterval();
    }

    if ((mode & 2) === 2) {
      this._execute({
        immediate: true
      });
    }
  }

  _execute(box) {
    const data = this.filter(box);
    this.handle(box, data);
  }

  _executeInterval() {
    const interval = typeof this._interval === 'number' ?
      ({ default: this._interval }) :
      this._interval;

    const names = Object.keys(interval);
    let name = null;

    for (let i = 0; i < names.length; i += 1) {
      name = names[i];
      this._makeInterval(name, interval[name]);
    }
  }

  _executeSchedule() {
    const schedule = typeof this._schedule === 'string' ?
      ({ default: this._schedule }) :
      this._schedule;

    const names = Object.keys(schedule);
    let name = null;

    for (let i = 0; i < names.length; i += 1) {
      name = names[i];
      this._makeSchedule(name, schedule[name]);
    }
  }

  _makeInterval(name, interval) {
    setInterval(() => {
      if (this._log === 'time') {
        console.log('timer (%s): interval=%s',
          this._id, this._interval);
      }

      this._execute({
        interval: name
      });
    }, interval);
  }

  _makeSchedule(name, schedule) {
    scheduleJob(schedule, () => {
      if (this._log === 'time') {
        console.log('timer (%s): schedule=%s',
          this._id, this._schedule);
      }

      this._execute({
        schedule: name
      });
    });
  }
}
