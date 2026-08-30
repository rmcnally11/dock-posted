import { cookies } from "next/headers";
import { WHOLESALE_COOKIE, wholesaleSessionValid } from "@/lib/wholesale-auth";

export async function isWholesaleAuthed(): Promise<boolean> {
  const jar = await cookies();
  return wholesaleSessionValid(jar.get(WHOLESALE_COOKIE)?.value);
}
