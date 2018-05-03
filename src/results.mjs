/* eslint no-console: 0 */
import assert from './assert.mjs';

export default class Results {
  constructor() {
    this.counter = 0;
    this.failed = 0;
    this.passed = 0;
    this.skipped = 0;
    this.tapVersion = 13;
  }

  showOutput(testResults) {
    console.log(`TAP version ${this.tapVersion}`);

    testResults.forEach(test => {
      if (test.skipped) {
        this.showSkippedTest(test);
      } else if (test.results) {
        // simple test result
        this.showSuiteResult(test);
      } else if (test.values) {
        // suite test results
        test.values.forEach(value => this.showSuiteResult(value));
      } else {
        // should never end up here
        throw new Error(`Unknown test parsing output: ${JSON.stringify(test)}`);
      }
    });

    this.showSummary();
  }

  showSuiteResult(result) {
    /*
      { title: 'suite1 suite2 suite3 |C suite3 test',
        results: [ ... ],
        planned: 1,
        found: 2,
        passed: false,
        message: 'Expected 1 tests but found 2',
        runtime: 2 }
    */
    console.log(`# ${result.title} (${result.runtime}ms)`);
    result.results.forEach(testResult => this.showTestResult(testResult));
    if (!result.passed) {
      this.showTestResult(assert.equal(result.found, result.planned, result.message));
    }
  }

  showTestResult(test) {
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
    this.counter += 1;

    console.log(`${test.pass ? 'ok' : 'not ok'} ${this.counter} ${test.msg}`);

    if (test.pass) {
      this.passed += 1;
    } else {
      this.failed += 1;

      console.log(`  ---
    operator: ${test.operator}
    expected: ${test.expected}
    actual: ${test.actual}
    at: ${test.location}
    stack: |-
      Error: ${test.msg}`);

      test.stack.forEach(line => console.log(`          ${line}`));

      console.log('  ...');
    }
  }

  showSkippedTest(test) {
    this.skipped += 1;
    console.log(`# SKIPPED ${test.title}`);
  }

  showSummary() {
    const totalTests = this.passed + this.failed;
    console.log(`\n1..${totalTests}`);
    console.log(`# tests ${totalTests}`);
    console.log(`# pass  ${this.passed}`);
    console.log(`# fail  ${this.failed}`);
    if (this.skipped > 0) console.log(`# skip  ${this.skipped}`);
  }

  get exitCode() {
    return Math.min(1, this.failed);
  }
}
