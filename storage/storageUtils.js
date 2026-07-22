export function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function logStorageError(scope, error) {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.warn(`[Momentum storage] ${scope}`, error);
  }
}
