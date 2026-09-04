import assert from "node:assert/strict";
import { mkdtemp, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { emptyIncomeStore } from "../src/lib/income";

async function main() {
  const dir = await mkdtemp(path.join(os.tmpdir(), "dp-thank-"));
  process.env.DATA_DIR = dir;
  process.env.RESEND_API_KEY = "re_test_fixture";
  process.env.RESEND_FROM = "Dock Posted <desk@dockposted.com>";
  process.env.NEXT_PUBLIC_SITE_URL = "https://dockposted.com";
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.BLOB_READ_WRITE_TOKEN;

  await mkdir(dir, { recursive: true });

  const store = emptyIncomeStore();
  store.pins.push({
    id: "pin-1",
    dockId: "marina-bay-harbor",
    dockName: "Marina Bay Harbor",
    contactName: "Pat",
    email: "dock@example.com",
    phone: "281-555-0100",
    role: "fuel dock",
    status: "filed",
    createdAt: "2026-09-01T12:00:00.000Z",
    paidAt: null,
    lastContactedAt: null,
    note: null,
  });
  store.watches.push({
    id: "watch-1",
    email: "skipper@example.com",
    name: "Pat",
    corridor: "galveston-bay",
    region: null,
    gallons: 40,
    status: "filed",
    createdAt: "2026-09-01T12:00:00.000Z",
    paidAt: null,
    note: null,
  });
  await writeFile(path.join(dir, "income.json"), JSON.stringify(store, null, 2));

  const sent: Array<{ url: string; body: Record<string, unknown>; headers: Headers }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const body = JSON.parse(String(init?.body ?? "{}")) as Record<string, unknown>;
    sent.push({ url, body, headers: new Headers(init?.headers) });
    return new Response(JSON.stringify({ id: `email_${sent.length}` }), { status: 200 });
  }) as typeof fetch;

  const { POST } = await import("../src/app/api/pay/webhook/route");
  const { readPin, readWatch } = await import("../src/lib/store");

  function checkout(kind: "pin" | "watch", recordId: string, customerEmail: string): Request {
    return new Request("http://localhost/api/pay/webhook", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        type: "checkout.session.completed",
        data: {
          object: {
            client_reference_id: `${kind}:${recordId}`,
            customer_email: customerEmail,
            metadata: { kind, recordId },
          },
        },
      }),
    });
  }

  const pinRes = await POST(checkout("pin", "pin-1", "card@example.com"));
  assert.equal(pinRes.status, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0]?.url, "https://api.resend.com/emails");
  assert.deepEqual(sent[0]?.body.to, ["dock@example.com"]);
  assert.equal(sent[0]?.body.subject, "This dock is yours");
  assert.match(String(sent[0]?.body.text), /Marina Bay Harbor/);
  assert.match(String(sent[0]?.body.html), /#0b1f33/);
  assert.match(String(sent[0]?.body.html), /https:\/\/dockposted\.com\/report/);
  assert.doesNotMatch(String(sent[0]?.body.text), /dock-posted\.vercel\.app/);
  assert.equal(sent[0]?.headers.get("Idempotency-Key"), "pin-thank-you/pin-1");
  const pin = await readPin("pin-1");
  assert.equal(pin?.status, "paid");
  assert.ok(pin?.paidAt);

  const pinRetry = await POST(checkout("pin", "pin-1", "card@example.com"));
  assert.equal(pinRetry.status, 200);
  assert.equal(sent.length, 1, "already-paid pin must not mail again");

  const watchRes = await POST(checkout("watch", "watch-1", "other@example.com"));
  assert.equal(watchRes.status, 200);
  assert.equal(sent.length, 2);
  assert.deepEqual(sent[1]?.body.to, ["skipper@example.com"]);
  assert.match(String(sent[1]?.body.subject), /watch that water/i);
  assert.match(String(sent[1]?.body.text), /\$29 a year/);
  assert.match(String(sent[1]?.body.text), /Not a text/);
  assert.match(String(sent[1]?.body.text), /https:\/\/dockposted\.com\/run/);
  assert.equal(sent[1]?.headers.get("Idempotency-Key"), "watch-thank-you/watch-1");
  const watch = await readWatch("watch-1");
  assert.equal(watch?.status, "paid");

  const watchRetry = await POST(checkout("watch", "watch-1", "other@example.com"));
  assert.equal(watchRetry.status, 200);
  assert.equal(sent.length, 2, "already-paid watch must not mail again");

  globalThis.fetch = originalFetch;
  console.log("thank-you webhook fixture passed");
}

void main();
