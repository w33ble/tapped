import tape from 'tape';
import execa from 'execa';
import tap from 'simple-tap-parser';

const Parser = tap.Parser;

tape('matches tape output', t => {
  const tapeCmd = execa('node', ['-r', 'esm', 'tests/lib/tape_runner.mjs'])
    .catch(err => err.stdout);
  const tappedCmd = execa('node', ['-r', 'esm', 'tests/lib/tapped_runner.mjs'])
    .catch(err => err.stdout);

  Promise.all([tapeCmd, tappedCmd])
    .then(output => {
      const tapeParser = new Parser(output[0]);
      const tappedParser = new Parser(output[1]);
      const totalCount = tappedParser.getTestCount();

      t.equal(tapeParser.getValidCount(), tappedParser.getValidCount(), 'passed test counts match');
      t.equal(
        tapeParser.getFailedCount(),
        tappedParser.getFailedCount(),
        'failed test counts match'
      );
      t.equal(tapeParser.getTestCount(), tappedParser.getTestCount(), 'total test counts match');

      for (let i = 1; i <= totalCount; i += 1) {
        const tapeOutput = tapeParser.getTest(i);
        if (/plan != count/.test(tapeOutput.line.string)) {
          const tappedDetails = tappedParser.getTest(i).details.split('\n');
          const tapeDetails = tapeOutput.details.split('\n');

          const tapePlan = `${tapeDetails[2].replace(/[^0-9]/g, '')} not ${tapeDetails[3].replace(
            /[^0-9]/g,
            ''
          )}`;
          const tappedPlan = `${tappedDetails[2].replace(
            /[^0-9]/g,
            ''
          )} not ${tappedDetails[3].replace(/[^0-9]/g, '')}`;

          t.equal(tapePlan, tappedPlan, `test plan mismatch ${i} should match`);
          continue;
        }

        t.deepEqual(
          tapeOutput.line.string,
          tappedParser.getTest(i).line.string,
          `test output ${i} should match`
        );
      }
    })
    .catch(err => {
      t.error(err);
    });

  t.end();
});
