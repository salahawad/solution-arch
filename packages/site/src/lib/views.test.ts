import {describe, it, expect} from "vitest";
import {
  InMemoryViewStore, viewKey, weekKey, formatCount, isKnownSlug, handleView, handleStats,
} from "./views";

const SLUGS = ["rag", "saga", "kafka"];
const T = Date.parse("2026-06-01T12:00:00Z"); // a fixed clock

describe("viewKey / isKnownSlug", () => {
  it("namespaces keys", () => expect(viewKey("rag")).toBe("view:rag"));
  it("guards unknown slugs", () => {
    expect(isKnownSlug("rag", SLUGS)).toBe(true);
    expect(isKnownSlug("evil:key", SLUGS)).toBe(false);
  });
});

describe("weekKey", () => {
  it("formats trending:YYYY-Www, stable within a week, varies across weeks", () => {
    const k = weekKey(Date.parse("2026-06-01T00:00:00Z"));
    expect(k).toMatch(/^trending:\d{4}-W\d{2}$/);
    expect(weekKey(Date.parse("2026-06-03T00:00:00Z"))).toBe(k);
    expect(weekKey(Date.parse("2026-06-15T00:00:00Z"))).not.toBe(k);
  });
});

describe("formatCount", () => {
  it("formats compactly", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(999)).toBe("999");
    expect(formatCount(1000)).toBe("1k");
    expect(formatCount(1234)).toBe("1.2k");
    expect(formatCount(12345)).toBe("12k");
    expect(formatCount(1500000)).toBe("1.5m");
  });
});

describe("InMemoryViewStore", () => {
  it("increments all-time count", async () => {
    const s = new InMemoryViewStore();
    expect(await s.increment("rag", T)).toBe(1);
    expect(await s.increment("rag", T)).toBe(2);
    expect(await s.counts(["rag", "saga"])).toEqual({rag: 2});
  });
  it("ranks trending within the week, most-viewed first, capped to n", async () => {
    const s = new InMemoryViewStore();
    await s.increment("rag", T);
    await s.increment("rag", T);
    await s.increment("saga", T);
    expect(await s.trending(T, 5)).toEqual(["rag", "saga"]);
    expect(await s.trending(T, 1)).toEqual(["rag"]);
  });
  it("scopes trending to the week of `now`", async () => {
    const s = new InMemoryViewStore();
    await s.increment("rag", T);
    const nextWeek = Date.parse("2026-06-15T12:00:00Z");
    expect(await s.trending(nextWeek, 5)).toEqual([]);
  });
});

describe("handleView", () => {
  it("404s an unknown slug", async () => {
    const res = await handleView("nope", SLUGS, new InMemoryViewStore(), () => T);
    expect(res.status).toBe(404);
  });
  it("records a known slug and returns the count", async () => {
    const store = new InMemoryViewStore();
    const res = await handleView("rag", SLUGS, store, () => T);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({count: 1});
  });
});

describe("handleStats", () => {
  it("returns counts + trending", async () => {
    const store = new InMemoryViewStore();
    await handleView("rag", SLUGS, store, () => T);
    await handleView("rag", SLUGS, store, () => T);
    await handleView("saga", SLUGS, store, () => T);
    const res = await handleStats(SLUGS, store, () => T);
    const body = await res.json();
    expect(body.counts).toEqual({rag: 2, saga: 1});
    expect(body.trending).toEqual(["rag", "saga"]);
  });
});
