import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { wholesalePasswordConfigured } from "@/lib/wholesale-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wholesale",
  description: "From the terminal to what they wrote on the board.",
  robots: { index: false, follow: false },
};

export default function WholesaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!wholesalePasswordConfigured()) notFound();
  return <div className="wholesale flex min-h-full flex-1 flex-col">{children}</div>;
}
