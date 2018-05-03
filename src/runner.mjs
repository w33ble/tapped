import Queue from 'p-queue';
import Results from './results.mjs';
import { normalizeOptions } from './utils.mjs';

export default class Runner {
  constructor(Tapped, options = {}) {
    this.Tapped = Tapped;
    this.concurrency = options.concurrency || 4;
    this.implicitEnd = options.implicitEnd || true;
    this.onComplete = options.onComplete;
    this.queue = null;
    this.tests = new Map();
    this.completed = 0;
    this.results = new Results();

    const addToQueue = test => {
      // keep track of tests, preserving order
      this.tests.set(test, null);

      // add tests to the queue
      this.queue.add(test).then(result => {
        // when test is completed, keep a tally and store the result
        this.completed += 1;
        this.tests.set(test, result);

        // when all the tests are done, produce the test output
        if (this.tests.size === this.completed) {
          this.finish();
        }
      });
    };

    const createTest = (...args) => {
      // create tapped runner
      const test = this.createTappedInstance({}, ...args);
      addToQueue(test);
    };

    createTest.setConcurrency = val => {
      if (!this.queue) this.concurrency = val;
    };

    createTest.setImplicitEnd = val => {
      this.implicitEnd = val;
    };

    createTest.skip = (...args) => {
      const test = this.createTappedInstance({ skip: true }, ...args);
      addToQueue(test);
    };

    // createTest.only = (...args) => {
    //   const test = createTappedInstance({ exclusive: true }, ...args);
    //   addToQueue(test);
    // };

    createTest.onComplete = fn => {
      this.onComplete = fn;
    };

    return createTest;
  }

  createTappedInstance(setOpts = {}, ...args) {
    // create the queue as soon as the first test is defined
    // this allows concurrency to be set before tests are run
    if (!this.queue) {
      this.queue = new Queue({
        concurrency: this.concurrency,
      });
    }

    const { title, opts, fn } = normalizeOptions(...args);
    return new this.Tapped(
      title,
      {
        ...opts,
        ...setOpts,
        implicitEnd: this.implicitEnd,
      },
      fn
    );
  }

  finish() {
    if (this.onComplete) {
      this.onComplete(Array.from(this.tests.values()));
    } else {
      this.results.showOutput(Array.from(this.tests.values()));

      const hasProcess = typeof process !== 'undefined' && process;
      if (hasProcess && typeof process.exit === 'function') {
        process.exit(this.results.exitCode);
      }
    }
  }
}
