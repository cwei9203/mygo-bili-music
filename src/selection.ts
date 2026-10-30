import type { Track } from "./mygo";

// A group toggles off only when every member is selected.
export function toggleTracks(selected: Track[], tracks: Track[]) {
  const keys = new Set(tracks.map((t) => `${t.bv}:${t.cid}`));
  const existing = new Set(selected.map((t) => `${t.bv}:${t.cid}`));
  return tracks.every((t) => existing.has(`${t.bv}:${t.cid}`))
    ? selected.filter((t) => !keys.has(`${t.bv}:${t.cid}`))
    : [...selected, ...tracks.filter((t) => !existing.has(`${t.bv}:${t.cid}`))];
}
