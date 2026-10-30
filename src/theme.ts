/** Appearance. Until the user picks one, the machine decides and the page follows it live. */
export type Theme = "light" | "dark";
export type Preference = Theme | null;

const key = "shiyin.theme";

/** A stored choice wins; `null` means the OS appearance is still in charge. */
export function readPreference(storage: Storage = localStorage): Preference {
  const stored = storage.getItem(key);
  return stored === "light" || stored === "dark" ? stored : null;
}

export function applyPreference(preference: Preference, storage: Storage = localStorage) {
  const root = document.documentElement;
  if (preference) {
    root.setAttribute("data-theme", preference);
    storage.setItem(key, preference);
  } else {
    root.removeAttribute("data-theme");
    storage.removeItem(key);
  }
}
