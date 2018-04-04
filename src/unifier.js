import Worker from './worker';

export default class Unifier extends Worker {
  act(box, data, callback) {
    box.unify.count += 1;

    if (box.unify.count === box.unify.total) {
      this.pass(box, data, callback);
    }
  }

  decide(box) {
    return typeof box.unify !== 'undefined';
  }
}
