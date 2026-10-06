import { cookies } from "next/headers";
import { REVIEW_COOKIE, reviewSessionValid } from "@/lib/review-auth";

export async function isReviewAuthed(): Promise<boolean> {
  const jar = await cookies();
  return reviewSessionValid(jar.get(REVIEW_COOKIE)?.value);
}
