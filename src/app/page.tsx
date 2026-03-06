"use client";

import IDCardWeb from "@/components/id-card-web";
import IDCardMobile from "@/components/id-card-mobile";
import BreathingDots from "@/components/breathing-dots";
import SpriteWithTrail, { SPRITE_H } from "@/components/sprite-with-trail";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [spriteRowWidth, setSpriteRowWidth] = useState(310);
  const spriteRowRef = useRef<HTMLElement>(null);
  const spriteRoRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const spriteRowCallbackRef = useCallback((el: HTMLElement | null) => {
    (spriteRowRef as React.MutableRefObject<HTMLElement | null>).current = el;
    if (spriteRoRef.current) { spriteRoRef.current.disconnect(); spriteRoRef.current = null; }
    if (el) {
      setSpriteRowWidth(el.clientWidth);
      const ro = new ResizeObserver(([entry]) => setSpriteRowWidth(entry.contentRect.width));
      ro.observe(el);
      spriteRoRef.current = ro;
    }
  }, []);

  return (
    <>
    <BreathingDots />
    <div className="flex min-h-dvh justify-center pt-[120px] pb-[120px]">
      <div className="flex flex-col items-center w-[310px] sm:w-[440px] max-w-full sm:px-0">
        <div style={{ position: "relative" }}>
          <div
            ref={spriteRowCallbackRef}
            style={{
              position: "absolute",
              top: -(SPRITE_H + 10),
              left: 40,
              right: 40,
              height: SPRITE_H + 10,
              overflow: "visible",
              zIndex: 2,
              opacity: 1,
            }}
          >
            <SpriteWithTrail containerWidth={spriteRowWidth} onClick={() => router.push("/work")} mounted={mounted} />
          </div>

          <div
            className="hidden sm:block"
            style={mounted ? { animation: "entrance 0.8s both", animationDelay: "0.15s" } : { opacity: 0, transform: "scale(0)" }}
          >
            <IDCardWeb />
          </div>
          <div
            className="block sm:hidden"
            style={mounted ? { animation: "entrance 0.8s both", animationDelay: "0.15s" } : { opacity: 0, transform: "scale(0)" }}
          >
            <IDCardMobile />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
