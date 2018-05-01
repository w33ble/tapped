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

export function Tracker(name) {
  this.resolved = false;
  this.completed = null;

  this.onComplete = fn => {
    if (this.resolved && this.completed) fn(...this.completed);
    else this.completed = fn;
  };

  this.complete = (...args) => {
    // subsequent calls are a noop
    if (this.resolved) {
      // console.warn('Test completed multiple times! (%s)', name);
      return;
    }
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
