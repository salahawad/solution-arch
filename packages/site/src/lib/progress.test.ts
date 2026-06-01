import {describe, it, expect} from "vitest";
import {hashDate, conceptOfTheDay, newSlugs, exploredCount, addSeen} from "./progress";

describe("hashDate", () => {
  it("is deterministic for the same date string", () => {
    expect(hashDate("2026-06-01")).toBe(hashDate("2026-06-01"));
  });
  it("differs across dates", () => {
    expect(hashDate("2026-06-01")).not.toBe(hashDate("2026-06-02"));
  });
});

describe("conceptOfTheDay", () => {
  const slugs = ["a", "b", "c", "d"];
  it("returns a slug from the list", () => {
    expect(slugs).toContain(conceptOfTheDay(slugs, "2026-06-01"));
  });
  it("is stable within a day and varies across days", () => {
    expect(conceptOfTheDay(slugs, "2026-06-01")).toBe(conceptOfTheDay(slugs, "2026-06-01"));
    const week = ["01","02","03","04","05","06","07"].map(d => conceptOfTheDay(slugs, `2026-06-${d}`));
    expect(new Set(week).size).toBeGreaterThan(1);
  });
  it("returns empty string for an empty list", () => {
    expect(conceptOfTheDay([], "2026-06-01")).toBe("");
  });
});

describe("newSlugs", () => {
  const concepts = [
    {slug: "old", added: "2026-01-01"},
    {slug: "fresh", added: "2026-05-20"},
  ];
  it("returns nothing on a first visit (null lastVisit)", () => {
    expect(newSlugs(concepts, null)).toEqual([]);
  });
  it("returns only concepts added after lastVisit", () => {
    const lastVisit = Date.parse("2026-05-01");
    expect(newSlugs(concepts, lastVisit)).toEqual(["fresh"]);
  });
  it("ignores entries with no added date", () => {
    expect(newSlugs([{slug: "x", added: ""}], 0)).toEqual([]);
  });
});

describe("exploredCount", () => {
  it("counts only seen slugs that still exist", () => {
    expect(exploredCount(["a", "gone", "b"], ["a", "b", "c"])).toBe(2);
  });
});

describe("addSeen", () => {
  it("adds a new slug", () => {
    expect(addSeen(["a"], "b")).toEqual(["a", "b"]);
  });
  it("is a no-op for a duplicate", () => {
    expect(addSeen(["a"], "a")).toEqual(["a"]);
  });
});
