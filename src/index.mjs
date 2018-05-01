import assert from './assert.mjs';

class Tapped {
  static skip = (title, opts, fn) => {
    return new Tapped(title, Object.assign({}, opts, { skip: true }), fn);
  };

  constructor(title, opts, fn) {
    if (typeof opts === 'function') {
      fn = opts;
      opts = {};
    }

    this.title = title;
    this.fn = fn;
    this.tests = new Set();
    this.plan = null;
    this.testCount = 0;
    this.timeout = opts.timeout || 3000;
    this.skip = opts.skip || false;
    this.ok = true;

    // start the runner, and also hide internal object properties
    return this.run();
  }

  run() {
    // skip test
    if (this.skip) return Promise.resolve();

    // create spec function argument
    const proxy = new Proxy({
      plan: num => { this.plan = num },
      timeout: val => { this.timeout = val },
    }, {
      get: (obj, prop) => {
        // return base object properties
        if (prop in obj) return obj[prop];

        // pass through assertions, but keep track of use
        if (prop in assert) {
          this.testCount = this.testCount + 1;
          return assert[prop];
        }

        return (...args) => {
          console.log('unknown proxy prop', prop)
          console.log('proxy args', args)
        };
      }
    });

    console.log('timeout', this.timeout);

    return Promise.resolve(this.fn(proxy))
      .then(() => {
        console.log('planned', this.plan);
        console.log('found', this.testCount);
      });
  }
}

export default function (title, opts, fn) {
  return new Tapped(title, opts, fn);
}
