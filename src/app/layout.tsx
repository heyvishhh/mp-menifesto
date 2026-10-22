import type { Metadata } from "next";
import { Noto_Sans_Devanagari, Inter } from "next/font/google";
import "./globals.css";
import { ThemeScript } from "@/components/theme/ThemeScript";

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MP Manifesto Analysis Dashboard | मध्य प्रदेश संकल्प पत्र विश्लेषण",
  description: "मध्यप्रदेश शासन संकल्प पत्र 2023 के 414 वादों का आधिकारिक क्रियान्वयन, समीक्षा व विश्लेषण डैशबोर्ड",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="hi"
      className={`${inter.variable} ${notoSansDevanagari.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-[var(--dashboard-bg,#f8fafc)] text-slate-900 selection:bg-[var(--brand-teal-500,#14b8a6)] selection:text-white transition-colors duration-150">
        {children}
      </body>
    </html>
  );
}
