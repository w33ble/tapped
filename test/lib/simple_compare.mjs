export default function simpleCompare(test) {
  test('passes', t => {
    t.plan(2);
    t.ok(1, '1 os ok');
    t.notOk(0, '0 is not ok');
  });

  test('fails', t => {
    t.ok(0, '0 is ok');
    t.end();
  });

  test('plan mismatch', t => {
    t.plan(2);
    t.ok(1, '1 is ok, but plan (2) fails');
    t.end();
  });

  test('plan mismatch 2', t => {
    t.plan(1);
    t.ok(1, '1 is ok, but plan (1) fails');
    t.notOk(0, '0 is not ok, but plan (1) fails');
  });
}
