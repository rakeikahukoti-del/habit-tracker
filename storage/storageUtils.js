export function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function logStorageError(scope, error) {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.warn(`[Momentum storage] ${scope}`, error);
  }
}

/**
 * Creates a per-key serialization queue for async read-modify-write cycles.
 * Tasks passed to the returned function run one at a time, in call order, so
 * concurrent callers can't interleave a read from one with a write from
 * another and silently drop an update.
 */
export function createExclusiveQueue() {
  let queueTail = Promise.resolve();

  return function runExclusive(task) {
    const result = queueTail.catch(() => {}).then(task);

    queueTail = result.catch(() => {});

    return result;
  };
}
