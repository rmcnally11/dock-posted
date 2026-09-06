import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ONESHOT = "aPuCpKLCiPe55Bz-TKYxXj7mHhRhHvxu";

async function upload(sk: string, bytes: ArrayBuffer, filename: string, purpose: string) {
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
  const iconBuf = await readFile(path.join(root, "public/brand/stripe-icon.jpg"));
  const logoBuf = await readFile(path.join(root, "public/brand/stripe-logo.jpg"));
  const icon = await upload(sk, iconBuf.buffer.slice(iconBuf.byteOffset, iconBuf.byteOffset + iconBuf.byteLength), "stripe-icon.jpg", "business_icon");
  const logo = await upload(sk, logoBuf.buffer.slice(logoBuf.byteOffset, logoBuf.byteOffset + logoBuf.byteLength), "stripe-logo.jpg", "business_logo");

  // Prefer unstable brand settings via raw fetch if classic account update fails
  const unstable = new URLSearchParams({
    checkout_background_color: "rgb(251, 248, 243)",
    checkout_border_style: "round",
    checkout_button_color: "rgb(47, 143, 214)",
    checkout_font_family: "default",
    checkout_use_brand_colors: "true",
    contrast_color: "rgb(11, 30, 50)",
    font_color: "rgb(255, 255, 255)",
    icon,
    logo,
    primary_color: "rgb(11, 31, 51)",
    secondary_color: "rgb(47, 143, 214)",
    use_logo_instead_of_icon: "false",
  });
  const uRes = await fetch("https://api.stripe.com/v1/_unstable/settings/brand", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sk}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "Stripe-Version": "2025-08-27.basil; settings_branding_preview=v1",
    },
    body: unstable,
  });
  const uJson = await uRes.json();

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
    unstable_ok: uRes.ok,
    unstable: uJson,
    brand_ok: brandRes.ok,
    branding: brandJson?.settings?.branding ?? brandJson?.error ?? brandJson,
  });
}
