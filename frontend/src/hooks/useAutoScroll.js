import { useEffect, useRef } from 'react';

/**
 * Auto-scroll to the bottom of a container when dependencies change
 * @param {Array} deps - Dependencies to watch for changes
 * @returns {React.RefObject} - Ref to attach to the scroll container's bottom element
 */
const useAutoScroll = (deps = []) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, deps);

  return bottomRef;
};

export default useAutoScroll;
