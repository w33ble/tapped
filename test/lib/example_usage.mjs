import test from '../..';

function add(a, b) {
  return a + b;
}

function sub(a, b) {
  const val = a - b;
  if (val < 0) throw new Error('negatives are not allowed');
  return val;
}

test('testing with plan', t => {
  t.plan(3);
  t.ok(1, '1 is truthy');
  t.ok(2, '2 is truthy');
  t.notOk(0, '0 is falsy');
});

test('testing with end', t => {
  // this will observe some kind of timeout
  t.end();
});

test('test failures with plan', t => {
  t.plan(2);
  t.ok(1);
  t.ok(0);
});

test('testing async with plan', async t => {
  t.plan(1); // still supports planning
  const val = await Promise.resolve(42);
  t.equal(val, 42);
});

test('testing async with end', async t => {
  t.ok(1);
  // just like sync, observe timeout
  t.end();
});

test('testing async with end and failures', async t => {
  t.ok(1);
  t.ok(0);
  t.end();
});

test('observes custom timeout', t => {
  t.plan(1);
  t.timeout(100);

  return new Promise(r => {
    setTimeout(() => {
      t.ok(1);
      r();
    }, 300);
  });
});

test('handles throwing in tests', t => {
  t.ok(1);
  throw new Error('i haz a bad');
});

test.skip('skipped tests are skipped', t => {
  t.end();
});

test('fails with wrong plan count', t => {
  t('too high', a => {
    a.plan(2);
    a.ok(1);
  });

  t('too low', a => {
    a.plan(1);
    a.ok(1);
    a.ok(1);
  });
});

test('external lib with failure', t => {
  t.equals(add(1, 2), 2);
});

test('external lib throws', t => {
  t.notThrows(() => sub(2, 2));
  t.throws(() => sub(1, 2));
});

const suite = test;

// nesting tests
suite('some suite', suiteTest => {
  let count = 0;

  suiteTest('a test', t => {
    t.plan(3);
    t.ok(1);
    t.ok(2);
    count += 1;
    t.equal(count, 1);
  });
});

// deep nesting tests
suite('suite1', innerSuite => {
  innerSuite('suite2', test1 => {
    test1('|A suite2 test', t => {
      t.ok(1);
    });

    test1('suite3', test2 => {
      test2('|B suite3 test', t => {
        t.plan(2);
        t.ok(1);
        t.ok(2);
      });

      test2('|C suite3 test', t => {
        t.plan(1);
        t.ok(1);
      });
    });
  });
});

suite('async suite', suiteTest => {
  suiteTest('first', async t => {
    const val = await Promise.resolve(1);
    t.equal(val, 1);
  });

  suiteTest('second', async t => {
    const val = await Promise.resolve(2);
    t.equal(val, 2);
  });
});

suite('runs suite tests in order, with async', suiteTest => {
  let count = 0;

  suiteTest('first', async t => {
    count += 1;
    const num = await Promise.resolve(count);
    t.equal(num, 1);
  });

  suiteTest('second', t => {
    count += 1;
    t.equal(count, 2);
  });

  suiteTest('last', t => {
    count += 1;
    t.ok(1, 'number 1 is truthy');
    t.equal(count, 3, 'count is three');
  });
});

test.setConcurrency(3);

test('simple', t => t.ok(1));
