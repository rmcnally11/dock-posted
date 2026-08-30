import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Dock Posted — Sabine to Key West marina fuel",
  description:
    "Posted gas and diesel for the Gulf coast, Texas down to Florida. Call ahead. We do not sell fuel. Sister instrument to On This Water.",
  icons: { icon: "/favicon.svg" },
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="flex h-full min-h-full flex-col overflow-y-auto font-sans text-[color:var(--cream)]">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
