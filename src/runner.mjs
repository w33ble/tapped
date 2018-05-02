import Queue from 'p-queue';
import { normalizeOptions } from './utils.mjs';

export default class Runner {
  constructor(Tapped, options = {}) {
    this.Tapped = Tapped;
    this.concurrency = options.concurrency || 4;
    this.implicitEnd = options.implicitEnd || true;
    this.queue = null;

    const createTest = (...args) => {
      const test = this.createTappedInstance({}, ...args);
      this.queue.add(test);
    };

    createTest.setConcurrency = val => {
      if (!this.queue) this.concurrency = val;
    };

    createTest.setImplicitEnd = val => {
      this.implicitEnd = val;
    };

    createTest.skip = (...args) => {
      const test = this.createTappedInstance({ skip: true }, ...args);
      this.queue.add(test);
    };

    // createTest.only = (...args) => {
    //   const test = createTappedInstance({ exclusive: true }, ...args);
    //   this.queue.add(test);
    // };

    createTest.onComplete = fn => this.queue.onIdle().then(() => fn());

    return createTest;
  }

  createTappedInstance(setOpts = {}, ...args) {
    // create the queue as soon as the first test is defined
    // this allows concurrency to be set before tests are run
    if (!this.queue) {
      this.queue = new Queue({
        concurrency: this.concurrency,
        autoStart: false,
      });
    }

    const { title, opts, fn } = normalizeOptions(...args);
    return new this.Tapped(title, { ...opts, ...setOpts, implicitEnd: this.implicitEnd }, fn);
  }
}
