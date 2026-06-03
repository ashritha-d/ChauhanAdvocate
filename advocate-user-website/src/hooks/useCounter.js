import { useState, useEffect, useRef } from 'react';

export default function useCounter(target, duration = 2000, startOnMount = false) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(startOnMount);
  const ref = useRef(null);

  useEffect(() => {
    if (startOnMount) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnMount]);

  useEffect(() => {
    if (!started) return;
    const numericTarget = parseInt(String(target).replace(/\D/g, ''), 10);
    if (!numericTarget) return;
    const step = Math.ceil(numericTarget / (duration / 16));
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, numericTarget);
      setCount(current);
      if (current >= numericTarget) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  const suffix = String(target).replace(/[0-9]/g, '').trim();
  return { count, suffix, ref };
}
