import assert from './assert.mjs';
import { getRunTimer, getClearTimer, getDeferred, Tracker } from './utils.mjs';

const TEST_TIMEOUT = 'TEST TIMEOUT';
const TEST_END = 'TEST ENDED';
const TEST_RESOLVE = 'TEST RESOLVED';
const TEST_THREW = 'TEST THREW';

export default class Tapped {
  constructor(...args) {
    const { title, opts, fn } = this.normalizeOptions(...args);

    const defaultOpts = {
      prefix: '',
    };

    const options = {
      ...defaultOpts,
      ...opts,
    };

    this.title = options.prefix.length ? `${options.prefix} ${title}` : title;
    this.fn = fn;
    this.tracker = new Tracker(this.title);
    this.plan = null;
    this.testCount = 0;
    this.timeout = opts.timeout || 3000;
    this.skip = opts.skip || false;
    this.ok = true;

    // start the runner, and also hide internal object properties
    return this.run();
  }

  normalizeOptions(title, opts, fn) {
    if (typeof opts === 'function') {
      fn = opts;
      opts = {};
    }
    return { title, opts, fn };
  }

  getTestMethod() {
    const testMethod = (...args) => {
      const { title, opts, fn } = this.normalizeOptions(...args);
      const newOpts = { ...opts, prefix: this.title };
      this.isSuite = true;
      return new Tapped(title, newOpts, fn);
    }

    // create base methods
    testMethod.plan = val => (this.plan = val);
    testMethod.timeout = val => (this.timeout = val);
    testMethod.end = () => this.tracker.complete(TEST_END);

    // attach assert methods
    Object.keys(assert).forEach(a => {
      testMethod[a] = (...args) => {
        // keep track of assertion calls
        this.testCount = this.testCount + 1;
        return assert[a](...args);
      }
    });

    return testMethod;
  }

  run() {
    // skip test
    if (this.skip) {
      console.log('# SKIPPED:', this.title);
      console.log('run time: 0');
      console.log('');
      return Promise.resolve();
    }

    // start the runner timer
    let clearTimer;
    const trackerDeferred = getDeferred();
    const getTime = getRunTimer();

    // execute the test spec
    const testResult = new Promise((resolve, reject) => {
      try {
        const result = this.fn(this.getTestMethod());
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }).then(
      () => {
        this.tracker.complete(TEST_RESOLVE);
      },
      err => {
        this.tracker.complete(TEST_THREW, err);
      }
    );

    // ensure test completes within given timeout
    // timer is created after test runner starts, to allow custom timeout
    // if test is sync and calls end, tracker will be resolved
    if (!this.tracker.resolved) {
      clearTimer = getClearTimer(this.timeout, () => {
        this.tracker.complete(TEST_TIMEOUT);
      });
    }

    this.tracker.onComplete((status, err) => {
      const runtime = getTime();
      clearTimer && clearTimer();

      if (this.isSuite) {
        console.log('## suite complete:', this.title);
        console.log('run time:', runtime);
        console.log('');
        trackerDeferred.defer();
        return;
      }

      console.log('#', this.title);
      console.log('status:', status);
      if (status === TEST_THREW) console.error(err);
      console.log('run time:', runtime);
      console.log('assertions', this.testCount);
      console.log('planned', this.plan);
      console.log('');

      trackerDeferred.defer();
    });

    return trackerDeferred.promise;
  }
}
