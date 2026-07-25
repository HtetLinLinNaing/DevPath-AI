import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/events/route";

function eventRequest(body: unknown, origin = "https://devpath.test") {
  return new Request("https://devpath.test/api/events", {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify(body),
  });
}

describe("POST /api/events", () => {
  beforeEach(() => {
    process.env.APP_ORIGIN = "https://devpath.test";
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.APP_ORIGIN;
  });

  it("accepts a strict event without caching", async () => {
    const response = await POST(eventRequest({ name: "roadmap_section_viewed", metadata: { timestamp: "2026-07-22T12:00:00.000Z", sectionId: "requirements" } }));
    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(console.info).toHaveBeenCalledOnce();
  });

  it("accepts a same-origin event when APP_ORIGIN is not configured", async () => {
    delete process.env.APP_ORIGIN;
    const response = await POST(eventRequest({ name: "generator_viewed", metadata: {} }));
    expect(response.status).toBe(204);
  });

  it.each([
    [{ name: "unknown", metadata: {} }, 400],
    [{ name: "generator_viewed", metadata: {}, prompt: "private" }, 400],
  ])("rejects invalid event payloads", async (body, status) => {
    expect((await POST(eventRequest(body))).status).toBe(status);
  });

  it("rejects cross-origin and oversized requests", async () => {
    expect((await POST(eventRequest({ name: "generator_viewed", metadata: {} }, "https://evil.test"))).status).toBe(400);
    const response = await POST(new Request("https://devpath.test/api/events", {
      method: "POST",
      headers: { origin: "https://devpath.test", "content-length": "5000" },
      body: "{}",
    }));
    expect(response.status).toBe(413);
  });
});
