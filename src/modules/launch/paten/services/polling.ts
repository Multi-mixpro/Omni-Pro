/** Coalesce timer/focus events and never overlap network requests. */
export function createPollGate(interval: number, deferFirst = false) {
  let lastStarted = deferFirst ? Date.now() : -Infinity;
  let inFlight = false;
  return async (operation: () => void | Promise<void>) => {
    if (inFlight || Date.now() - lastStarted < interval) return;
    lastStarted = Date.now();
    inFlight = true;
    try {
      await operation();
    } finally {
      inFlight = false;
    }
  };
}
