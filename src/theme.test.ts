import { test } from "node:test";
import assert from "node:assert/strict";
import { readPreference } from "./theme";

function memory(entries: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(entries));
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (k: string) => data.get(k) ?? null,
    key: (i: number) => [...data.keys()][i] ?? null,
    removeItem: (k: string) => void data.delete(k),
    setItem: (k: string, v: string) => void data.set(k, v),
  } as Storage;
}

test("no stored choice means the system is still in charge", () => {
  assert.equal(readPreference(memory()), null);
  assert.equal(readPreference(memory({ "shiyin.theme": "sepia" })), null);
});

test("a stored choice is remembered", () => {
  assert.equal(readPreference(memory({ "shiyin.theme": "dark" })), "dark");
  assert.equal(readPreference(memory({ "shiyin.theme": "light" })), "light");
});
