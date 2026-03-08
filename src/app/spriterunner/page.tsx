"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import TableOfContents from "@/components/bridge/TableOfContents";

const FrameSheetCard = dynamic(
  () => import("@/components/spriterunner/FrameSheetCard"),
  { ssr: false }
);
const AssemblyCard = dynamic(
  () => import("@/components/spriterunner/AssemblyCard"),
  { ssr: false }
);
const MotionPathCard = dynamic(
  () => import("@/components/spriterunner/MotionPathCard"),
  { ssr: false }
);
const SparkleCard = dynamic(
  () => import("@/components/spriterunner/SparkleCard"),
  { ssr: false }
);
const BubbleCard = dynamic(
  () => import("@/components/spriterunner/BubbleCard"),
  { ssr: false }
);
const PersistenceCard = dynamic(
  () => import("@/components/spriterunner/PersistenceCard"),
  { ssr: false }
);

const bodyStyle = {
  color: "#030303",
  fontFamily: "var(--font-geist), sans-serif",
};

const bodyClass =
  "text-[14px] leading-[1.3em] tracking-[-0.01em]";

function Section({
  id,
  title,
  children,
  demo,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  demo: React.ReactNode;
}) {
  return (
    <section id={id} className="w-full mt-[64px] scroll-mt-[40px]">
      <h2
        className="text-[14px] tracking-[-0.01em] leading-[1.3em] mb-[16px]"
        style={{ color: "#030303", fontWeight: 500, fontFamily: "var(--font-geist), sans-serif" }}
      >
        {title}
      </h2>
      <div className="mb-[28px]">{children}</div>
      <div
        style={{
          width: "100%",
          borderRadius: 16,
          boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
          overflow: "hidden",
        }}
      >
        {demo}
      </div>
    </section>
  );
}

const tocItems = [
  { id: "frame-design", label: "Frame Design" },
  { id: "assembly", label: "Assembly" },
  { id: "motion-path", label: "Motion Path" },
  { id: "sparkle-trail", label: "Sparkle Trail" },
  { id: "speech-bubble", label: "Speech Bubble" },
  { id: "global-persistence", label: "Global Persistence" },
];

export default function SpriteRunner() {
  const backRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const key = "scroll-" + window.location.pathname;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      window.scrollTo(0, parseInt(saved, 10));
    }
    const handleScroll = () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 640) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;
    let rafId: number;
    let currentOpacity = 1;
    let targetOpacity = 1;

    const tick = () => {
      currentOpacity += (targetOpacity - currentOpacity) * 0.1;
      if (Math.abs(currentOpacity - targetOpacity) < 0.005) {
        currentOpacity = targetOpacity;
      } else {
        rafId = requestAnimationFrame(tick);
      }
      if (backRef.current) backRef.current.style.opacity = String(currentOpacity);
    };

    const handleScroll = () => {
      targetOpacity = 0;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(tick);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        targetOpacity = 1;
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(tick);
      }, 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      className="flex min-h-dvh justify-center pt-[148px] pb-[120px]"
      data-dim-dots="true"
    >
      <TableOfContents items={tocItems} />
      <div className="flex flex-col w-[440px] max-w-full px-6 sm:px-0">
        <Link
          ref={backRef}
          href="/work"
          className="inline-flex absolute top-[20px] left-[20px] sm:fixed sm:top-[32px] sm:left-[32px] z-50 text-[14px] tracking-[-0.2px] items-center gap-[6px] hover:opacity-50 transition-opacity duration-75"
          style={{
            color: "rgba(0,0,0,0.35)",
            fontFamily: "var(--font-geist-mono), monospace",
            transition: "opacity 75ms ease-out",
            lineHeight: "14px",
          }}
        >
          &larr;
        </Link>

        {/* Header */}
        <h1
          className="text-[14px] tracking-[-0.01em] leading-[1.3em] mb-[6px]"
          style={{ color: "#030303", fontWeight: 500, fontFamily: "var(--font-geist), sans-serif" }}
        >
          Sprite Runner
        </h1>
        <span
          className="text-[12px] tracking-[-0.01em] leading-[1.3em] mb-[48px]"
          style={{
            color: "#030303",
            opacity: 0.5,
            fontFamily: "var(--font-geist-mono), monospace",
            fontWeight: 300,
          }}
        >
          03/08/2026
        </span>

        {/* Intro */}
        <div className="space-y-[20px]">
          <p className={bodyClass} style={bodyStyle}>
            I&apos;ve always been a fan of frame by frame animation so I
            wanted to give a gentle nod to that with this little guy.
            I&apos;m finding that pairing traditional art and design with
            modern coding tools and effects is so satisfying to me at a
            deep personal level.
          </p>
        </div>

        {/* Frame Design */}
        <Section id="frame-design" title="Frame Design" demo={<FrameSheetCard />}>
          <p className={bodyClass} style={bodyStyle}>
            8 frames, hand-drawn on an 8&times;8 pixel grid in Figma.
            Each frame is a standalone SVG built from colored{" "}
            <code
              className="text-[13px] px-[4px] py-[1px] rounded-[4px]"
              style={{ background: "rgba(0,0,0,0.05)" }}
            >
              &lt;rect&gt;
            </code>{" "}
            elements, no paths or curves. The frames cycle at 100ms
            intervals and render with{" "}
            <code
              className="text-[13px] px-[4px] py-[1px] rounded-[4px]"
              style={{ background: "rgba(0,0,0,0.05)" }}
            >
              image-rendering: pixelated
            </code>{" "}
            so scaling up keeps the hard edges instead of blurring them out.
          </p>
          <p className={`${bodyClass} mt-[16px]`} style={bodyStyle}>
            The palette is intentionally small: skin tones, hair browns, a
            blue shirt, and pink shoes. Enough to read as a little person
            at any size.
          </p>
        </Section>

        {/* Assembly */}
        <Section id="assembly" title="Assembly" demo={<AssemblyCard />}>
          <p className={bodyClass} style={bodyStyle}>
            Any time you load, refresh, or jump pages, he does this nice
            assemble effect, bringing him from nothing into existence.
          </p>
        </Section>

        {/* Motion Path */}
        <Section id="motion-path" title="Motion Path" demo={<MotionPathCard />}>
          <p className={bodyClass} style={bodyStyle}>
            His run path is a simple triangle wave over 6.5 seconds.
            Left to right, then right to left, forever. At each turn he
            flips with{" "}
            <code
              className="text-[13px] px-[4px] py-[1px] rounded-[4px]"
              style={{ background: "rgba(0,0,0,0.05)" }}
            >
              scaleX(-1)
            </code>{" "}
            so he always faces the direction he&apos;s running.
          </p>
          <p className={`${bodyClass} mt-[16px]`} style={bodyStyle}>
            What&apos;s cool is that his path adapts to whatever
            container he&apos;s in for both web and mobile.
          </p>
        </Section>

        {/* Sparkle Trail */}
        <Section id="sparkle-trail" title="Sparkle Trail" demo={<SparkleCard />}>
          <p className={bodyClass} style={bodyStyle}>
            Sparkle particles spawn every 40ms behind him from a
            hand-picked 8 color palette. Each particle starts at full
            life and decays over 0.6 to 1.1 seconds. Opacity uses
            squared falloff{" "}
            <code
              className="text-[13px] px-[4px] py-[1px] rounded-[4px]"
              style={{ background: "rgba(0,0,0,0.05)" }}
            >
              life * life * 0.7
            </code>{" "}
            so they dissolve rather than vanish, and size shrinks with
            life for a twinkling effect.
          </p>
        </Section>

        {/* Speech Bubble */}
        <Section id="speech-bubble" title="Speech Bubble" demo={<BubbleCard />}>
          <p className={bodyClass} style={bodyStyle}>
            A context-aware tooltip appears randomly above him and acts
            as an easter egg navigation tool.
          </p>
        </Section>

        {/* Global Persistence */}
        <Section id="global-persistence" title="Global Persistence" demo={<PersistenceCard />}>
          <p className={bodyClass} style={bodyStyle}>
            The sprite lives in the root layout, not on any individual
            page. He&apos;s rendered once and persists across all
            client-side navigations. The page content swaps underneath
            him while he keeps running in the same spot.
          </p>
          <p className={`${bodyClass} mt-[16px]`} style={bodyStyle}>
            Using{" "}
            <code
              className="text-[13px] px-[4px] py-[1px] rounded-[4px]"
              style={{ background: "rgba(0,0,0,0.05)" }}
            >
              key=&#123;pathname&#125;
            </code>{" "}
            on the sprite component forces a remount on each route
            change, replaying the assembly animation so every page
            transition feels like an entrance. His position resets but
            his presence never breaks.
          </p>
        </Section>

      </div>
    </div>
  );
}
