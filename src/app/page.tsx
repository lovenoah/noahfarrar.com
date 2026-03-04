"use client";

import IDCardWeb from "@/components/id-card-web";
import IDCardMobile from "@/components/id-card-mobile";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type LinkEntry = {
  label: string;
  href: string;
  meta: string;
  type: "writing" | "experiment";
  external?: boolean;
};

const links: LinkEntry[] = [
  { label: "The Bridge", href: "/thebridge", meta: "03/01/2026", type: "writing" },
  { label: "Satchel", href: "https://satchel.noahfarrar.me", meta: "v1.0", type: "experiment", external: true },
];

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [dotY, setDotY] = useState<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());
  const dotRef = useRef<HTMLSpanElement>(null);
  const prevIdx = useRef<number | null>(null);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // Animate dot to hovered item
  useEffect(() => {
    if (hoveredIdx === null || !listRef.current) {
      setDotY(null);
      prevIdx.current = null;
      return;
    }

    const el = itemRefs.current.get(hoveredIdx);
    if (!el) return;

    const newY = el.offsetTop + el.offsetHeight / 2 - 2;

    const type = links[hoveredIdx].type;

    // Retrigger arc animation when moving between items
    if (prevIdx.current !== null && prevIdx.current !== hoveredIdx && dotRef.current) {
      const dot = dotRef.current;
      dot.style.animation = "none";
      dot.offsetHeight; // reflow
      // Combine arc with color cycle for experiments
      dot.style.animation = type === "experiment"
        ? "homeDotArc 400ms ease-in-out, homeDotColorCycle 24s ease-in-out infinite"
        : "homeDotArc 400ms ease-in-out";
    }

    prevIdx.current = hoveredIdx;
    setDotY(newY);
  }, [hoveredIdx]);

  const hoveredType = hoveredIdx !== null ? links[hoveredIdx].type : null;

  return (
    <div className="flex min-h-dvh justify-center pt-[120px] pb-[120px]">
      <div className="flex flex-col items-center w-[310px] sm:w-[440px] max-w-full sm:px-0">
        <div
          className="hidden sm:block"
          style={mounted ? { animation: "entrance 0.8s both" } : { opacity: 0, transform: "scale(0)" }}
        >
          <IDCardWeb />
        </div>
        <div
          className="block sm:hidden"
          style={mounted ? { animation: "entrance 0.8s both" } : { opacity: 0, transform: "scale(0)" }}
        >
          <IDCardMobile />
        </div>

        <div
          className="group/list w-full mt-[40px]"
          data-dim-dots="wide"
          style={mounted ? { opacity: 0, animation: "labelIn 0.4s ease-out both", animationDelay: "0.5s" } : { opacity: 0 }}
        >
          <style>{`
            @keyframes homeDotArc {
              0% { transform: translateX(0); }
              40% { transform: translateX(-6px); }
              100% { transform: translateX(0); }
            }
            @keyframes homeDotColorCycle {
              0%, 100% { background-color: #F983CE; }
              12.5% { background-color: #FA8D11; }
              25% { background-color: #5CA466; }
              37.5% { background-color: #F18B91; }
              50% { background-color: #0484D4; }
              62.5% { background-color: #FACA27; }
              75% { background-color: #544CAC; }
              87.5% { background-color: #D4D4D4; }
            }
          `}</style>
          <div
            ref={listRef}
            style={{ position: "relative" }}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {links.map((link, i) => {
              const Tag = link.external ? "a" : Link;
              const extraProps = link.external
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {};
              return (
                <Tag
                  key={link.label}
                  href={link.href}
                  {...extraProps}
                  ref={(el: HTMLElement | null) => { if (el) itemRefs.current.set(i, el); }}
                  className="flex items-center justify-between w-full py-[12px] border-b transition-opacity duration-150 hover:opacity-40 cursor-pointer"
                  style={{ borderColor: "rgba(0,0,0,0.06)" }}
                  onMouseEnter={() => setHoveredIdx(i)}
                >
                  <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                    <span
                      className="text-[14px] tracking-[-0.3px]"
                      style={{ color: "#111", fontWeight: 450 }}
                    >
                      {link.label}
                    </span>
                    <span
                      className="text-[12px]"
                      style={{
                        color: "rgba(0,0,0,0.45)",
                        fontFamily: "var(--font-geist-mono), monospace",
                        opacity: hoveredIdx === i ? 1 : 0,
                        transition: "opacity 150ms",
                      }}
                    >
                      {link.type === "writing" ? "writing" : "experiment"}
                    </span>
                  </span>
                  <span
                    className="text-[12px]"
                    style={{ color: "rgba(0,0,0,0.3)", fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {link.meta}
                  </span>
                </Tag>
              );
            })}
            {/* Animated dot */}
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
                  backgroundColor: hoveredType === "writing" ? "#030303" : undefined,
                  animation: hoveredType === "experiment" ? "homeDotColorCycle 24s ease-in-out infinite" : undefined,
                  pointerEvents: "none",
                  transition: "top 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
