'use client';

import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  formatFn?: (value: number) => string;
}

export default function AnimatedCounter({ 
  value, 
  duration = 2, 
  className = "",
  formatFn
}: AnimatedCounterProps) {
  const count = useMotionValue(0);
  
  const displayValue = useTransform(count, (latest) => {
    const rounded = Math.round(latest);
    if (formatFn) {
      return formatFn(rounded);
    }
    return new Intl.NumberFormat('vi-VN').format(rounded) + '₫';
  });

  useEffect(() => {
    const controls = animate(count, value, { 
      duration: duration,
      ease: "easeOut"
    });
    
    return () => controls.stop();
  }, [value, duration, count]);

  return (
    <motion.span className={className}>
      {displayValue}
    </motion.span>
  );
}
