import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * LazyViewport — defers rendering of `children` (e.g. below-the-fold dashboard
 * charts, non-active scanner views) until the container enters the viewport.
 *
 * Renders `placeholder` (default: an empty size-reserved box) until the element
 * is within `rootMargin` of the viewport, keeping the initial paint and route
 * switches instant on mobile. Once revealed, children are mounted permanently.
 */
export function LazyViewport({
  children,
  className,
  placeholder,
  threshold = 0.05,
  rootMargin = "300px",
}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, threshold, rootMargin]);

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{ minHeight: inView ? undefined : 180 }}
    >
      {inView ? children : placeholder ?? <div role="status" aria-label="Loading chart" />}
    </div>
  );
}
