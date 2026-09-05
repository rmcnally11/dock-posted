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
  themeColor: "#0B1F33",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.dockposted.com"),
  title: {
    default: "Dock Posted — Marina fuel",
    template: "%s — Dock Posted",
  },
  description:
    "What they wrote on the pump. If they didn’t, ask the dock.",
  applicationName: "Dock Posted",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Dock Posted",
  },
  twitter: {
    card: "summary_large_image",
    site: "@DockPosted",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/dp-mark.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} min-h-full overflow-x-hidden scroll-smooth antialiased lg:h-full`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden font-sans text-[color:var(--navy)] lg:h-full lg:overflow-y-auto">
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
