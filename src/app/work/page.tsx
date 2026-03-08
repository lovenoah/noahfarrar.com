"use client";

import BreathingDots from "@/components/breathing-dots";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useHaptics } from "@/components/haptics-provider";

type LinkEntry = {
  label: string;
  href: string;
  meta: string;
  type: "writing" | "experiment";
  external?: boolean;
};

const links: LinkEntry[] = [
  { label: "The Bridge", href: "/thebridge", meta: "03/01/2026", type: "writing" },
  { label: "Satchel", href: "https://satchel.noahfarrar.me", meta: "03/04/2026", type: "experiment", external: true },
  { label: "Sprite Runner", href: "/spriterunner", meta: "03/06/2026", type: "experiment" },
];

export default function Work() {
  const router = useRouter();
  const { trigger } = useHaptics();
  const [mounted, setMounted] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [touchIdx, setTouchIdx] = useState<number | null>(null);
  const [dotY, setDotY] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());
  const dotRef = useRef<HTMLSpanElement>(null);
  const prevIdx = useRef<number | null>(null);
  const isTouching = useRef(false);
  const touchIdxRef = useRef<number | null>(null);
  const cachedRects = useRef<Map<number, DOMRect>>(new Map());

  const activeIdx = hoveredIdx ?? touchIdx;
  const colorOffsets = useRef(links.map(() => -Math.random() * 24));
  const colorOverlayRefs = useRef<Map<number, HTMLSpanElement>>(new Map());

  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const getClosestIdx = useCallback((clientY: number): number | null => {
    let closest: number | null = null;
    let minDist = Infinity;
    cachedRects.current.forEach((rect, idx) => {
      const center = rect.top + rect.height / 2;
      const dist = Math.abs(clientY - center);
      if (dist < minDist) {
        minDist = dist;
        closest = idx;
      }
    });
    return closest;
  }, []);

  const cacheRects = useCallback(() => {
    cachedRects.current.clear();
    itemRefs.current.forEach((el, idx) => {
      cachedRects.current.set(idx, el.getBoundingClientRect());
    });
  }, []);

  // Bounce-only retrigger using Web Animations API — never touches color cycle
  const retriggerArc = useCallback(() => {
    if (!dotRef.current) return;
    dotRef.current.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-6px)", offset: 0.4 },
        { transform: "translateX(0)" },
      ],
      { duration: 400, easing: "ease-in-out" }
    );
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX > window.innerWidth / 2) return;
    isTouching.current = true;
    cacheRects();
    const idx = getClosestIdx(touch.clientY);
    if (idx !== null) {
      setTouchIdx(idx);
      touchIdxRef.current = idx;
      prevIdx.current = null;
      try { trigger("selection"); } catch {}
    }
  }, [cacheRects, getClosestIdx, trigger]);

  const handleTouchEnd = useCallback(() => {
    if (!isTouching.current) return;
    isTouching.current = false;
    const idx = touchIdxRef.current;
    cachedRects.current.clear();

    if (idx !== null) {
      const link = links[idx];
      if (link.external) {
        window.open(link.href, "_blank", "noopener,noreferrer");
        setTouchIdx(null);
        setDotY(null);
        prevIdx.current = null;
      } else {
        setTouchIdx(null);
        setDotY(null);
        prevIdx.current = null;
        touchIdxRef.current = null;
        router.push(link.href);
      }
    } else {
      setTouchIdx(null);
      setDotY(null);
      prevIdx.current = null;
    }
  }, [router]);

  const scrollActiveRow = useCallback((idx: number) => {
    const el = itemRefs.current.get(idx);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setTimeout(cacheRects, 150);
  }, [cacheRects]);

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouching.current) return;
      e.preventDefault();

      const touch = e.touches[0];
      const clientY = touch.clientY;
      const listRect = el.getBoundingClientRect();
      const clientX = touch.clientX;
      const halfScreen = window.innerWidth / 2;
      const verticalPadding = 80;
      const isInBounds = clientX <= halfScreen
        && clientY >= listRect.top - verticalPadding && clientY <= listRect.bottom + verticalPadding;

      if (!isInBounds) {
        isTouching.current = false;
        setTouchIdx(null);
        touchIdxRef.current = null;
        return;
      }

      const idx = getClosestIdx(clientY);
      if (idx !== null) {
        setTouchIdx(prev => {
          if (prev !== idx) {
            retriggerArc();
            try { trigger("selection"); } catch {}
            scrollActiveRow(idx);
          }
          return idx;
        });
        touchIdxRef.current = idx;
      }
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, [getClosestIdx, retriggerArc, trigger, scrollActiveRow]);

  useEffect(() => {
    if (activeIdx === null || !listRef.current) {
      setDotY(null);
      prevIdx.current = null;
      return;
    }

    const el = itemRefs.current.get(activeIdx);
    if (!el) return;

    const newY = el.offsetTop + el.offsetHeight / 2 - 2;

    if (prevIdx.current !== null && prevIdx.current !== activeIdx && dotRef.current && !isTouching.current) {
      retriggerArc();
    }

    prevIdx.current = activeIdx;
    setDotY(newY);
  }, [activeIdx, retriggerArc]);

  // Sync dot color with the active experiment row's cycling text
  useEffect(() => {
    if (activeIdx === null) return;
    const link = links[activeIdx];
    if (link.type !== "experiment") {
      if (dotRef.current) dotRef.current.style.backgroundColor = "#030303";
      return;
    }
    const overlay = colorOverlayRefs.current.get(activeIdx);
    if (!overlay) return;
    let raf: number;
    const sync = () => {
      if (dotRef.current && overlay) {
        dotRef.current.style.backgroundColor = getComputedStyle(overlay).color;
      }
      raf = requestAnimationFrame(sync);
    };
    raf = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(raf);
  }, [activeIdx]);

  return (
    <>
      <BreathingDots />
      <div className="flex min-h-dvh justify-center pt-[120px] pb-[120px]">
        <div className="flex flex-col w-[440px] max-w-full px-6 sm:px-0">
          <Link
            href="/"
            data-dim-dots="wide"
            className="hidden sm:inline-flex sm:fixed sm:top-[32px] sm:left-[32px] z-50 text-[14px] tracking-[-0.2px] items-center gap-[6px] hover:opacity-50 transition-opacity duration-75"
            style={{
              color: "rgba(0,0,0,0.35)",
              fontFamily: "var(--font-geist-mono), monospace",
              transition: "opacity 75ms ease-out",
              lineHeight: "14px",
            }}
          >
            &larr;
          </Link>
          <div
            className="w-full"
            data-dim-dots="wide"
            style={{
              paddingTop: 0,
              ...(mounted ? { opacity: 0, animation: "labelIn 0.4s ease-out both", animationDelay: "0.1s" } : { opacity: 0 }),
            }}
          >
            <style>{`
              @keyframes workDotColorCycle {
                0%, 100% { background-color: #F983CE; }
                12.5% { background-color: #FA8D11; }
                25% { background-color: #5CA466; }
                37.5% { background-color: #F18B91; }
                50% { background-color: #0484D4; }
                62.5% { background-color: #FACA27; }
                75% { background-color: #544CAC; }
                87.5% { background-color: #D4D4D4; }
              }
              @keyframes workTextColorCycle {
                0%, 100% { color: #F983CE; }
                12.5% { color: #FA8D11; }
                25% { color: #5CA466; }
                37.5% { color: #F18B91; }
                50% { color: #0484D4; }
                62.5% { color: #FACA27; }
                75% { color: #544CAC; }
                87.5% { color: #D4D4D4; }
              }
            `}</style>
            <div
              ref={listRef}
              style={{ position: "relative", WebkitTouchCallout: "none", userSelect: "none" }}
              onMouseLeave={() => setHoveredIdx(null)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              {links.map((link, i) => {
                const Tag = link.external ? "a" : Link;
                const extraProps = link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {};
                const isExperiment = link.type === "experiment";
                return (
                  <Tag
                    key={link.label}
                    href={link.href}
                    {...extraProps}
                    ref={(el: HTMLElement | null) => { if (el) itemRefs.current.set(i, el); }}
                    className={`flex items-center justify-between w-full border-b transition-opacity duration-150 cursor-pointer ${touchIdx === null ? (isExperiment ? "hover:opacity-60" : "hover:opacity-40") : ""}`}
                    style={{
                      borderColor: "rgba(0,0,0,0.06)",
                      padding: "12px 0",
                      ...(touchIdx !== null ? { opacity: touchIdx === i ? 1 : (isExperiment ? 0.6 : 0.35) } : {}),
                    }}
                    onMouseEnter={() => setHoveredIdx(i)}
                  >
                    <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <span
                        className="text-[14px] tracking-[-0.3px]"
                        style={{ color: "#111", fontWeight: 450 }}
                      >
                        {link.label}
                      </span>
                      {/* Type label — experiment rows always cycle (hidden by opacity when inactive) */}
                      <span
                        className="text-[12px]"
                        style={{
                          color: "rgba(0,0,0,0.45)",
                          fontFamily: "var(--font-geist-mono), monospace",
                          opacity: activeIdx === i ? 1 : 0,
                          transition: "opacity 150ms",
                          ...(isExperiment ? { animation: "workTextColorCycle 24s ease-in-out infinite", animationDelay: `${colorOffsets.current[i]}s` } : {}),
                        }}
                      >
                        {link.type === "writing" ? "writing" : "experiment"}
                      </span>
                    </span>
                    {/* Date — experiment rows use overlay for color cycling, controlled by opacity */}
                    <span
                      className="text-[12px]"
                      style={{
                        color: "rgba(0,0,0,0.3)",
                        fontFamily: "var(--font-geist-mono), monospace",
                        position: isExperiment ? "relative" : undefined,
                      }}
                    >
                      {link.meta}
                      {isExperiment && (
                        <span
                          aria-hidden
                          ref={(el: HTMLSpanElement | null) => { if (el) colorOverlayRefs.current.set(i, el); }}
                          style={{
                            position: "absolute",
                            inset: 0,
                            animation: "workTextColorCycle 24s ease-in-out infinite",
                            animationDelay: `${colorOffsets.current[i]}s`,
                            opacity: activeIdx === i ? 1 : 0,
                            transition: "opacity 150ms",
                          }}
                        >
                          {link.meta}
                        </span>
                      )}
                    </span>
                  </Tag>
                );
              })}
              {dotY !== null && (
                <span
                  ref={dotRef}
                  style={{
                    position: "absolute",
                    left: -14,
                    top: dotY,
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    backgroundColor: "#030303",
                    pointerEvents: "none",
                    transition: "top 400ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 300ms ease",
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
