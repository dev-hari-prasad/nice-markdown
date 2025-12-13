import { useEffect, useRef, RefObject } from 'react';

export const useScrollSync = (
  sourceRef: RefObject<HTMLElement>,
  targetRef: RefObject<HTMLElement>,
  enabled: boolean,
  viewMode: string
) => {
  const isScrollingRef = useRef<boolean>(false);
  const activeSourceRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled || viewMode !== 'SPLIT') return;

    const source = sourceRef.current;
    const target = targetRef.current;

    if (!source || !target) return;

    const handleScroll = (e: Event) => {
      const el = e.target as HTMLElement;
      
      // If a scroll is in progress and this element didn't start it, ignore
      if (isScrollingRef.current && activeSourceRef.current !== el) {
        return;
      }

      // Lock scrolling
      isScrollingRef.current = true;
      activeSourceRef.current = el;

      const other = el === source ? target : source;
      
      // Calculate ratio
      const percentage = el.scrollTop / (el.scrollHeight - el.clientHeight);
      
      if (!isNaN(percentage)) {
         requestAnimationFrame(() => {
             other.scrollTop = percentage * (other.scrollHeight - other.clientHeight);
         });
      }

      // Debounce unlock
      clearTimeout((el as any)._scrollTimeout);
      (el as any)._scrollTimeout = setTimeout(() => {
        isScrollingRef.current = false;
        activeSourceRef.current = null;
      }, 100); // Slightly longer timeout for smoother end
    };

    source.addEventListener('scroll', handleScroll, { passive: true });
    target.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      source.removeEventListener('scroll', handleScroll);
      target.removeEventListener('scroll', handleScroll);
    };
  }, [sourceRef, targetRef, enabled, viewMode]);
};
