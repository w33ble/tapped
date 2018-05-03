import deepEqual from 'fast-deep-equal';

const isEnum = (obj, prop) => Object.prototype.propertyIsEnumerable.call(obj, prop);
const ownProp = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

// mimic Object.is, see https://i.stack.imgur.com/zETNR.png
const isEqual = (actual, expected) => Object.is(actual, expected);

const checkThrows = fn => {
  const result = {};

  try {
    fn();
  } catch (err) {
    result.error = err;
    result.message =
      err != null && (isEnum(err, 'message') || ownProp(err, 'message')) && err.message;
  }

  return result;
};

// expected check helper
const checkThrownOutput = ({ error, message }, expected, shouldThrow = true) => {
  const output = {
    result: { error, message },
  };

  output.passed = error != null;

  // no expected value, nothing to compare, nothing left to do
  if (!expected) {
    // if shold throw is false, invert the passed value
    if (!shouldThrow) output.passed = !output.passed;
    return output;
  }

  // compare regexp value
  if (expected instanceof RegExp) {
    output.passed = expected.test(message || error);
    output.expected = String(expected);
  }

  // compare error instance against a provided function
  if (typeof expected === 'function' && error) {
    output.passed = error instanceof expected;
    output.result.error = error.constructor;
  }

  // if shold throw is false, invert the passed value
  if (!shouldThrow) output.passed = !output.passed;

  return output;
};

const assert = (pass, opts) => {
  if (!pass) {
    if (opts.error) {
      const originalStack = (opts.error.stack || '').split('\n').map(s => s.trim());
      const localLineIndex = originalStack.findIndex(l => /^at checkThrows/.test(l));
      const stack = originalStack.slice(1, localLineIndex);
      const location = (stack[stack.length - 1] || '').replace(/^at/i, '').trim();
      return { pass, stack, location, ...opts };
    }
    const err = new Error('tapped exception');
    const stack = (err.stack || '')
      .split('\n')
      .slice(4, 5)
      .map(s => s.trim());
    const location = (stack[0] || '').replace(/^at/i, '');
    return { pass, stack, location, ...opts };
  }

  return { pass, ...opts };
};

const methods = {
  deepEqual(actual, expected, msg = 'should be equivalent') {
    return assert(deepEqual(actual, expected), {
      operator: 'deepEqual',
      msg,
      actual,
      expected,
    });
  },

  notDeepEqual(actual, expected, msg = 'should not be equivalent') {
    return assert(!deepEqual(actual, expected), {
      operator: 'notDeepEqual',
      msg,
      actual,
      expected,
    });
  },

  equal(actual, expected, msg = 'should be equal') {
    return assert(isEqual(actual, expected), {
      operator: 'equal',
      msg,
      actual,
      expected,
    });
  },

  notEqual(actual, expected, msg = 'should not be equal') {
    return assert(!isEqual(actual, expected), {
      operator: 'notEqual',
      msg,
      actual,
      expected,
    });
  },

  eql(actual, expected, msg = 'should sort of equal') {
    // eslint-disable-next-line eqeqeq
    return assert(actual == expected, {
      operator: 'eql',
      msg,
      actual,
      expected,
    });
  },

  notEql(actual, expected, msg = 'should not sort of equal') {
    // eslint-disable-next-line eqeqeq
    return assert(actual != expected, {
      operator: 'notEql',
      msg,
      actual,
      expected,
    });
  },

  ok(actual, msg = 'should be truthy') {
    return assert(!!actual, {
      operator: 'ok',
      msg,
      actual,
      expected: true,
    });
  },

  notOk(actual, msg = 'should be falsy') {
    return assert(!actual, {
      operator: 'notOk',
      msg,
      actual,
      expected: true,
    });
  },

  throws(fn, expected, msg = 'should throw') {
    const state = {
      result: null,
      passed: false,
      expected: typeof expected === 'string' ? null : expected,
      msg: typeof expected === 'string' ? expected : msg,
    };

    state.result = checkThrows(fn);
    Object.assign(state, checkThrownOutput(state.result, state.expected));

    return assert(typeof fn === 'function' && state.passed, {
      error: state.result.error,
      operator: 'throws',
      msg: state.msg,
      actual: state.result.message || (state.result && state.result.error),
      expected: state.expected,
    });
  },

  doesNotThrow(fn, expected, msg = 'should not throw') {
    const state = {
      result: null,
      passed: true,
      message: null,
      expected: typeof expected === 'string' ? null : expected,
      msg: typeof expected === 'string' ? expected : msg,
    };

    state.result = checkThrows(fn);
    Object.assign(state, checkThrownOutput(state.result, state.expected, false));

    return assert(typeof fn === 'function' && state.passed, {
      error: state.result.error,
      operator: 'doesNotThrow',
      msg: state.msg,
      actual: state.result.message || (state.result && state.result.error),
      expected: state.expected,
    });
  },

  match(content, regex, msg = 'should match pattern') {
    return assert(regex.test(content), {
      operator: 'match',
      msg,
      actual: content,
      expected: regex,
    });
  },

  notMatch(content, regex, msg = 'should not match pattern') {
    return assert(!regex.test(content), {
      operator: 'notMatch',
      msg,
      actual: content,
      expected: regex,
    });
  },

  ifError(err, msg) {
    return assert(!err, {
      operator: 'ifError',
      msg: msg || String(err),
      actual: err,
      expected: null,
    });
  },

  fail(msg) {
    return assert(false, {
      operator: 'fail',
      msg,
    });
  },

  pass(msg) {
    return assert(true, {
      operator: 'pass',
      msg,
    });
  },
};

const alias = (fn, names) =>
  Object.assign(
    methods,
    names.reduce((acc, name) => {
      acc[name] = methods[fn];
      return acc;
    }, {})
  );

// set up alias methods
alias('throws', ['throw', 'doesThrow']);
alias('doesNotThrow', ['notThrow', 'notThrows']);
alias('deepEqual', ['deepEquals', 'isEquivalent', 'same']);
alias('notDeepEqual', ['notDeepEquals', 'notEquivalent', 'notSame']);
alias('equal', ['equals', 'isEqual', 'is']);
alias('notEqual', ['isNot', 'not']);
alias('ok', ['true', 'truthy', 'assert']);
alias('notOk', ['false']);
alias('match', ['regex']);
alias('notMatch', ['notRegex']);
alias('ifError', ['ifErr', 'error']);

export default methods;
