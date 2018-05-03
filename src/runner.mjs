import Queue from 'p-queue';
import { normalizeOptions, flattenResults } from './utils.mjs';

export default class Runner {
  constructor(Tapped, options = {}) {
    this.Tapped = Tapped;
    this.concurrency = options.concurrency || 4;
    this.implicitEnd = options.implicitEnd || true;
    this.onComplete = options.onComplete;
    this.queue = null;
    this.tests = new Map();
    this.completed = 0;

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
      this.produceOutput();
    }
  }

  produceOutput() {
    let failed = false;

    const showTestResult = test => {
      /*
      { pass: false,
        operator: 'ok',
        msg: 'should be truthy',
        actual: false,
        expected: true,
        *stack: [Array],
        *location: ' Tapped.t [as fn] (/Users/d33t/repos/tapped/example_usage.mjs:115:11)',
        (* means on failures only)
      }
      */
      console.log(`${test.pass ? 'ok' : 'not ok'} - ${test.msg}`);
      if (!test.pass) {
        failed = true;
        console.log(`  ---
    operator: ${test.operator}
    expected: ${test.expected}
    actual: ${test.actual}
    at: ${test.location}
    stack: |-
      Error: ${test.msg}
          ${JSON.stringify(test.stack)}`);
      }
    };

    const showSuiteResult = result => {
      /*
        { title: 'suite1 suite2 suite3 |C suite3 test',
          results: [ ... ],
          planned: 1,
          found: 2,
          passed: false,
          message: 'Expected 1 tests but found 2',
          runtime: 2 }
      */
      console.log(`# ${result.passed ? 'ok' : 'not ok'} - ${result.title} (${result.runtime}ms)`);
      if (!result.passed) {
        failed = true;
        showTestResult(assert.equal(result.planned, result.found, result.message));
      }
      result.results.forEach(testResult => showTestResult(testResult));
    };

    const testResults = Array.from(this.tests.values());

    testResults.forEach(test => {
      if (test.results) {
        // simple test result
        showSuiteResult(test);
      } else if (test.values) {
        // suite test results
        test.values.forEach(value => showSuiteResult(value));
      } else {
        // should never end up here
        throw new Error(`Unknown test parsing output: ${JSON.parse(test)}`);
      }
    });
  }
}
