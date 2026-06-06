import { useEffect, useRef } from 'react';

/**
 * Custom hook to encapsulate polling logic
 * @param {Function} fetcher - Async function to call periodically
 * @param {Array<string>} eventsToListen - Window events to listen to for immediate refetch
 * @param {number} intervalMs - Interval in milliseconds (default 30000)
 */
export const usePolling = (fetcher, eventsToListen = [], intervalMs = 30000) => {
  const fetcherRef = useRef(fetcher);

  // Keep the latest fetcher without re-triggering the effect
  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    let isMounted = true;

    const executeFetch = async () => {
      try {
        if (isMounted && fetcherRef.current) {
          await fetcherRef.current();
        }
      } catch (err) {
        // ignore error
      }
    };

    // Initial fetch
    executeFetch();

    // Listen to events for immediate update
    eventsToListen.forEach((event) => {
      window.addEventListener(event, executeFetch);
    });

    // Start polling interval
    const interval = setInterval(executeFetch, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(interval);
      eventsToListen.forEach((event) => {
        window.removeEventListener(event, executeFetch);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(eventsToListen), intervalMs]);
};
