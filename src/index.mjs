import Tapped from './tapped.mjs';

function createInstance() {
  const tests = new Set();

  return (...args) => {
    const test = new Tapped(...args);
    tests.add(test);
  };
}

const mainInstance = createInstance();

export default mainInstance;
