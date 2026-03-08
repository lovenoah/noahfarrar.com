"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type TOCItem = { id: string; label: string };

// TOC at 32px left + 160px wide = right edge 192px
// Content left = 50% - 220px. Hide when gap < 64px:
// 50% - 220 - 192 < 64 → viewport < 952px
const MIN_WIDTH = 960;

export default function TableOfContents({ items }: { items: TOCItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dotY, setDotY] = useState<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const prevHighlightedRef = useRef<string | null>(null);

  const checkWidth = useCallback(() => {
    setVisible(window.innerWidth >= MIN_WIDTH);
  }, []);

  useEffect(() => {
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, [checkWidth]);

  useEffect(() => {
    if (!visible) return;

    const lastId = items[items.length - 1]?.id;
    let atBottom = false;

    const handleScroll = () => {
      const wasAtBottom = atBottom;
      atBottom =
        window.scrollY > 100 &&
        window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 50;
      if (atBottom && !wasAtBottom && lastId) {
        setActiveId(lastId);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    const visibleSections = new Map<string, IntersectionObserverEntry>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (atBottom) return;

        entries.forEach((entry) => {
          visibleSections.set(entry.target.id, entry);
        });

        let topSection: string | null = null;
        let topY = Infinity;

        visibleSections.forEach((entry, id) => {
          if (entry.isIntersecting && entry.boundingClientRect.top < topY) {
            topY = entry.boundingClientRect.top;
            topSection = id;
          }
        });

        if (topSection) {
          setActiveId(topSection);
        } else {
          const anyVisible = Array.from(visibleSections.values()).some(
            (e) => e.isIntersecting
          );
          if (!anyVisible) {
            setActiveId(null);
          }
        }
      },
      {
        rootMargin: "-10% 0px -60% 0px",
        threshold: 0,
      }
    );

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current!.observe(el);
    });

    return () => {
      observerRef.current?.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [items, visible]);

  // Compute the highlighted item
  const highlightedId = hovering ? hoveredId : activeId;

  // Animate the dot to the highlighted item
  useEffect(() => {
    if (!highlightedId || !listRef.current) {
      setDotY(null);
      return;
    }

    const li = itemRefs.current.get(highlightedId);
    if (!li) return;

    const newY = li.offsetTop + li.offsetHeight / 2 - 2;

    // Retrigger arc animation when moving between items
    if (
      prevHighlightedRef.current &&
      prevHighlightedRef.current !== highlightedId &&
      dotRef.current
    ) {
      const dot = dotRef.current;
      dot.style.animation = "none";
      dot.offsetHeight; // reflow
      dot.style.animation = "tocArc 400ms ease-in-out";
    }

    prevHighlightedRef.current = highlightedId;
    setDotY(newY);
  }, [highlightedId]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!visible) return null;

  return (
    <nav
      style={{
        position: "fixed",
        top: 80,
        left: "max(32px, calc(50% - 440px))",
        width: 160,
        zIndex: 20,
        fontFamily: "var(--font-geist), sans-serif",
      }}
    >
      <style>{`
        @keyframes tocArc {
          0% { transform: translateX(0); }
          40% { transform: translateX(-6px); }
          100% { transform: translateX(0); }
        }
      `}</style>
      <ul
        ref={listRef}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => { setHovering(false); setHoveredId(null); }}
        style={{ position: "relative", display: "flex", flexDirection: "column", gap: 2 }}
      >
        {items.map(({ id, label }) => {
          const isActive = activeId === id;
          const isHovered = hoveredId === id;
          const highlighted = hovering ? isHovered : isActive;
          return (
            <li
              key={id}
              ref={(el) => { if (el) itemRefs.current.set(id, el); }}
              style={{ listStyle: "none" }}
            >
              <button
                onClick={() => handleClick(id)}
                onMouseEnter={() => setHoveredId(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 13,
                  lineHeight: "24px",
                  letterSpacing: "-0.01em",
                  fontWeight: highlighted ? 500 : 400,
                  color: "#030303",
                  opacity: highlighted ? 1 : 0.2,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textAlign: "left",
                  transition: "opacity 150ms",
                }}
              >
                {/* Dot placeholder for layout — invisible, keeps text aligned */}
                <span style={{ width: 4, height: 4, flexShrink: 0 }} />
                {label}
              </button>
            </li>
          );
        })}
        {/* Single animated dot that jumps between items */}
        {dotY !== null && (
          <span
            ref={dotRef}
            style={{
              position: "absolute",
              left: 0,
              top: dotY,
              width: 4,
              height: 4,
              borderRadius: "50%",
              backgroundColor: "#030303",
              pointerEvents: "none",
              transition: "top 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
        )}
      </ul>
    </nav>
  );
}
