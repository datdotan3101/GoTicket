import { useState, useEffect } from 'react';

/**
 * Custom hook for simple countdown timers
 * @param {number} initialSeconds 
 * @returns {Array} [timeLeft, setTimeLeft]
 */
export const useTimer = (initialSeconds = 0) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  return [timeLeft, setTimeLeft];
};
