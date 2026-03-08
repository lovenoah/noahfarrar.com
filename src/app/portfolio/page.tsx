"use client";

import { useEffect, useRef, useState } from "react";
import BreathingDots from "@/components/breathing-dots";

const SPRITE_FRAMES = 8;
const SPRITE_FRAME_DURATION = 100;
const SPRITE_W = 39;
const SPRITE_H = 43;

export default function Portfolio() {
  const [mounted, setMounted] = useState(false);
  const spriteRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef(1);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      frameRef.current = (frameRef.current % SPRITE_FRAMES) + 1;
      if (spriteRef.current) {
        spriteRef.current.src = `/sprites/00${frameRef.current}.svg`;
      }
    }, SPRITE_FRAME_DURATION);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <BreathingDots />
      <div
        className="flex min-h-dvh justify-center items-center"
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
      >
        <div className="flex flex-col items-center gap-[12px]">
          <div
            style={{
              width: SPRITE_W,
              height: SPRITE_H,
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.4s ease-out",
            }}
          >
            <img
              ref={spriteRef}
              src="/sprites/001.svg"
              alt=""
              width={SPRITE_W}
              height={SPRITE_H}
              draggable={false}
              style={{
                imageRendering: "pixelated",
                display: "block",
                width: "100%",
                height: "100%",
                pointerEvents: "none",
              }}
            />
          </div>
          <p
            className="text-[14px]"
            style={{
              fontFamily: "var(--font-geist), sans-serif",
              fontWeight: 400,
              opacity: mounted ? 1 : 0,
              transition: "opacity 0.4s ease-out 0.5s",
            }}
          >
            <span style={{ color: "#030303" }}>WIP</span>
            <span style={{ color: "#030303", opacity: 0.45 }}> (coming soon)</span>
          </p>
        </div>
      </div>
    </>
  );
}
