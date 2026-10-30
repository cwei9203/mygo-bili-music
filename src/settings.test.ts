import { test } from "node:test";
import assert from "node:assert/strict";
import { applyMotion, defaultSettings, readSettings, writeSettings } from "./settings";

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

test("nothing saved means the defaults: resume on, motion as the system wants it", () => {
  assert.deepEqual(readSettings(memory()), defaultSettings);
  assert.deepEqual(readSettings(memory({ "shiyin.settings": "not json" })), defaultSettings);
});

test("only known booleans are trusted, the rest falls back per key", () => {
  assert.deepEqual(readSettings(memory({ "shiyin.settings": '{"resume":false}' })), {
    resume: false,
    calm: false,
  });
  assert.deepEqual(readSettings(memory({ "shiyin.settings": '{"resume":"no","calm":true}' })), {
    resume: true,
    calm: true,
  });
});

test("a saved setting survives a round trip", () => {
  const storage = memory();
  writeSettings({ resume: false, calm: true }, storage);
  assert.deepEqual(readSettings(storage), { resume: false, calm: true });
});

test("calm is one root attribute, and turning it off removes it", () => {
  const attributes = new Map<string, string>();
  const root = {
    setAttribute: (name: string, value: string) => void attributes.set(name, value),
    removeAttribute: (name: string) => void attributes.delete(name),
  } as unknown as HTMLElement;
  applyMotion({ resume: true, calm: true }, root);
  assert.equal(attributes.get("data-motion"), "calm");
  applyMotion({ resume: true, calm: false }, root);
  assert.equal(attributes.has("data-motion"), false);
});
