"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import SpriteWithTrail, { SPRITE_H } from "@/components/sprite-with-trail";

const SPRITE_PAGES = new Set(["/", "/work", "/thebridge", "/spriterunner"]);

export default function GlobalSprite() {
  const pathname = usePathname();
  const router = useRouter();
  const visible = SPRITE_PAGES.has(pathname);
  const isHome = pathname === "/";
  const [mounted, setMounted] = useState(false);
  const [spriteRowWidth, setSpriteRowWidth] = useState(300);
  const spriteRoRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const containerRef = useCallback((el: HTMLElement | null) => {
    if (spriteRoRef.current) {
      spriteRoRef.current.disconnect();
      spriteRoRef.current = null;
    }
    if (el) {
      setSpriteRowWidth(el.clientWidth);
      const ro = new ResizeObserver(([entry]) =>
        setSpriteRowWidth(entry.contentRect.width)
      );
      ro.observe(el);
      spriteRoRef.current = ro;
    }
  }, []);

  const handleClick = useCallback(() => {
    if (pathname === "/work") router.push("/");
    else router.push("/work");
  }, [pathname, router]);

  const bubbleText =
    pathname === "/" ? "click me!" : pathname === "/work" ? "click for home!" : "back to work!";

  // Home: inset 40px to clear card border-radius, no divider
  // Other pages: full width run path + divider to match content width
  const inset = isHome ? 40 : 0;

  return (
    <div
      style={{
        position: "absolute",
        top: 66,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: visible ? "auto" : "none",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.3s ease",
        zIndex: 10,
      }}
    >
      <div
        className="px-6 sm:px-0"
        style={{
          width: 440,
          maxWidth: "100%",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: SPRITE_H + 10,
          }}
        >
          <div
            ref={containerRef}
            style={{
              position: "absolute",
              top: 0,
              left: inset,
              right: inset,
              height: SPRITE_H + 10,
              overflow: "visible",
            }}
          >
            <SpriteWithTrail
              key={pathname}
              containerWidth={spriteRowWidth}
              mounted={mounted}
              showBubble
              bubbleText={bubbleText}
              onClick={handleClick}
            />
          </div>
        </div>
        {!isHome && (
          <div
            style={{
              width: "100%",
              height: 1,
              backgroundColor: "rgba(0,0,0,0.06)",
            }}
          />
        )}
      </div>
    </div>
  );
}
