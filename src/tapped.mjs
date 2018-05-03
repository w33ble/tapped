import Runner from './runner.mjs';
import assert from './assert.mjs';
import {
  getRunTimer,
  getClearTimer,
  getDeferred,
  normalizeOptions,
  flattenResults,
  TappedState,
} from './utils.mjs';

const TEST_TIMEOUT = 'TEST TIMEOUT';
const TEST_END = 'TEST ENDED';
const TEST_RESOLVE = 'TEST RESOLVED';
const TEST_THREW = 'TEST THREW';

export default class Tapped {
  constructor(...args) {
    const { title, opts, fn } = normalizeOptions(...args);

    const defaultOpts = {
      timeout: 3000,
      prefix: '',
      skip: false,
      implicitEnd: true,
    };

    const options = {
      ...defaultOpts,
      ...opts,
    };

    this.title = options.prefix.length ? `${options.prefix} ${title}` : title;
    this.timeout = options.timeout;
    this.skip = options.skip;
    this.implicitEnd = options.implicitEnd;
    this.tracker = new TappedState(this.title);
    this.fn = fn;
    this.assertsPlanned = null;
    this.assertsFound = 0;
    this.assertResults = [];
    this.isSuite = false;
    this.suiteResults = null;

    // start the runner, and also hide internal object properties
    return () => this.run();
  }

  getTestMethod() {
    // create new runner, with onComplete handler
    // runnerDeferred will resolve when the runner is finished
    const runnerDeferred = getDeferred();
    const runner = new Runner(Tapped, {
      concurrency: 1, // nested runners always have a concurrency of 1
      implicitEnd: this.implicitEnd, // preserve the implicitEnd setting
      onComplete: results => {
        // called when the runner is complete
        runnerDeferred.defer(results);
      },
    });

    const testMethod = (...args) => {
      const { title, opts, fn } = normalizeOptions(...args);
      const newOpts = { ...opts, prefix: this.title };
      this.isSuite = true;

      // execute the new runner
      runner(title, newOpts, fn);

      // save the promise instance
      this.suiteResults = runnerDeferred.promise;
    };

    // create base methods
    testMethod.plan = val => {
      this.assertsPlanned = val;
    };

    testMethod.timeout = val => {
      this.timeout = val;
    };

    testMethod.end = err => {
      this.tracker.complete(TEST_END, err);
    };

    // attach assert methods
    Object.keys(assert).forEach(a => {
      testMethod[a] = (...args) => {
        // keep track of assertion calls
        this.assertsFound = this.assertsFound + 1;
        this.assertResults.push(assert[a](...args));
      };
    });

    return testMethod;
  }

  getPassedInfo(status, err) {
    const endedEarly = !this.implicitEnd && status === TEST_RESOLVE && this.assertsPlanned == null;
    const badStatus = status === TEST_THREW || status === TEST_TIMEOUT;
    const plannedMismatch =
      this.assertsPlanned != null && this.assertsPlanned !== this.assertsFound;

    const results = {
      passed: !endedEarly && !badStatus && !err && !plannedMismatch,
      message: '',
    };

    if (err) results.message = String(err);
    if (status === TEST_THREW) results.message = `Test threw (${String(err)})`;
    if (status === TEST_TIMEOUT) results.message = `Test timed out (${this.timeout}ms)`;
    if (endedEarly) results.message = 'Test ended unexpectedly';
    if (plannedMismatch)
      results.message = `Expected ${this.assertsPlanned} test${
        this.assertsPlanned > 1 ? 's' : ''
      } but found ${this.assertsFound}`;

    return results;
  }

  run() {
    // skip test
    if (this.skip) {
      // console.log('# SKIPPED:', this.title);
      // console.log('');
      return Promise.resolve({
        title: this.title,
        skipped: this.skip,
        passed: true,
        runtime: 0,
      });
    }

    // start the runner timer
    let clearTimer;
    const trackerDeferred = getDeferred();
    const getTime = getRunTimer();

    // execute the test spec
    new Promise((resolve, reject) => {
      try {
        const result = this.fn(this.getTestMethod());
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }).then(
      () => {
        if (this.isSuite) {
          this.suiteResults.then(props => {
            this.tracker.complete(TEST_RESOLVE, null, props);
          });
          return;
        }

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

    this.tracker.onComplete((status, err, payload) => {
      const runtime = getTime();
      if (clearTimer) clearTimer();

      if (this.isSuite) {
        trackerDeferred.defer({
          title: this.title,
          values: flattenResults(payload),
          runtime,
        });
        return;
      }

      const { passed, message } = this.getPassedInfo(status, err);

      trackerDeferred.defer({
        title: this.title,
        results: this.assertResults,
        planned: this.assertsPlanned,
        found: this.assertsFound,
        passed,
        message,
        runtime,
      });
    });

    return trackerDeferred.promise;
  }
}
