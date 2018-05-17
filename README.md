# tapped

Async ready, concurrent, tap producing test runner.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/w33ble/tapped/master/LICENSE)
[![npm](https://img.shields.io/npm/v/tapped.svg)](https://www.npmjs.com/package/tapped)
[![Project Status](https://img.shields.io/badge/status-experimental-orange.svg)](https://nodejs.org/api/documentation.html#documentation_stability_index)

## Usage

```js
yarn add -D tapped
# or npm install --dev tapped
```

Then write your tests much like you would with [tape](https://github.com/substack/tape).

```js
// test.js
import test from 'tapped';

test('one is one, and truthy', t => {
  t.plan(2);
  t.equal(1, 1);
  t.ok(1);
});
```

Then simply run the file with node: `node test.js`.

## Features

### Native promise support

Test returning promises will not resolve until the Promise resolves. `t.end()` is still observed if you wish to exit early. `t.plan()` is observed as well.

### Nested tests

Tests can be nested inside of other tests. Internally, tests will run in order, with a concurrency of 1, and promise resolution is observed. This is also a handy way to allow global concurrency but also preserve tests order when needed.

```js
import test from 'tapped';

test('one', t => t.equal(1, 1));

test('two', t => t.ok(true));

test('nested', innerTest => {
  let count = 0;
  
  innerTest('inner one', async t => {
    t.equal(count, 0);
    count += 1;
  })

  innerTest('inner two', t => {
    t.equal(count, 1);
  });
});
```

In the above example, `one`, `two`, and the `nested` suite all run at the same time. Tests inside of `nested` run in order, one at a time, so `inner two` does not run until `inner one` is finished.

### Concurrent test running

Top-level tests run concurrently by default. Out of the box, a concurrency of 4 is used, but it can be configured by using `setConcurrency`. This should be done before any of your tests are defined.

```js
import test from 'tapped';

test.setConcurrency(Infinity);
```

If you don't want to use concurrency, set the value to 1. Any number 1 or higher is allowed. 

### Implied end

Unlike [tape](https://github.com/substack/tape), and similar to [ava](https://github.com/avajs/ava) and [zora](https://github.com/lorenzofox3/zora), tests don't need to use `t.plan()` or `t.end()` to be valid. However, both are available, and `t.plan()` is observed any time it is used, so a mismatched test count will cause a failure.

If you would like to enforce the use, and mimic `tape`'s functionality, you can use `setImplicitEnd` to set the value to false. This should be done before any tests are defined.

```js
import test from 'tapped';

test.setImplicitEnd(false);
```

## API

### `test(title, [options], fn)`

Creates a test, passing a utility `t` into the function `fn`. `t` contains all assertion methods (see below) as well as `plan`, `timeout`, and `end` (see below). You can also call `t` as a function to create a new "suite", or collection of tests. All tests in the suite will run in order, without concurrency.

### `test.skip(...)`

Skips this test, or suite.

### `t.timeout(time)`

Sets a custom timeout for the test, in milliseconds. Default timeout is 3000, or 3 seconds. 

Using a value of `0` will disable the timeout. Be careful using 0, as the test will wait indefinitely, and the runner may never stop.

### `t.plan(num)`

Informs the test how many assertions will be made. Optional unless `setImplicitEnd` is set to `false`.

### `t.end(err)`

Explicitly declare the end of a test. If `err` is provided, it will assert that the value is falsy. Optional unless `setImplicitEnd` is set to `false`.

## Assertions

### `deepEqual(value, expected, [message])`

> aliases: deepEquals, isEquivalent, same

Assert that `actual` and `expected` have the same structure and nested values. Useful for comparing objects and arrays.

### `notDeepEqual(value, expected, [message])`

> aliases: notDeepEquals, notEquivalent, notSame

Assert that `actual` and `expected` do not have the same structure and nested values. Useful for comparing objects and arrays.

### `equal(value, expected, [message])`

> aliases: equals, isEqual, is

Assert that `value` is the same as `expected`. This is based on Object.is().

### `notEqual(value, expected, [message])`

> aliases: isNot, not

Assert that `value` is not the same as `expected`. This is based on Object.is().

### `eql(value, expected, [message])`

Assert that `value` is equivalent to `expected` using type coercion. This is based on `==`.

### `notEql(value, expected, [message])`

Assert that `value` is not equivalent to `expected` using type coercion. This is based on `==`.

### `ok(value, [message])`

> aliases: true, truthy, assert

Assert that `value` is truthy.

### `notOk(value, [message])`

> aliases: false

Assert that `value` is falsy.

### `throws(thrower, [expected, [message]])`

> aliases: throw, doesThrow

Assert that the function `thrower` throws an exception. Expected value can be a regex or an error type to match.

### `doesNotThrow(thrower, [expected, [message]])`

> aliases: notThrow, notThrows

Assert that the function `thrower` does not throw an exception. Expected value can be a regex or an error type to match.

### `match(value, regex, [message])`

> aliases: regex

Assert that contents matches `regex`.

### `notMatch(value, regex, [message])`

> aliases: notRegex

Assert that contents do not matche `regex`.

### `ifError(error, [message])`

> aliases: ifErr, error

Assert that `error` is falsy. If `error` is not falsy and no message is provided, use its string value as the message.

### `fail([message])`

Generate a failing assertion with a message.

### `pass([message])`

Generate a passing assertion with a message.


#### License

MIT © [w33ble](https://github.com/w33ble)