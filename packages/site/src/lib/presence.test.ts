import { describe, it, expect } from 'vitest';
import { InMemoryPresenceStore, isValidId } from './presence';

describe('InMemoryPresenceStore', () => {
  it('counts distinct ids within the window', async () => {
    const s = new InMemoryPresenceStore();
    expect(await s.recordAndCount('a', 1000, 60000)).toBe(1);
    expect(await s.recordAndCount('b', 1000, 60000)).toBe(2);
    expect(await s.recordAndCount('c', 1000, 60000)).toBe(3);
  });

  it('dedupes repeat beats from the same id', async () => {
    const s = new InMemoryPresenceStore();
    await s.recordAndCount('a', 1000, 60000);
    expect(await s.recordAndCount('a', 2000, 60000)).toBe(1);
  });

  it('evicts ids older than the window', async () => {
    const s = new InMemoryPresenceStore();
    await s.recordAndCount('a', 1000, 60000);
    // 'b' beats 61s later: 'a' (age 61000 >= 60000) is evicted, only 'b' remains
    expect(await s.recordAndCount('b', 62000, 60000)).toBe(1);
  });

  it('keeps an id still inside the window edge', async () => {
    const s = new InMemoryPresenceStore();
    await s.recordAndCount('a', 1000, 60000);
    // cutoff = 60999 - 60000 = 999; 'a' at 1000 > 999, so kept
    expect(await s.recordAndCount('b', 60999, 60000)).toBe(2);
  });

  it('always counts the caller (never zero)', async () => {
    const s = new InMemoryPresenceStore();
    expect(await s.recordAndCount('a', 999999, 60000)).toBe(1);
  });
});

describe('isValidId', () => {
  it('accepts a normal uuid string', () => {
    expect(isValidId('3f2504e0-4f89-41d3-9a0c-0305e82c3301')).toBe(true);
  });

  it('rejects empty, non-string, and oversized ids', () => {
    expect(isValidId('')).toBe(false);
    expect(isValidId(123 as unknown)).toBe(false);
    expect(isValidId(undefined)).toBe(false);
    expect(isValidId(null)).toBe(false);
    expect(isValidId('x'.repeat(65))).toBe(false);
  });
});
