"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export default function RevealOnScroll({
  children,
  className,
  stagger = false,
}: {
  children: ReactNode;
  className?: string;
  stagger?: boolean;
}) {
  const elementRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [hasEntered, setHasEntered] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const show = () => {
      setVisible(true);
      setHasEntered(true);
    };

    if (
      !("IntersectionObserver" in window) ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      show();
      return;
    }

    // Wait until a section reaches the reading area before starting its entrance.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );

    if (element.getBoundingClientRect().top > window.innerHeight * 0.9) {
      setVisible(false);
      observer.observe(element);
    } else {
      show();
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !hasEntered) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    let revert: (() => void) | undefined;

    import("gsap")
      .then(({ gsap }) => {
        if (cancelled) return;

        const context = gsap.context(() => {
          const motionTargets = stagger
            ? Array.from(
                element.querySelectorAll<HTMLElement>("[data-motion-item]")
              )
            : [];
          const targets = motionTargets.length > 0 ? motionTargets : element;

          // Staggered hero items set the reading order; section reveals mark scroll progress.
          gsap.fromTo(
            targets,
            { autoAlpha: 0, y: stagger ? 58 : 48, scale: 0.985 },
            {
              autoAlpha: 1,
              y: 0,
              scale: 1,
              duration: stagger ? 0.9 : 0.82,
              stagger: stagger ? 0.14 : 0,
              ease: "power3.out",
              clearProps: "opacity,visibility,transform",
            }
          );
        }, element);
        revert = () => context.revert();
      })
      .catch(() => setVisible(true));

    return () => {
      cancelled = true;
      revert?.();
    };
  }, [hasEntered, stagger]);

  return (
    <div
      ref={elementRef}
      className={className}
      data-reveal={visible ? "visible" : "pending"}
    >
      {children}
    </div>
  );
}
