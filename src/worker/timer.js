import cron from 'node-cron';
import Worker from './worker';

export default class Timer extends Worker {
  constructor(options = {}) {
    super(options);

    this._interval = null;
    this._schedule = null;

    this.setInterval(options.interval);
    this.setSchedule(options.schedule);
  }

  getOptions() {
    return Object.assign(super.getOptions(), {
      interval: this._interval,
      schedule: this._schedule
    });
  }

  getInterval() {
    return this._interval;
  }

  setInterval(value = null) {
    this._interval = value;
    return this;
  }

  getSchedule() {
    return this._schedule;
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
      this.executeSchedule();
    }

    if (this._interval !== null) {
      this.executeInterval();
    }

    if ((mode & 2) === 2) {
      this.execute({
        immediate: true
      });
    }
  }

  execute(box) {
    const data = this.filter(box);
    this.handle(box, data);
  }

  executeInterval() {
    const interval = typeof this._interval === 'number' ?
      ({ default: this._interval }) :
      this._interval;

    const names = Object.keys(interval);
    let name = null;

    for (let i = 0; i < names.length; i += 1) {
      name = names[i];
      this.makeInterval(name, interval[name]);
    }
  }

  executeSchedule() {
    const schedule = typeof this._schedule === 'string' ?
      ({ default: this._schedule }) :
      this._schedule;

    const names = Object.keys(schedule);
    let name = null;

    for (let i = 0; i < names.length; i += 1) {
      name = names[i];
      this.makeSchedule(name, schedule[name]);
    }
  }

  makeInterval(name, interval) {
    setInterval(() => {
      if (this._log === 'time') {
        console.log('timer (%s): interval=%s',
          this._id, this._interval);
      }

      this.execute({
        interval: name
      });
    }, interval);
  }

  makeSchedule(name, schedule) {
    cron.schedule(schedule, () => {
      if (this._log === 'time') {
        console.log('timer (%s): schedule=%s',
          this._id, this._schedule);
      }

      this.execute({
        schedule: name
      });
    });
  }
}
