import { DESK_NOTIFY_DEFAULT } from "./income";

export function notifyEmail(): string {
  return process.env.DESK_NOTIFY_EMAIL?.trim() || DESK_NOTIFY_DEFAULT;
}

export function resendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export function resendFrom(): string {
  return process.env.RESEND_FROM?.trim() || "Dock Posted <rmcnally11@gmail.com>";
}

export async function sendMail(input: {
  to: string | string[];
  subject: string;
  text: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    console.info("Resend unset; mail stays local.", input.subject);
    return false;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom(),
      to: Array.isArray(input.to) ? input.to : [input.to],
      subject: input.subject,
      text: input.text,
    }),
  });
  if (!res.ok) {
    console.warn("Resend send failed", res.status, await res.text());
    return false;
  }
  return true;
}
