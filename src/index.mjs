import Tapped from './tapped.mjs';

function createInstance() {
  const tests = new Set();

  function createTest(...args) {
    const test = new Tapped(...args);
    tests.add(test);
    return test;
  }

  createTest.skip = (title, opts, fn) => {
    const test = new Tapped(title, { ...opts, skip: true }, fn);
    tests.add(test);
    return test;
  }

  return createTest;
}

const mainInstance = createInstance();

export default mainInstance;
