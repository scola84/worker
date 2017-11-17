import Worker from './worker';

export default class Timer extends Worker {
  start(interval) {
    setInterval(() => this.handle(), interval);
  }
}
