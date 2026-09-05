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

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "Dock Posted",
      url: "https://www.dockposted.com/",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Web",
      description: "What they wrote on the pump. If they didn’t, ask the dock.",
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "0",
        highPrice: "299",
        priceCurrency: "USD",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Does Dock Posted sell fuel?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. We post what the dock wrote. We don’t sell a gallon.",
          },
        },
        {
          "@type": "Question",
          name: "What if the dock has no number up?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "We leave it blank. Call the dock. We never invent a price.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} min-h-full overflow-x-hidden scroll-smooth antialiased lg:h-full`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden font-sans text-[color:var(--navy)] lg:h-full lg:overflow-y-auto">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
