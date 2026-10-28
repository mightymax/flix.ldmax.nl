/** Share in-flight initialization, and allow a fresh attempt after a failure.
 * @template T
 * @param {() => Promise<T>} initialize
 * @returns {() => Promise<T>}
 */
export function sharedInitialization(initialize) {
  let pending;
  return () => {
    pending ??= Promise.resolve().then(initialize).catch((error) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };
}
