import type { Metadata } from "next";
import { Inter, Lora } from "next/font/google";
import localFont from "next/font/local";
import { DevTools } from "@/components/dev-tools";
import { HapticsProvider } from "@/components/haptics-provider";
import BreathingDots from "@/components/breathing-dots";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geist = localFont({
  src: [
    {
      path: "../../node_modules/geist/dist/fonts/geist-sans/Geist-Regular.woff2",
      weight: "400",
    },
    {
      path: "../../node_modules/geist/dist/fonts/geist-sans/Geist-Medium.woff2",
      weight: "500",
    },
    {
      path: "../../node_modules/geist/dist/fonts/geist-sans/Geist-SemiBold.woff2",
      weight: "600",
    },
    {
      path: "../../node_modules/geist/dist/fonts/geist-sans/Geist-Bold.woff2",
      weight: "700",
    },
  ],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = localFont({
  src: [
    {
      path: "../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Regular.woff2",
      weight: "400",
    },
    {
      path: "../../node_modules/geist/dist/fonts/geist-mono/GeistMono-Medium.woff2",
      weight: "500",
    },
  ],
  variable: "--font-geist-mono",
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://noahfarrar.com"),
  title: {
    default: "Noah Farrar",
    template: "%s — Noah Farrar",
  },
  description: "Creative portfolio and personal site of Noah Farrar.",
  openGraph: {
    title: "Noah Farrar",
    description: "Creative portfolio and personal site of Noah Farrar.",
    url: "https://noahfarrar.com",
    siteName: "Noah Farrar",
    locale: "en_US",
    type: "website",
    images: [{ url: "/opengraph-image.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Noah Farrar",
    description: "Creative portfolio and personal site of Noah Farrar.",
    images: ["/opengraph-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${geist.variable} ${geistMono.variable} ${lora.variable} antialiased`}
      >
        <BreathingDots />
        <HapticsProvider>
          {children}
        </HapticsProvider>
        <DevTools />
      </body>
    </html>
  );
}
