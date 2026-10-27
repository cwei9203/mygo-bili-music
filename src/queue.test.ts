import { test } from "node:test";
import assert from "node:assert/strict";
import { Queue } from "./queue.ts";
test("shuffle visits every item once and starts another full round", () => {
  const q = new Queue();
  q.start(["a", "b", "c"], "a");
  q.setMode("随机播放");
  assert.equal(new Set(["a", q.next(true), q.next(true)]).size, 3);
  assert.equal(new Set([q.next(true), q.next(true), q.next(true)]).size, 3);
});
test("live edit preserves current, adds unplayed, removes current immediately", () => {
  const q = new Queue();
  q.start(["a", "b"], "a");
  q.setMode("随机播放");
  assert.equal(q.sync(["b", "a", "c"]), false);
  assert.equal(q.current, "a");
  assert.equal(q.sync(["b", "c"]), true);
  assert.ok(["b", "c"].includes(q.current!));
  q.sync([]);
  assert.equal(q.current, null);
});
test("sequential ends; single loop only repeats on natural end", () => {
  const q = new Queue();
  q.start(["a", "b"], "b");
  assert.equal(q.next(true), null);
  q.setMode("单曲循环");
  assert.equal(q.next(true), "b");
  assert.equal(q.next(false), "a");
});
