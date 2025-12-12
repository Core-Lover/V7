import React, { useState, useEffect, useRef } from 'react';

interface AnimatedNumberDisplayProps {
  value: number;
  decimals?: number;
  color?: string;
}

const AnimatedNumberDisplay: React.FC<AnimatedNumberDisplayProps> = ({ 
  value, 
  decimals = 6,
  color = '#E5E7EB'
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const startTimeRef = useRef(Date.now());
  const rafRef = useRef<number>();

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    const difference = endValue - startValue;

    // If no significant change, just update
    if (Math.abs(difference) < 0.0001) {
      setDisplayValue(endValue);
      prevValueRef.current = endValue;
      return;
    }

    prevValueRef.current = endValue;
    startTimeRef.current = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const duration = 300; // 300ms smooth transition
      const progress = Math.min(elapsed / duration, 1);

      const current = startValue + (difference * progress);
      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value]);

  const formattedValue = displayValue.toFixed(decimals);
  const parts = formattedValue.split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] || '0'.repeat(decimals);

  return (
    <span style={{ color, fontWeight: '700', fontFamily: 'Monaco, Courier New, monospace', display: 'inline-block' }}>
      {integerPart}.{decimalPart}
    </span>
  );
};

export default AnimatedNumberDisplay;
