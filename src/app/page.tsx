"use client";

import IDCardWeb from "@/components/id-card-web";
import IDCardMobile from "@/components/id-card-mobile";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

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
          <p
            className="text-[11px] uppercase tracking-[0.5px] mb-[8px]"
            style={{ color: "rgba(0,0,0,0.35)", fontWeight: 500 }}
          >
            Writing & Experiments
          </p>

          <div
            className="flex items-baseline justify-between w-full py-[12px] border-b transition-opacity duration-150 hover:opacity-40"
            style={{ borderColor: "rgba(0,0,0,0.06)" }}
          >
            <Link
              href="/thebridge"
              className="text-[14px] tracking-[-0.3px]"
              style={{ color: "#111", fontWeight: 450 }}
            >
              The Bridge
            </Link>
            <span
              className="text-[12px] tracking-[-0.2px]"
              style={{ color: "rgba(0,0,0,0.3)", fontFamily: "var(--font-geist-mono), monospace" }}
            >
              03/01/2026
            </span>
          </div>

          <div
            className="flex items-baseline justify-between w-full py-[12px] border-b transition-opacity duration-150 hover:opacity-40"
            style={{ borderColor: "rgba(0,0,0,0.06)" }}
          >
            <a
              href="https://satchel.noahfarrar.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[14px] tracking-[-0.3px]"
              style={{ color: "#111", fontWeight: 450 }}
            >
              Satchel
            </a>
            <span
              className="text-[12px] tracking-[-0.2px]"
              style={{ color: "rgba(0,0,0,0.3)", fontFamily: "var(--font-geist-mono), monospace" }}
            >
              03/04/2026
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
