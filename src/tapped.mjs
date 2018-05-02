import Runner from './runner.mjs';
import assert from './assert.mjs';
import {
  getRunTimer,
  getClearTimer,
  getDeferred,
  normalizeOptions,
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

    // start the runner, and also hide internal object properties
    return this.run();
  }

  getTestMethod() {
    const testMethod = (...args) => {
      const { title, opts, fn } = normalizeOptions(...args);
      const newOpts = { ...opts, prefix: this.title };
      this.isSuite = true;

      // nested runners always have a concurrency of 1
      const runnerDeferred = getDeferred();
      const runner = new Runner(Tapped, { concurrency: 1, implicitEnd: this.implicitEnd });

      runner(title, newOpts, fn);
      runner.onComplete(runnerDeferred.defer);

      return runnerDeferred.promise;
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

  // TODO: remove this
  debugOutput({ status, err, runtime }) {
    if (!this.isSuite) {
      console.log('# %s (%s) - %d ms', this.title, status, runtime);

      if (status === TEST_THREW) {
        console.log(err);
      } else if (status !== TEST_TIMEOUT) {
        if (this.assertsPlanned) {
          console.log('expected %d assertions, got %d', this.assertsPlanned, this.assertsFound);
        } else {
          console.log('got %d assertion(s)', this.assertsFound);
        }

        const [passed, failed] = this.assertResults.reduce(
          (acc, result) => {
            if (result.pass) acc[0].push(result);
            else acc[1].push(result);
            return acc;
          },
          [[], []]
        );

        console.log(`${passed.length} of ${this.assertsFound} passed, ${failed.length} failed`);

        if (failed.length > 0) {
          failed.forEach(f => {
            console.log(`${f.operator}; expected ${f.expected}, got ${f.actual} @ ${f.location}`);
            console.log(f.stack);
          });
        }
      }
      console.log('');
    }
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
      if (clearTimer) clearTimer();

      // TODO: remove this
      this.debugOutput({ status, err, runtime });

      trackerDeferred.defer({
        results: this.assertResults,
        planned: this.assertsPlanned,
        found: this.assertsFound,
        runtime,
      });
    });

    return trackerDeferred.promise;
  }
}
