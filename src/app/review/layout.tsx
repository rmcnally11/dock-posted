import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { reviewPasswordConfigured } from "@/lib/review-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reports waiting",
  description: "Check a reported price before it goes on the board.",
  robots: { index: false, follow: false },
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  if (!reviewPasswordConfigured()) notFound();
  return <div className="flex min-h-full flex-1 flex-col">{children}</div>;
}
