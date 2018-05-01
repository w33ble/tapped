import assert from './assert.mjs';
import { getRunTimer, getClearTimer, getDeferred, Tracker } from './utils.mjs';

const TEST_TIMEOUT = 'TEST TIMEOUT';
const TEST_END = 'TEST ENDED';
const TEST_RESOLVE = 'TEST RESOLVED';
const TEST_THREW = 'TEST THREW';

export default class Tapped {
  static skip = (title, opts, fn) => {
    return new Tapped(title, { ...opts, skip: true }, fn);
  };

  constructor(title, opts, fn) {
    if (typeof opts === 'function') {
      fn = opts;
      opts = {};
    }

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

  run() {
    // skip test
    if (this.skip) {
      console.log('SKIPPING', this.title);
      return Promise.resolve();
    }

    // create spec function argument
    const proxy = new Proxy(
      {
        plan: num => {
          this.plan = num;
        },
        timeout: t => {
          this.timeout = t;
        },
        end: () => {
          this.tracker.complete(TEST_END);
        },
      },
      {
        get: (obj, prop) => {
          // return base object properties
          if (prop in obj) return obj[prop];

          // pass through assertions, but keep track of use
          if (prop in assert) {
            this.testCount = this.testCount + 1;
            return assert[prop];
          }

          return (...args) => {
            console.log('unknown proxy prop', prop);
            console.log('proxy args', args);
          };
        },
      }
    );

    // start the runner timer
    let clearTimer;
    const trackerDeferred = getDeferred();
    const getTime = getRunTimer();

    // execute the test spec
    const testResult = new Promise((resolve, reject) => {
      try {
        const result = this.fn(proxy);
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
