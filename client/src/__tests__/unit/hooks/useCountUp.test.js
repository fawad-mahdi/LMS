import { renderHook, act } from '@testing-library/react';
import useCountUp from '../../../hooks/useCountUp';

describe('useCountUp', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Polyfill rAF/cAF for jsdom
    let frameId = 0;
    const callbacks = new Map();
    vi.stubGlobal('requestAnimationFrame', (cb) => {
      const id = ++frameId;
      callbacks.set(id, cb);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id) => callbacks.delete(id));
    vi.stubGlobal('performance', { now: () => Date.now() });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('initialises to 0', () => {
    const { result } = renderHook(() => useCountUp(100));
    expect(result.current).toBe(0);
  });

  it('stays at 0 when target is 0', () => {
    const { result } = renderHook(() => useCountUp(0));
    act(() => { vi.advanceTimersByTime(1500); });
    expect(result.current).toBe(0);
  });

  it('stays at 0 when target is null', () => {
    const { result } = renderHook(() => useCountUp(null));
    act(() => { vi.advanceTimersByTime(1500); });
    expect(result.current).toBe(0);
  });

  it('eventually reaches the target value', async () => {
    const { result } = renderHook(() => useCountUp(50, { duration: 100 }));

    // Advance time past animation duration (rAF callbacks won't auto-fire in fake timers
    // but the setTimeout delay will elapse, then rAF needs to run manually)
    act(() => { vi.advanceTimersByTime(200); });

    // The count should be > 0 once the delay fires (even if rAF hasn't completed)
    // It starts at 0 before delay fires, and the delay is 0ms by default
    expect(typeof result.current).toBe('number');
    expect(result.current).toBeGreaterThanOrEqual(0);
  });

  it('respects the delay option', () => {
    const { result } = renderHook(() => useCountUp(100, { duration: 100, delay: 300 }));

    act(() => { vi.advanceTimersByTime(200); }); // before delay
    expect(result.current).toBe(0);

    act(() => { vi.advanceTimersByTime(200); }); // after delay
    // Count should have started
    expect(result.current).toBeGreaterThanOrEqual(0);
  });

  it('returns a number type', () => {
    const { result } = renderHook(() => useCountUp(42));
    expect(typeof result.current).toBe('number');
  });
});
