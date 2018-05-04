import test from 'tape';
import assert from '../src/assert.mjs';
import { ownProp } from '../src/utils.mjs';

const hasProps = (result, props) => props.every(prop => ownProp(result, prop));

class ExtendableError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

test('deepEqual', t => {
  const msg = 'should be equivalent';
  ['deepEqual', 'deepEquals', 'isEquivalent', 'same'].forEach(fn => {
    let result = assert[fn]({ one: 1 }, { one: 1 });
    t.ok(result.pass, `${fn} passes`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );

    result = assert[fn]({ one: 1 }, ['one', 2]);
    t.notOk(result.pass, `${fn} fails`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );
  });

  t.end();
});

test('notDeepEqual', t => {
  const msg = 'should not be equivalent';
  ['notDeepEqual', 'notDeepEquals', 'notEquivalent', 'notSame'].forEach(fn => {
    let result = assert[fn]({ one: 1 }, { one: 1 });
    t.notOk(result.pass, `${fn} fails`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );

    result = assert[fn]({ one: 1 }, ['one', 2]);
    t.ok(result.pass, `${fn} passes`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );
  });

  t.end();
});

test('equal', t => {
  const msg = 'should be equal';
  ['equal', 'equals', 'isEqual', 'is'].forEach(fn => {
    let result = assert[fn]('hooray', 'hooray');
    t.ok(result.pass, `${fn} passes`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );

    result = assert[fn]('1', 1);
    t.notOk(result.pass, `${fn} fails`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );

    // check the edge cases
    result = assert[fn](+0, +0);
    t.ok(result.pass, `${fn} passes`);

    result = assert[fn](-0, -0);
    t.ok(result.pass, `${fn} passes`);

    result = assert[fn](NaN, NaN);
    t.ok(result.pass, `${fn} passes`);
  });

  t.end();
});

test('notEqual', t => {
  const msg = 'should not be equal';
  ['notEqual', 'isNot', 'not'].forEach(fn => {
    let result = assert[fn]('hooray', 'hooray');
    t.notOk(result.pass, `${fn} fails`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );

    result = assert[fn]('1', 1);
    t.ok(result.pass, `${fn} passes`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );

    // check the edge cases
    result = assert[fn](+0, +0);
    t.notOk(result.pass, `${fn} passes`);

    result = assert[fn](-0, -0);
    t.notOk(result.pass, `${fn} passes`);

    result = assert[fn](NaN, NaN);
    t.notOk(result.pass, `${fn} passes`);
  });

  t.end();
});

test('eql', t => {
  const msg = 'should sort of equal';
  ['eql'].forEach(fn => {
    let result = assert[fn](1, '1');
    t.ok(result.pass, `${fn} passes`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );

    result = assert[fn](1, '2');
    t.notOk(result.pass, `${fn} fails`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );
  });

  t.end();
});

test('notEql', t => {
  const msg = 'should not sort of equal';
  ['notEql'].forEach(fn => {
    let result = assert[fn](1, '1');
    t.notOk(result.pass, `${fn} passes`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );

    result = assert[fn](1, '2');
    t.ok(result.pass, `${fn} fails`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );
  });

  t.end();
});

test('ok', t => {
  const msg = 'should be truthy';
  ['ok', 'true', 'truthy', 'assert'].forEach(fn => {
    let result = assert[fn](1);
    t.ok(result.pass, `${fn} passes`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );

    result = assert[fn](0);
    t.notOk(result.pass, `${fn} fails`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );
  });

  t.end();
});

test('notOk', t => {
  const msg = 'should be falsy';
  ['notOk', 'false'].forEach(fn => {
    let result = assert[fn](1);
    t.notOk(result.pass, `${fn} passes`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );

    result = assert[fn](0);
    t.ok(result.pass, `${fn} fails`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );
  });

  t.end();
});

test('match', t => {
  const msg = 'should match pattern';
  ['match', 'regex'].forEach(fn => {
    let result = assert[fn]('hello world', /^hello.world$/);
    t.ok(result.pass, `${fn} passes`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );

    result = assert[fn]('hello  world', /^hello.world$/);
    t.notOk(result.pass, `${fn} fails`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );
  });

  t.end();
});

test('notMatch', t => {
  const msg = 'should not match pattern';
  ['notMatch', 'notRegex'].forEach(fn => {
    let result = assert[fn]('hello world', /^hello.world$/);
    t.notOk(result.pass, `${fn} passes`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );

    result = assert[fn]('hello  world', /^hello.world$/);
    t.ok(result.pass, `${fn} fails`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );
  });

  t.end();
});

test('ifError', t => {
  ['ifError', 'ifErr', 'error'].forEach(fn => {
    let result = assert[fn](false);
    t.ok(result.pass, `${fn} passes`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected']),
      `${fn} has expected props`
    );

    const err = new Error('fail fail fail');
    result = assert[fn](err);
    t.notOk(result.pass, `${fn} fails`);
    t.equal(result.msg, String(err), `${fn} uses error as message`);

    result = assert[fn](err, 'custom msg');
    t.notOk(result.pass, `${fn} fails`);
    t.equal(result.msg, 'custom msg', `${fn} uses provided as message`);
  });

  t.end();
});

test('pass', t => {
  let result = assert.pass('i did good');
  t.ok(result.pass, 'passes');
  t.ok(hasProps(result, ['pass', 'operator', 'msg']), 'pass has expected props');

  t.end();
});

test('fail', t => {
  let result = assert.fail('i did bad');
  t.notOk(result.pass, 'fails');
  t.ok(hasProps(result, ['pass', 'operator', 'msg']), 'fail has expected props');

  t.end();
});

test('throws', t => {
  const msg = 'should throw';
  ['throws', 'throw', 'doesThrow'].forEach(fn => {
    const err = new Error('i throw fits');
    let result = assert[fn](() => {
      throw err;
    });
    t.ok(result.pass, `${fn} passes`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected', 'error']),
      `${fn} has expected props`
    );

    result = assert[fn](() => 'kewl');
    t.notOk(result.pass, `${fn} fails`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected', 'error']),
      `${fn} has expected props`
    );

    result = assert[fn](() => {
      throw err;
    });
    t.equal(result.actual, 'i throw fits', `${fn} actual value contains error message`);

    result = assert[fn](() => {
      throw err;
    }, /fits/);
    t.ok(result.pass, `${fn} passes with message check`);

    result = assert[fn](() => {
      throw err;
    }, /notintheerrormessage/);
    t.notOk(result.pass, `${fn} fails with message check`);

    class CustomErr extends ExtendableError {}

    result = assert[fn](() => {
      throw new CustomErr('so custom');
    }, CustomErr);
    t.ok(result.pass, `${fn} passes with instance check`);

    result = assert[fn](() => {
      throw new CustomErr('so custom');
    }, function notError() {});
    t.notOk(result.pass, `${fn} fails with instance check`);
  });

  t.end();
});


test('doesNotThrow', t => {
  const msg = 'should not throw';
  ['doesNotThrow', 'notThrow', 'notThrows'].forEach(fn => {
    const err = new Error('i throw fits');
    let result = assert[fn](() => {
      throw err;
    });
    t.notOk(result.pass, `${fn} passes`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected', 'error']),
      `${fn} has expected props`
    );

    result = assert[fn](() => 'kewl');
    t.ok(result.pass, `${fn} fails`);
    t.equal(result.msg, msg, `${fn} has expected message`);
    t.ok(
      hasProps(result, ['pass', 'operator', 'msg', 'actual', 'expected', 'error']),
      `${fn} has expected props`
    );

    result = assert[fn](() => {
      throw err;
    });
    t.equal(result.actual, 'i throw fits', `${fn} actual value contains error message`);

    result = assert[fn](() => {
      throw err;
    }, /fits/);
    t.notOk(result.pass, `${fn} fails with message check`);

    result = assert[fn](() => {
      throw err;
    }, /notintheerrormessage/);
    t.ok(result.pass, `${fn} passes with message check`);

    class CustomErr extends ExtendableError {}

    result = assert[fn](() => {
      throw new CustomErr('so custom');
    }, CustomErr);
    t.notOk(result.pass, `${fn} fails with instance check`);

    result = assert[fn](() => {
      throw new CustomErr('so custom');
    }, function notError() {});
    t.ok(result.pass, `${fn} passes with instance check`);
  });

  t.end();
});
