/** The keyboard shortcuts the owner can rebind, and the bindings themselves. */
export type ActionID =
  | "playPause"
  | "previous"
  | "next"
  | "mute"
  | "search"
  | "clearFilter";

export type Action = { id: ActionID; label: string };

export const actions: Action[] = [
  { id: "playPause", label: "播放 / 暂停" },
  { id: "previous", label: "上一首" },
  { id: "next", label: "下一首" },
  { id: "mute", label: "静音 / 取消静音" },
  { id: "search", label: "聚焦搜索框" },
  { id: "clearFilter", label: "退出输入 / 清除筛选" },
];

export type Bindings = Record<ActionID, string>;

/** Which window system the interface is running on, as far as labels go. */
export const windows = typeof navigator !== "undefined" && /Windows/i.test(navigator.userAgent);

/**
 * Alt+←/→ move by a word on Windows and the tab strip of a browser, so there
 * Ctrl+←/→ skip tracks; ⌥←/→ are free on macOS.
 */
export const defaultBindings: Bindings = {
  playPause: "Space",
  previous: windows ? "Mod+ArrowLeft" : "Alt+ArrowLeft",
  next: windows ? "Mod+ArrowRight" : "Alt+ArrowRight",
  mute: "Mod+Shift+KeyM",
  search: "Mod+KeyF",
  clearFilter: "Escape",
};

/** Combinations the window answers before the page ever sees them. */
const reserved = new Set([
  "Mod+KeyQ",
  "Mod+KeyW",
  "Mod+KeyH",
  "Mod+KeyM",
  "Mod+Tab",
  "Mod+Space",
  "Mod+Comma",
]);

const modifierCodes = new Set([
  "MetaLeft",
  "MetaRight",
  "ControlLeft",
  "ControlRight",
  "AltLeft",
  "AltRight",
  "ShiftLeft",
  "ShiftRight",
  "CapsLock",
  "Fn",
]);

type Key = Pick<KeyboardEvent, "metaKey" | "ctrlKey" | "altKey" | "shiftKey" | "code">;

/**
 * One canonical string per combination, so two presses compare by equality:
 * "Space", "Mod+KeyF", "Alt+ArrowLeft". Null while only modifiers are down.
 */
export function signature(event: Key) {
  if (!event.code || modifierCodes.has(event.code)) return null;
  const parts: string[] = [];
  if (event.metaKey || event.ctrlKey) parts.push("Mod");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  parts.push(event.code);
  return parts.join("+");
}

export function isReserved(pressed: string) {
  return reserved.has(pressed);
}

const keyNames: Record<string, string> = {
  Space: "空格",
  Escape: "Esc",
  ArrowLeft: "←",
  ArrowRight: "→",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Enter: "↩",
  Backspace: "⌫",
  Delete: "⌦",
  Tab: "⇥",
  Home: "↖",
  End: "↘",
  PageUp: "⇞",
  PageDown: "⇟",
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Comma: ",",
  Period: ".",
  Slash: "/",
  Backquote: "`",
};

/** Keys Windows names in words rather than glyphs; macOS keeps its symbols. */
const windowsKeys: Record<string, string> = {
  Space: "Space",
  Enter: "Enter",
  Backspace: "Backspace",
  Delete: "Del",
  Tab: "Tab",
  Home: "Home",
  End: "End",
  PageUp: "PageUp",
  PageDown: "PageDown",
};

// macOS writes ⌃⌥⇧⌘ (so ⌘ sits last); Windows writes Ctrl+Alt+Shift (so the
// Mod that Windows spells Ctrl comes first).
const orders = { mac: ["Ctrl", "Alt", "Shift", "Mod"], win: ["Mod", "Alt", "Shift", "Ctrl"] } as const;
type Modifier = "Ctrl" | "Alt" | "Shift" | "Mod";

const modifierNames: Record<"mac" | "win", Record<Modifier, string>> = {
  // macOS writes ⌃⌥⇧⌘ then the key, with no separator: ⇧⌘M.
  mac: { Ctrl: "⌃", Alt: "⌥", Shift: "⇧", Mod: "⌘" },
  // Windows writes Ctrl+Alt+Shift then the key, always spelled out.
  win: { Ctrl: "Ctrl", Alt: "Alt", Shift: "Shift", Mod: "Ctrl" },
};

function keyName(code: string, platform: "mac" | "win") {
  if (platform === "win" && windowsKeys[code]) return windowsKeys[code];
  if (keyNames[code]) return keyNames[code];
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  return code;
}

/**
 * How a binding reads in the interface: ⇧⌘M and ⌥← on macOS, Ctrl+Shift+M and
 * Ctrl+← on Windows. The platform can be passed for tests.
 */
export function label(binding: string, platform: "mac" | "win" = windows ? "win" : "mac") {
  const parts = binding.split("+");
  const code = parts[parts.length - 1] ?? "";
  const names = modifierNames[platform];
  const modifiers = orders[platform]
    .filter((modifier) => parts.includes(modifier))
    .map((modifier) => names[modifier]);
  const separator = platform === "win" ? "+" : "";
  return [...modifiers, keyName(code, platform)].join(separator);
}

/** Which action already answers to this combination, if any. */
export function ownerOf(bindings: Bindings, pressed: string, except?: ActionID) {
  return actions.find((action) => action.id !== except && bindings[action.id] === pressed) ?? null;
}

const key = "shiyin.shortcuts";

export function readBindings(storage: Storage = localStorage): Bindings {
  try {
    const saved = JSON.parse(storage.getItem(key) ?? "null");
    const bindings = { ...defaultBindings };
    for (const action of actions) {
      const value = saved?.[action.id];
      if (typeof value === "string" && value) bindings[action.id] = value;
    }
    return bindings;
  } catch {
    return { ...defaultBindings };
  }
}

export function writeBindings(bindings: Bindings, storage: Storage = localStorage) {
  try {
    storage.setItem(key, JSON.stringify(bindings));
  } catch {
    // a shortcut that cannot be saved still works for this launch
  }
}
