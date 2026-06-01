import {describe, it, expect, beforeEach} from "vitest";
import {readProgress, writeProgress, EMPTY} from "./storage";

// In-memory localStorage stub — avoids needing jsdom for this I/O wrapper.
beforeEach(() => {
  const store = new Map<string, string>();
  // @ts-expect-error - assigning a minimal stub onto the global for the test
  globalThis.localStorage = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  };
});

describe("storage", () => {
  it("returns EMPTY when nothing is stored", () => {
    expect(readProgress()).toEqual(EMPTY);
  });
  it("round-trips a written value", () => {
    writeProgress({seen: ["a"], lastVisit: 123, version: 1});
    expect(readProgress()).toEqual({seen: ["a"], lastVisit: 123, version: 1});
  });
  it("recovers from corrupt JSON", () => {
    localStorage.setItem("sa.progress", "{not json");
    expect(readProgress()).toEqual(EMPTY);
  });
  it("coerces malformed fields to safe defaults", () => {
    localStorage.setItem("sa.progress", JSON.stringify({seen: "nope", lastVisit: "x"}));
    expect(readProgress()).toEqual({seen: [], lastVisit: null, version: 1});
  });
});
