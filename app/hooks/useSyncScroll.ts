import { useCallback, useRef, useEffect } from 'react';

export const useSyncScroll = () => {
  const tableRefs = useRef<Map<string, HTMLElement>>(new Map());
  const isScrolling = useRef(false);

  const registerTable = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      tableRefs.current.set(id, element);
    } else {
      tableRefs.current.delete(id);
    }
  }, []);

  const unregisterTable = useCallback((id: string) => {
    tableRefs.current.delete(id);
  }, []);

  const handleScroll = useCallback((sourceId: string, scrollLeft: number) => {
    if (isScrolling.current) return;

    isScrolling.current = true;

    tableRefs.current.forEach((element, id) => {
      if (id !== sourceId && element) {
        element.scrollLeft = scrollLeft;
      }
    });

    // Reset the flag after a short delay to prevent recursion
    setTimeout(() => {
      isScrolling.current = false;
    }, 10);
  }, []);

  return {
    registerTable,
    unregisterTable,
    handleScroll
  };
};