export function ownProp(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

export function isEnum(obj, prop) {
  return Object.prototype.propertyIsEnumerable.call(obj, prop);
}

export function getRunTimer() {
  const now = new Date();
  return function stop() {
    return new Date().getTime() - now;
  };
}

export function getClearTimer(timeout, onTimeout) {
  if (timeout <= 0) return () => {};

  const t = setTimeout(onTimeout, timeout);

  return function clearTimer() {
    clearTimeout(t);
  };
}

export function TappedState() {
  this.resolved = false;
  this.completed = null;

  this.onComplete = fn => {
    if (this.resolved && this.completed) fn(...this.completed);
    else this.completed = fn;
  };

  this.complete = (...args) => {
    // subsequent calls are a noop
    if (this.resolved) return;
    this.resolved = true;

    // handle resolution before listener attached
    if (!this.completed) {
      this.completed = args;
    } else {
      this.completed(...args);
    }
  };
}

export function getDeferred() {
  let defer;

  const promise = new Promise((resolve, reject) => {
    defer = res => {
      if (res instanceof Error) reject(res);
      else resolve(res);
    };
  });

  return { promise, defer };
}

export function normalizeOptions(title, opts, fn) {
  const options = { title };

  if (typeof opts === 'function') {
    options.fn = opts;
    options.opts = {};
  } else {
    options.opts = opts;
    options.fn = fn;
  }

  return options;
}

export function flattenResults(results) {
  return results.reduce((acc, result) => {
    // preserve existing inner test results
    if (result.results) return acc.concat(result);
    return acc.concat(flattenResults(result.values));
  }, []);
}
