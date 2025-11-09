import { useEffect, useState } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

/**
 * Hook para animar números crescentes (count-up)
 */
export function useCountUp(target: number, duration: number = 1500) {
  const [displayValue, setDisplayValue] = useState(0);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    stiffness: 50,
    damping: 30,
  });

  useEffect(() => {
    motionValue.set(target);
    
    const unsubscribe = springValue.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });

    return () => unsubscribe();
  }, [target, motionValue, springValue]);

  return displayValue;
}
