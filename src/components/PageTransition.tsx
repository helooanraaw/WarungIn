"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const page = pageRef.current;
    if (
      !page ||
      pathname.startsWith("/dashboard") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let cancelled = false;
    let revert: (() => void) | undefined;

    import("gsap")
      .then(({ gsap }) => {
        if (cancelled) return;

        const context = gsap.context(() => {
          // Public pages get a short entrance; dashboard routes skip this effect.
          gsap.fromTo(
            page,
            { autoAlpha: 0, y: 20 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.42,
              ease: "power3.out",
              clearProps: "opacity,visibility,transform",
            }
          );
        }, page);
        revert = () => context.revert();
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      revert?.();
    };
  }, [pathname]);

  return (
    <div ref={pageRef} key={pathname} className="route-enter">
      {children}
    </div>
  );
}
