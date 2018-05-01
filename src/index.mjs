import Tapped from './tapped.mjs';

function createInstance() {
  const tests = new Set();

  return (title, opts, fn) => {
    const test = new Tapped(title, opts, fn);
    tests.add(test);
  };
}

const mainInstance = createInstance();

export default mainInstance;
