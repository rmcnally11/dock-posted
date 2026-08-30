import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: {
    default: "Dock Posted — Sabine to Key West",
    template: "%s — Dock Posted",
  },
  description:
    "The last number they wrote on the board. If they did not post, it stays Call.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} min-h-full overflow-x-hidden scroll-smooth antialiased lg:h-full`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden font-sans text-[color:var(--cream)] lg:h-full lg:overflow-y-auto">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
