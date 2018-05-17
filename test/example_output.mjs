import fs from 'fs';
import path from 'path';
import tape from 'tape';
import execa from 'execa';
// import tap from 'simple-tap-parser';

// TODO: make snapshots work
const snapshot = fs.readFileSync(path.resolve('tests/snapshots/example_usage_output.txt'), 'utf8');

tape('example output matches snapshot', t => {
  t.plan(128);

  execa('node', ['-r', 'esm', 'tests/lib/example_usage.mjs'])
    .catch(err => err.stdout)
    .then(output => {
      const snapshotLines = snapshot.split('\n');
      const outputLines = output.split('\n');

      outputLines.forEach((line, i) => {
        if (/^#/.test(line)) {
          t.equal(
            line.replace(/\([0-9]+ms\)/, ''),
            snapshotLines[i].replace(/\([0-9]+ms\)/, ''),
            `should match snapshot line ${i}`
          );
          return;
        }
        t.equal(line, snapshotLines[i], `should match snapshot line ${i}`);
      });
    });
});
