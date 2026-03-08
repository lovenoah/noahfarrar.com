"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import TableOfContents from "@/components/bridge/TableOfContents";

const FigmaCard = dynamic(() => import("@/components/bridge/FigmaCard"), {
  ssr: false,
});
const LoadingRevealCard = dynamic(
  () => import("@/components/bridge/LoadingRevealCard"),
  { ssr: false }
);
const BreathingDotsCard = dynamic(
  () => import("@/components/bridge/BreathingDotsCard"),
  { ssr: false }
);
const DitherStripCard = dynamic(
  () => import("@/components/bridge/DitherStripCard"),
  { ssr: false }
);
const BallsCard = dynamic(() => import("@/components/bridge/BallsCard"), {
  ssr: false,
});
const ProfileRevealCard = dynamic(
  () => import("@/components/bridge/ProfileRevealCard"),
  { ssr: false }
);
const StickersCard = dynamic(
  () => import("@/components/bridge/StickersCard"),
  { ssr: false }
);
const TooltipsCard = dynamic(
  () => import("@/components/bridge/TooltipsCard"),
  { ssr: false }
);
const ClickParticlesCard = dynamic(
  () => import("@/components/bridge/ClickParticlesCard"),
  { ssr: false }
);
const TypewriterCard = dynamic(
  () => import("@/components/bridge/TypewriterCard"),
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
  { id: "design", label: "Design" },
  { id: "loading-reveal", label: "Loading / Reveal" },
  { id: "heart-field", label: "<3 Field" },
  { id: "color-strip", label: "Color Strip" },
  { id: "ball-physics", label: "Ball Physics" },
  { id: "skeleton-reveal", label: "Skeleton Reveal" },
  { id: "stickers", label: "Stickers" },
  { id: "frosted-tooltips", label: "Frosted Tooltips" },
  { id: "click-bursts", label: "Click Bursts" },
  { id: "code-snippet", label: "Code Snippet" },
];

export default function TheBridge() {
  const backRef = useRef<HTMLAnchorElement>(null);

  // Scroll position restoration on refresh
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
    // Only enable scroll-fade on desktop (sm breakpoint = 640px)
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
          The Bridge
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
          03/01/2026
        </span>

        {/* Intro */}
        <div className="space-y-[20px]">
          <p className={bodyClass} style={bodyStyle}>
            I&apos;m an illustrator / designer who always quietly admired
            people who could open a code editor and make something exist.
          </p>
          <p className={bodyClass} style={bodyStyle}>
            This project has been about learning to cross that bridge in
            real time, not by learning to code in the traditional sense, but
            by using tools like Claude as a means, and leaning into this new{" "}
            <span className="squiggle-wrap" style={{ position: "relative", display: "inline-block" }}>
              superpower
              <svg
                style={{
                  position: "absolute",
                  bottom: -3,
                  left: -1,
                  width: "calc(100% + 2px)",
                  height: 5,
                  overflow: "visible",
                }}
                viewBox="0 0 25 5"
                preserveAspectRatio="none"
              >
                <path
                  className="squiggle-stroke"
                  d="M0.923701 0.989775C0.373028 1.03194-0.0391999 1.51253 0.00296432 2.0632C0.0451286 2.61387 0.525718 3.0261 1.07639 2.98394L1.00005 1.98686L0.923701 0.989775ZM1.09975 1.97922L1.1761 2.9763L1.29956 2.96685L1.41699 2.92757L1.09975 1.97922ZM2.55803 1.95767L2.3284 0.984388L2.55803 1.95767ZM3.16742 1.84841L3.04488 0.855942L3.16742 1.84841ZM4.38347 1.55259L3.90668 0.673579L4.38347 1.55259ZM6.86504 1.5352L7.14557 2.49505L6.86504 1.5352ZM9.33922 1.30605L9.6375 0.351574L9.33922 1.30605ZM15.5247 1.77369L16.1091 0.962214L15.5247 1.77369ZM16.7535 1.95496L16.3041 2.84833L16.7535 1.95496ZM18.5613 2.40414L18.0141 3.24116L18.5613 2.40414ZM19.1349 2.676L18.8428 3.63242L19.1349 2.676ZM19.7453 2.78154L19.697 3.78038L19.7453 2.78154ZM21.5322 3.26947L21.1051 4.1737L21.5322 3.26947ZM22.7342 3.56686L23.452 2.8706L22.7342 3.56686ZM23.0441 3.72424L23.8537 4.31122L24.1307 3.92922L24.0119 3.47257L23.0441 3.72424ZM23.014 3.60855L23.2434 2.63521L21.6287 2.25469L22.0462 3.86021L23.014 3.60855ZM22.882 4.60482C23.4195 4.7315 23.958 4.39842 24.0847 3.86086C24.2114 3.3233 23.8783 2.78483 23.3407 2.65815L23.1113 3.63148L22.882 4.60482ZM1.00005 1.98686L1.07639 2.98394L1.1761 2.9763L1.09975 1.97922L1.02341 0.98214L0.923701 0.989775L1.00005 1.98686ZM1.09975 1.97922L1.41699 2.92757C1.52511 2.8914 1.59368 2.88053 1.62881 2.87803C1.66232 2.87565 1.65096 2.88178 1.61274 2.86906L1.92848 1.92022L2.24423 0.971374C1.73693 0.802559 1.21887 0.884908 0.78252 1.03087L1.09975 1.97922ZM1.92848 1.92022L1.61274 2.86906C1.98701 2.99361 2.38619 3.02566 2.78765 2.93095L2.55803 1.95767L2.3284 0.984388C2.3265 0.984837 2.30599 0.991926 2.24423 0.971374L1.92848 1.92022ZM2.55803 1.95767L2.78765 2.93095C2.9542 2.89165 3.12158 2.86166 3.28996 2.84087L3.16742 1.84841L3.04488 0.855942C2.8041 0.885671 2.56522 0.928517 2.3284 0.984388L2.55803 1.95767ZM3.16742 1.84841L3.28996 2.84087C3.50579 2.81422 3.72128 2.78389 3.93644 2.74988L3.78031 1.76215L3.62418 0.774409C3.43132 0.804894 3.23822 0.832071 3.04488 0.855942L3.16742 1.84841ZM3.78031 1.76215L3.93644 2.74988C4.26252 2.69834 4.57133 2.58833 4.86027 2.43161L4.38347 1.55259L3.90668 0.673579C3.79941 0.731764 3.70611 0.761459 3.62418 0.774409L3.78031 1.76215ZM4.38347 1.55259L4.86027 2.43161C4.88183 2.41991 4.89223 2.41777 4.8928 2.41765C4.89348 2.41751 4.8934 2.41756 4.89301 2.41758C4.89263 2.4176 4.89332 2.41752 4.89554 2.41774L4.99457 1.42266L5.0936 0.427572C4.67061 0.385476 4.26755 0.477836 3.90668 0.673579L4.38347 1.55259ZM4.99457 1.42266L4.89554 2.41774C5.23223 2.45125 5.5663 2.42031 5.89103 2.32675L5.61418 1.36584L5.33733 0.404923C5.25452 0.428783 5.17551 0.435724 5.0936 0.427572L4.99457 1.42266ZM5.61418 1.36584L5.89103 2.32675C5.86024 2.33562 5.82296 2.33871 5.78809 2.33395C5.75586 2.32955 5.7463 2.32131 5.76263 2.33017L6.23949 1.45119L6.71636 0.572212C6.30833 0.350851 5.82999 0.26298 5.33733 0.404923L5.61418 1.36584ZM6.23949 1.45119L5.76263 2.33017C6.17211 2.55232 6.65207 2.63928 7.14557 2.49505L6.86504 1.5352L6.5845 0.57536C6.61536 0.566342 6.65312 0.563007 6.68882 0.567801C6.72187 0.57224 6.73214 0.580775 6.71636 0.572212L6.23949 1.45119ZM6.86504 1.5352L7.14557 2.49505C7.33144 2.44072 7.51781 2.39194 7.70467 2.34868L7.47912 1.37445L7.25357 0.400216C7.02951 0.45209 6.80648 0.510481 6.5845 0.57536L6.86504 1.5352ZM7.47912 1.37445L7.70467 2.34868C7.86892 2.31065 8.03264 2.28369 8.19608 2.26751L8.09753 1.27237L7.99898 0.277243C7.74881 0.302018 7.50026 0.343105 7.25357 0.400216L7.47912 1.37445ZM8.09753 1.27237L8.19608 2.26751C8.38744 2.24856 8.57896 2.23409 8.77065 2.2241L8.71861 1.22545L8.66656 0.226808C8.44377 0.238419 8.22124 0.255232 7.99898 0.277243L8.09753 1.27237ZM8.71861 1.22545L8.77065 2.2241C8.85443 2.21973 8.9428 2.22986 9.04093 2.26053L9.33922 1.30605L9.6375 0.351574C9.32265 0.253178 8.99728 0.209573 8.66656 0.226808L8.71861 1.22545ZM9.33922 1.30605L9.04093 2.26053C9.44535 2.38691 9.86259 2.38422 10.2642 2.2567L9.96154 1.30359L9.65889 0.350492C9.65197 0.352689 9.6479 0.353452 9.64638 0.353698C9.64491 0.353934 9.64485 0.353847 9.64572 0.353843C9.64661 0.35384 9.64699 0.353927 9.6464 0.353836C9.64576 0.353738 9.64291 0.353261 9.6375 0.351574L9.33922 1.30605ZM9.96154 1.30359L10.2642 2.2567C10.3025 2.24453 10.3215 2.24634 10.342 2.25142L10.5826 1.28079L10.8231 0.310156C10.4323 0.213301 10.0373 0.23032 9.65889 0.350492L9.96154 1.30359ZM10.5826 1.28079L10.342 2.25142C10.6546 2.3289 10.9736 2.35386 11.2946 2.32443L11.2033 1.32861L11.112 0.332783C11.0166 0.341531 10.9218 0.334613 10.8231 0.310156L10.5826 1.28079ZM11.2033 1.32861L11.2946 2.32443C11.4526 2.30994 11.6092 2.30756 11.7649 2.31707L11.8259 1.31893L11.8869 0.320796C11.6288 0.305029 11.3703 0.309093 11.112 0.332783L11.2033 1.32861ZM11.8259 1.31893L11.7649 2.31707C11.8221 2.32057 11.8912 2.33647 11.9783 2.38134L12.436 1.49223L12.8937 0.603132C12.5812 0.44221 12.2435 0.342583 11.8869 0.320796L11.8259 1.31893ZM12.436 1.49223L11.9783 2.38134C12.317 2.55568 12.6888 2.64871 13.0807 2.63561L13.0473 1.63617L13.0139 0.636728C12.9905 0.637507 12.9548 0.634574 12.8937 0.603132L12.436 1.49223ZM13.0473 1.63617L13.0807 2.63561C13.3599 2.62628 13.6379 2.58706 13.9134 2.52036L13.6782 1.54843L13.4429 0.576495C13.2925 0.612911 13.1498 0.632186 13.0139 0.636728L13.0473 1.63617ZM13.6782 1.54843L13.9134 2.52036C13.9711 2.50641 14.0082 2.50959 14.0412 2.51845L14.3013 1.55288L14.5614 0.58731C14.1896 0.487128 13.8113 0.487338 13.4429 0.576495L13.6782 1.54843ZM14.3013 1.55288L14.0412 2.51845C14.3637 2.60536 14.6941 2.63079 15.0257 2.59636L14.9225 1.6017L14.8192 0.607045C14.7274 0.616575 14.6436 0.609452 14.5614 0.58731L14.3013 1.55288ZM14.9225 1.6017L15.0257 2.59636C15.0178 2.59718 15.0068 2.59755 14.9939 2.59643C14.9808 2.59532 14.9683 2.59294 14.9573 2.58977C14.934 2.58312 14.9281 2.57636 14.9404 2.58517L15.5247 1.77369L16.1091 0.962214C15.7415 0.697489 15.2996 0.557179 14.8192 0.607045L14.9225 1.6017ZM15.5247 1.77369L14.9404 2.58517C15.3608 2.88797 15.8691 2.99626 16.3874 2.86183L16.1364 1.89385L15.8853 0.925875C15.909 0.919731 15.9555 0.913737 16.0127 0.924972C16.0688 0.935983 16.1019 0.957006 16.1091 0.962214L15.5247 1.77369ZM16.1364 1.89385L16.3874 2.86183C16.3926 2.86048 16.38 2.86428 16.3556 2.86186C16.3305 2.85938 16.3119 2.85221 16.3041 2.84833L16.7535 1.95496L17.2028 1.06159C16.7833 0.850625 16.3277 0.811132 15.8853 0.925875L16.1364 1.89385ZM16.7535 1.95496L16.3041 2.84833C16.6871 3.04095 17.1041 3.10366 17.5244 3.03749L17.3689 2.04966L17.2133 1.06183C17.2066 1.06289 17.203 1.06296 17.2023 1.06296C17.2016 1.06297 17.2025 1.06293 17.2045 1.06322C17.2064 1.06352 17.2078 1.06392 17.2083 1.06408C17.2088 1.06423 17.207 1.06371 17.2028 1.06159L16.7535 1.95496ZM17.3689 2.04966L17.5244 3.03749C17.5771 3.02919 17.6071 3.0352 17.6334 3.04522L17.9889 2.11053L18.3443 1.17583C17.9777 1.03641 17.5943 1.00184 17.2133 1.06183L17.3689 2.04966ZM17.9889 2.11053L17.6334 3.04522C17.7593 3.09308 17.8861 3.15746 18.0141 3.24116L18.5613 2.40414L19.1085 1.56711C18.8663 1.40878 18.6114 1.27741 18.3443 1.17583L17.9889 2.11053ZM18.5613 2.40414L18.0141 3.24116C18.2725 3.41009 18.549 3.54271 18.8428 3.63242L19.1349 2.676L19.4269 1.71959C19.3262 1.68884 19.2203 1.64022 19.1085 1.56711L18.5613 2.40414ZM19.1349 2.676L18.8428 3.63242C19.1207 3.71725 19.4061 3.76632 19.697 3.78038L19.7453 2.78154L19.7935 1.78271C19.6651 1.7765 19.5435 1.75521 19.4269 1.71959L19.1349 2.676ZM19.7453 2.78154L19.697 3.78038C19.7652 3.78367 19.826 3.79967 19.8883 3.83135L20.3414 2.93988L20.7945 2.04841C20.4813 1.88925 20.1447 1.79968 19.7935 1.78271L19.7453 2.78154ZM20.3414 2.93988L19.8883 3.83135C20.1905 3.98494 20.514 4.07736 20.852 4.10597L20.9363 3.10953L21.0207 2.11309C20.9409 2.10635 20.8678 2.08567 20.7945 2.04841L20.3414 2.93988ZM20.9363 3.10953L20.852 4.10597C20.9429 4.11366 21.0253 4.13601 21.1051 4.1737L21.5322 3.26947L21.9592 2.36523C21.6623 2.22503 21.3476 2.14076 21.0207 2.11309L20.9363 3.10953ZM21.5322 3.26947L21.1051 4.1737C21.4815 4.35147 21.8828 4.40228 22.2794 4.3518L22.1531 3.3598L22.0269 2.3678C21.9722 2.37477 21.9595 2.36535 21.9592 2.36523L21.5322 3.26947ZM22.1531 3.3598L22.2794 4.3518C22.2532 4.35513 22.1982 4.3556 22.132 4.33201C22.0665 4.30868 22.0284 4.27548 22.0164 4.26311L22.7342 3.56686L23.452 2.8706C23.0766 2.48361 22.5725 2.29835 22.0269 2.3678L22.1531 3.3598ZM22.7342 3.56686L22.0164 4.26311C22.113 4.36268 22.2741 4.51819 22.4802 4.62287C22.5837 4.67547 22.7924 4.7643 23.0627 4.74719C23.3888 4.72655 23.6733 4.56 23.8537 4.31122L23.0441 3.72424L22.2345 3.13726C22.3924 2.9194 22.6473 2.76948 22.9363 2.75118C23.1696 2.73642 23.3339 2.8133 23.3858 2.83967C23.4886 2.89189 23.5172 2.93779 23.452 2.8706L22.7342 3.56686ZM23.0441 3.72424L24.0119 3.47257L23.9818 3.35688L23.014 3.60855L22.0462 3.86021L22.0763 3.97591L23.0441 3.72424ZM23.014 3.60855L22.7846 4.58188L22.882 4.60482L23.1113 3.63148L23.3407 2.65815L23.2434 2.63521L23.014 3.60855Z"
                  strokeWidth="0"
                />
              </svg>
            </span>{" "}
            us visual designers have at our fingertips.
          </p>
          <p className={bodyClass} style={bodyStyle}>
            Here&apos;s a fun breakdown of the interactive moments on my homepage.
          </p>
        </div>

        {/* Design */}
        <Section id="design" title="Design" demo={<FigmaCard />}>
          <p className={bodyClass} style={bodyStyle}>
            Started in Figma. Proportions, spacing, border radius, all
            mapped out before touching code. That wireframe became the
            blueprint for every component, so building in React was really
            just matching what was already on the artboard.
          </p>
        </Section>

        {/* Loading / Reveal */}
        <Section id="loading-reveal" title="Loading / Reveal" demo={<LoadingRevealCard />}>
          <p className={bodyClass} style={bodyStyle}>
            A grid of 14px cells covers the card on load. Each cell&apos;s
            dissolve delay is calculated from its distance to center, plus a
            dither jitter of{" "}
            <code
              className="text-[13px] px-[4px] py-[1px] rounded-[4px]"
              style={{ background: "rgba(0,0,0,0.05)" }}
            >
              (col*7 + row*13) % 17
            </code>{" "}
            so the wave isn&apos;t perfectly circular. The card underneath
            starts at{" "}
            <code
              className="text-[13px] px-[4px] py-[1px] rounded-[4px]"
              style={{ background: "rgba(0,0,0,0.05)" }}
            >
              scale(0.9)
            </code>{" "}
            and springs up with{" "}
            <code
              className="text-[13px] px-[4px] py-[1px] rounded-[4px]"
              style={{ background: "rgba(0,0,0,0.05)" }}
            >
              cubic-bezier(0.34, 1.56, 0.64, 1)
            </code>{" "}
            over 650ms for that overshoot landing.
          </p>
        </Section>


        {/* <3 Field */}
        <Section id="heart-field" title="&lt;3 Field" demo={<BreathingDotsCard />}>
          <p className={bodyClass} style={bodyStyle}>
            Rendered on a single canvas with{" "}
            <code
              className="text-[13px] px-[4px] py-[1px] rounded-[4px]"
              style={{ background: "rgba(0,0,0,0.05)" }}
            >
              pointer-events: none
            </code>{" "}
            over the whole viewport. Dots use spring physics (stiffness 0.02,
            damping 0.9) and fade in with a trailing effect over your last 12
            cursor positions, creating a comet effect. The five nearest dots
            within 100px flip to{" "}
            <code
              className="text-[13px] px-[4px] py-[1px] rounded-[4px]"
              style={{ background: "rgba(0,0,0,0.05)" }}
            >
              &lt;3
            </code>{" "}
            glyphs and linger before reverting.
          </p>
        </Section>

        {/* Color Strip */}
        <Section id="color-strip" title="Color Strip" demo={<DitherStripCard />}>
          <p className={bodyClass} style={bodyStyle}>
            41 colors are always cycling underneath, your cursor just acts
            as a flashlight.
          </p>
          <p className={`${bodyClass} mt-[16px]`} style={bodyStyle}>
            The reveal uses a gaussian falloff with four sine/cosine flow
            wobble components warping the edge so it never reads as a clean
            circle. Each cell&apos;s dither comes from three modular
            arithmetic sequences with coprime moduli (17, 19, 13) layered
            and averaged. Pseudo-randomness. Opacity is quantized to 50
            steps to reduce reflow thrashing.
          </p>
        </Section>

        {/* Ball Physics */}
        <Section id="ball-physics" title="Ball Physics" demo={<BallsCard />}>
          <p className={bodyClass} style={bodyStyle}>
            Pure play. No deeper reason. I just wanted to flick things around.
          </p>
          <p className={`${bodyClass} mt-[16px]`} style={bodyStyle}>
            Ten SVG circles with real physics. Gravity at
            0.015px/frame&sup2;, 0.5% drag per frame, 50% vertical restitution
            on bounce. Hover launches one at a random angle within &plusmn;60&deg;
            upward. After 4 to 6 seconds of floating it snaps back home with{" "}
            <code
              className="text-[13px] px-[4px] py-[1px] rounded-[4px]"
              style={{ background: "rgba(0,0,0,0.05)" }}
            >
              cubic-bezier(0.34, 1.56, 0.64, 1)
            </code>{" "}
            over 1 second. Colors cycle through 8 values on a 24 second loop,
            staggered per ball.
          </p>
        </Section>

        {/* Skeleton Reveal */}
        <Section id="skeleton-reveal" title="Skeleton Reveal" demo={<ProfileRevealCard />}>
          <p className={bodyClass} style={bodyStyle}>
            My favorite element from the main card. I drew both the pfp and
            skeleton in Procreate and wanted it to haunt the photo upon hover.
          </p>
          <p className={`${bodyClass} mt-[16px]`} style={bodyStyle}>
            A 16&times;16 grid of 10px dither cells sits over the profile
            photo, each one using{" "}
            <code
              className="text-[13px] px-[4px] py-[1px] rounded-[4px]"
              style={{ background: "rgba(0,0,0,0.05)" }}
            >
              background-position
            </code>{" "}
            offsets to sample the skeleton drawing underneath. Hover triggers
            the same gaussian dither reveal from the color strip, tuned with
            a softer exponent (1.2 vs 1.5) so it washes across more
            gradually. Only updates the DOM when opacity changes by more than
            0.02 to minimize repaints.
          </p>
          <p className={`${bodyClass} mt-[16px]`} style={bodyStyle}>
            When idle, a random sweep runs every 3 to 7 seconds, picking
            start and end points along random edges of the image and easing
            between them so the skeleton makes an appearance on its own.
          </p>
        </Section>

        {/* Stickers */}
        <Section id="stickers" title="Stickers" demo={<StickersCard />}>
          <p className={bodyClass} style={bodyStyle}>
            These are the wayfinding. Little hand-drawn anchors that link out
            to the rest of my world.
          </p>
          <p className={`${bodyClass} mt-[16px]`} style={bodyStyle}>
            Each sticker has its own rock angle range and a micro-float
            animation on a 7 to 9 second loop with staggered offsets so they
            never sync up. On hover they lift{" "}
            <code
              className="text-[13px] px-[4px] py-[1px] rounded-[4px]"
              style={{ background: "rgba(0,0,0,0.05)" }}
            >
              translateY(-8px) scale(1.06)
            </code>{" "}
            with a 300ms ease and the drop shadow deepens from 4px to 8px blur.
            They link out to my{" "}
            <a href="https://noahfarrar.com" target="_blank" rel="noopener noreferrer" className="hover:opacity-40 transition-opacity duration-75">portfolio</a>,{" "}
            <a href="mailto:hello@noahfarrar.com" className="hover:opacity-40 transition-opacity duration-75">email</a>, and{" "}
            <a href="https://x.com/noahfarrar" target="_blank" rel="noopener noreferrer" className="hover:opacity-40 transition-opacity duration-75">X/Twitter</a>.
          </p>
        </Section>

        {/* Frosted Tooltips */}
        <Section id="frosted-tooltips" title="Frosted Tooltips" demo={<TooltipsCard />}>
          <p className={bodyClass} style={bodyStyle}>
            Frosted glass pills using{" "}
            <code
              className="text-[13px] px-[4px] py-[1px] rounded-[4px]"
              style={{ background: "rgba(0,0,0,0.05)" }}
            >
              backdrop-filter: blur(12px)
            </code>{" "}
            over a semi-transparent white. Each sways on its own 3-axis
            animation (translate + rotate) so they feel like they&apos;re
            hanging. Inside each pill, a 12px dot cycles through 6 colors on
            a 12 second loop with staggered offsets, blurred to 8px and
            bouncing around on its own path. The glow bleeds through the
            frosted surface so it&apos;s always shifting.
          </p>
        </Section>

        {/* Click Bursts */}
        <Section id="click-bursts" title="Click Bursts" demo={<ClickParticlesCard />}>
          <p className={bodyClass} style={bodyStyle}>
            A hidden easter egg. Click anywhere on the card and it shoots out
            little pixel bursts of color.
          </p>
          <p className={`${bodyClass} mt-[16px]`} style={bodyStyle}>
            1 center cell plus 5 rings of 8 rays each, snapped to a 10px
            grid. Each click picks a random hue family of 8 shades, with a
            15% chance any cell pulls from an adjacent family for dissonance.
            Ring-based delay (ring &times; 40ms) staggers the bloom, then
            each cell follows a 4 to 6 step random walk at 20px per step
            before fading with opacity. The outer rings probabilistically
            skip cells so no two clicks match.
          </p>
        </Section>

        {/* Code Snippet */}
        <Section id="code-snippet" title="Code Snippet" demo={<TypewriterCard />}>
          <p className={bodyClass} style={bodyStyle}>
            A nod to the process itself. The card types out its own source
            code like it&apos;s showing you how it was made.
          </p>
        </Section>

      </div>
    </div>
  );
}
