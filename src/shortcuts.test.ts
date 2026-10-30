import { test } from "node:test";
import assert from "node:assert/strict";
import {
  actions,
  defaultBindings,
  isReserved,
  label,
  ownerOf,
  readBindings,
  signature,
  writeBindings,
  type Bindings,
} from "./shortcuts";

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

const press = (code: string, held: Partial<Record<"metaKey" | "ctrlKey" | "altKey" | "shiftKey", boolean>> = {}) => ({
  code,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  ...held,
});

test("modifiers are canonical whatever the platform's modifier key is", () => {
  assert.equal(signature(press("KeyF", { metaKey: true })), "Mod+KeyF");
  assert.equal(signature(press("KeyF", { ctrlKey: true })), "Mod+KeyF");
  assert.equal(signature(press("KeyM", { metaKey: true, shiftKey: true })), "Mod+Shift+KeyM");
  assert.equal(signature(press("ArrowLeft", { altKey: true })), "Alt+ArrowLeft");
  assert.equal(signature(press("Space")), "Space");
});

test("a bare modifier is not a binding", () => {
  assert.equal(signature(press("MetaLeft", { metaKey: true })), null);
  assert.equal(signature(press("ShiftRight", { shiftKey: true })), null);
});

test("bindings read the way the interface writes them", () => {
  assert.equal(label("Mod+KeyF"), "⌘F");
  assert.equal(label("Mod+Shift+KeyM"), "⇧⌘M");
  assert.equal(label("Alt+Mod+KeyP"), "⌥⌘P");
  assert.equal(label("Alt+ArrowLeft"), "⌥←");
  assert.equal(label("Space"), "空格");
  assert.equal(label("Escape"), "Esc");
  assert.equal(label("Digit3"), "3");
});

test("Windows spells the same bindings out in full", () => {
  assert.equal(label("Mod+KeyF", "win"), "Ctrl+F");
  assert.equal(label("Mod+Shift+KeyM", "win"), "Ctrl+Shift+M");
  assert.equal(label("Mod+Comma", "win"), "Ctrl+,");
  assert.equal(label("Alt+ArrowLeft", "win"), "Alt+←");
  assert.equal(label("Space", "win"), "Space");
  assert.equal(label("Escape", "win"), "Esc");
});

test("the defaults are all distinct and none of them is a reserved combination", () => {
  const used = actions.map((action) => defaultBindings[action.id]);
  assert.equal(new Set(used).size, used.length);
  assert.equal(used.some(isReserved), false);
  assert.equal(isReserved("Mod+Comma"), true); // ⌘, belongs to the settings window
});

test("a combination already in use names its owner", () => {
  assert.equal(ownerOf(defaultBindings, "Mod+KeyF")?.id, "search");
  assert.equal(ownerOf(defaultBindings, "Mod+KeyF", "search"), null);
  assert.equal(ownerOf(defaultBindings, "Mod+KeyK"), null);
});

test("saved bindings merge over the defaults, one bad key at a time", () => {
  assert.deepEqual(readBindings(memory()), defaultBindings);
  assert.deepEqual(readBindings(memory({ "shiyin.shortcuts": "nonsense" })), defaultBindings);
  const saved = readBindings(
    memory({ "shiyin.shortcuts": '{"playPause":"Mod+KeyP","search":42}' }),
  );
  assert.equal(saved.playPause, "Mod+KeyP");
  assert.equal(saved.search, defaultBindings.search);
});

test("a rebound shortcut survives a round trip", () => {
  const storage = memory();
  const bindings: Bindings = { ...defaultBindings, playPause: "Mod+KeyP" };
  writeBindings(bindings, storage);
  assert.deepEqual(readBindings(storage), bindings);
});
