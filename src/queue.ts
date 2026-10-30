export type Mode = "顺序播放" | "列表循环" | "单曲循环" | "随机播放";
export const modes: Mode[] = ["顺序播放", "列表循环", "单曲循环", "随机播放"];
export function shuffled<T>(items: T[], random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export class Queue {
  ids: string[] = [];
  current: string | null = null;
  mode: Mode;
  constructor(savedMode: string | null = null) {
    this.mode = modes.find((mode) => mode === savedMode) ?? "顺序播放";
  }
  remaining: string[] = [];
  visited = new Set<string>();
  history: string[] = [];
  start(ids: string[], current: string) {
    this.ids = [...ids];
    this.current = current;
    this.history = [];
    this.resetRound();
  }
  resetRound() {
    this.visited = new Set(this.current ? [this.current] : []);
    this.remaining = shuffled(this.ids.filter((id) => id !== this.current));
  }
  setMode(mode: Mode) {
    this.mode = mode;
    this.resetRound();
  }
  sync(ids: string[]) {
    const previous = this.current;
    const oldIndex = this.ids.indexOf(previous ?? "");
    this.ids = [...ids];
    this.remaining = this.remaining.filter((id) => ids.includes(id));
    const added = ids.filter(
      (id) => !this.visited.has(id) && !this.remaining.includes(id),
    );
    this.remaining = shuffled([...this.remaining, ...added]);
    if (previous && !ids.includes(previous)) {
      this.current = null;
      if (ids.length) {
        this.current =
          this.mode === "随机播放"
            ? (this.remaining.shift() ?? shuffled(ids)[0])
            : ids[Math.min(oldIndex, ids.length - 1)];
        this.visited.add(this.current);
        this.remaining = this.remaining.filter((id) => id !== this.current);
      }
    }
    if (!ids.length) this.current = null;
    return previous !== this.current;
  }
  next(ended = false) {
    if (!this.ids.length) return null;
    if (ended && this.mode === "单曲循环") return this.current;
    if (this.current) this.history.push(this.current);
    if (this.mode === "随机播放") {
      if (!this.remaining.length) {
        this.remaining = shuffled(this.ids);
        this.visited.clear();
      }
      this.current = this.remaining.shift() ?? null;
      if (this.current) this.visited.add(this.current);
      return this.current;
    }
    const index = this.ids.indexOf(this.current ?? "");
    if (index === this.ids.length - 1 && this.mode === "顺序播放") return null;
    this.current = this.ids[(index + 1) % this.ids.length];
    return this.current;
  }
  previous() {
    if (!this.ids.length) return null;
    if (this.mode === "随机播放") {
      let id = this.history.pop();
      while (id && !this.ids.includes(id)) id = this.history.pop();
      if (id) this.current = id;
      return this.current;
    }
    const index = this.ids.indexOf(this.current ?? "");
    this.current = this.ids[Math.max(0, index - 1)];
    return this.current;
  }
}
