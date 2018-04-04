import Worker from './worker';

export default class Timer extends Worker {
  start(interval, immediate = false) {
    setInterval(() => this.handle(), interval);

    if (immediate === true) {
      this.handle();
    }
  }
}
