import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * LazyViewport — defers rendering of `children` (e.g. below-the-fold dashboard
 * charts, non-active scanner views) until the container enters the viewport AND
 * the browser hits an idle frame (or 120ms fallback), keeping frame-1 header
 * hydration and mobile touch taps instantaneous.
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

    let idleId = null;
    let timerId = null;

    const scheduleReveal = () => {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        idleId = window.requestIdleCallback(() => setInView(true), { timeout: 150 });
      } else {
        timerId = setTimeout(() => setInView(true), 100);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          scheduleReveal();
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (idleId !== null && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timerId !== null) clearTimeout(timerId);
    };
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
