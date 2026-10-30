/** Preferences that belong to the room rather than to the library. */
export type Settings = {
  /** Put the last selected track back in the player on launch. */
  resume: boolean;
  /** Stop the bloom, the bars and every transition, whatever the system prefers. */
  calm: boolean;
};

export const defaultSettings: Settings = { resume: true, calm: false };

const key = "shiyin.settings";

export function readSettings(storage: Storage = localStorage): Settings {
  try {
    const saved = JSON.parse(storage.getItem(key) ?? "null");
    return {
      resume: typeof saved?.resume === "boolean" ? saved.resume : defaultSettings.resume,
      calm: typeof saved?.calm === "boolean" ? saved.calm : defaultSettings.calm,
    };
  } catch {
    return defaultSettings;
  }
}

export function writeSettings(settings: Settings, storage: Storage = localStorage) {
  try {
    storage.setItem(key, JSON.stringify(settings));
  } catch {
    // a preference that cannot be saved must not break the window
  }
}

/** The calm switch is an attribute on the root, so CSS owns what it turns off. */
export function applyMotion(settings: Settings, root: HTMLElement = document.documentElement) {
  if (settings.calm) root.setAttribute("data-motion", "calm");
  else root.removeAttribute("data-motion");
}
