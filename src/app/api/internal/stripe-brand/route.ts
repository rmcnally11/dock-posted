import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ONESHOT = "aPuCpKLCiPe55Bz-TKYxXj7mHhRhHvxu";

async function upload(sk: string, bytes: Buffer, filename: string, purpose: string) {
  const fd = new FormData();
  fd.append("purpose", purpose);
  fd.append("file", new Blob([bytes], { type: "image/jpeg" }), filename);
  const res = await fetch("https://files.stripe.com/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${sk}` },
    body: fd,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(JSON.stringify(json));
  return json.id as string;
}

export async function POST(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${ONESHOT}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const sk = process.env.STRIPE_SECRET_KEY;
  if (!sk?.startsWith("sk_")) {
    return NextResponse.json({ error: "missing stripe secret" }, { status: 500 });
  }
  const root = process.cwd();
  const iconBytes = await readFile(path.join(root, "public/brand/stripe-icon.jpg"));
  const logoBytes = await readFile(path.join(root, "public/brand/stripe-logo.jpg"));
  const icon = await upload(sk, iconBytes, "stripe-icon.jpg", "business_icon");
  const logo = await upload(sk, logoBytes, "stripe-logo.jpg", "business_logo");

  // Classic account branding (works with file ids)
  const brandBody = new URLSearchParams({
    "settings[branding][icon]": icon,
    "settings[branding][logo]": logo,
    "settings[branding][primary_color]": "#0b1f33",
    "settings[branding][secondary_color]": "#2f8fd6",
  });
  const brandRes = await fetch("https://api.stripe.com/v1/account", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sk}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: brandBody,
  });
  const brandJson = await brandRes.json();

  return NextResponse.json({
    icon,
    logo,
    brand_ok: brandRes.ok,
    branding: brandJson?.settings?.branding ?? brandJson?.error ?? brandJson,
  });
}
