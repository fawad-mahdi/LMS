import { useState, useEffect } from 'react';

export default function useCountUp(target, { duration = 1100, delay = 0 } = {}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target == null || target === 0) return;

    const num = typeof target === 'string' ? parseFloat(target) : target;
    if (isNaN(num)) return;

    const timer = setTimeout(() => {
      const start = performance.now();
      const step = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease out quart
        const eased = 1 - Math.pow(1 - progress, 4);
        setCount(Math.round(eased * num));
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, delay);

    return () => clearTimeout(timer);
  }, [target, duration, delay]);

  return count;
}
