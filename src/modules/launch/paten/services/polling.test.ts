import { afterEach, describe, expect, it, vi } from 'vitest';
import { createPollGate } from './polling';

afterEach(() => vi.useRealTimers());

describe('poll bandwidth gate', () => {
  it('coalesces focus and visibility events until the refresh interval passes', async () => {
    vi.useFakeTimers();
    const poll = createPollGate(300_000, true);
    const fetch = vi.fn();
    await poll(fetch);
    vi.advanceTimersByTime(299_999);
    await poll(fetch);
    expect(fetch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    await Promise.all([poll(fetch), poll(fetch), poll(fetch)]);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('prevents concurrent requests even when a slow request exceeds the interval', async () => {
    vi.useFakeTimers();
    const poll = createPollGate(30_000);
    let finish!: () => void;
    const fetch = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const pending = poll(fetch);
    vi.advanceTimersByTime(60_000);
    await poll(fetch);
    expect(fetch).toHaveBeenCalledTimes(1);
    finish();
    await pending;
    const nextFetch = vi.fn();
    await poll(nextFetch);
    expect(nextFetch).toHaveBeenCalledTimes(1);
  });

  it('releases the gate after a failed request, retaining the retry interval', async () => {
    vi.useFakeTimers();
    const poll = createPollGate(30_000);
    await expect(poll(async () => { throw new Error('offline'); })).rejects.toThrow('offline');
    const fetch = vi.fn();
    await poll(fetch);
    expect(fetch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(30_000);
    await poll(fetch);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
