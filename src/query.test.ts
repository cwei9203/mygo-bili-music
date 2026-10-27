import { test } from "node:test";
import assert from "node:assert/strict";
import { queryWithRetry } from "./query.ts";

test("queries stop after exactly three failed requests", async () => {
  let calls = 0;
  const attempts: number[] = [];
  await assert.rejects(
    queryWithRetry(
      async () => {
        calls++;
        throw new Error("412");
      },
      () => true,
      (n) => attempts.push(n),
    ),
    /412/,
  );
  assert.equal(calls, 3);
  assert.deepEqual(attempts, [2, 3]);
});
test("a successful retry stops further requests", async () => {
  let calls = 0;
  const result = await queryWithRetry(
    async () => {
      if (++calls < 2) throw new Error("412");
      return "page";
    },
    () => true,
  );
  assert.equal(result, "page");
  assert.equal(calls, 2);
});
test("navigation during backoff cancels remaining retries", async () => {
  let current = true;
  let calls = 0;
  const result = await queryWithRetry(
    async () => {
      calls++;
      throw new Error("412");
    },
    () => current,
    () => {
      current = false;
    },
  );
  assert.equal(result, undefined);
  assert.equal(calls, 1);
});
test("stale successful responses are discarded", async () => {
  let current = true;
  assert.equal(
    await queryWithRetry(
      async () => {
        current = false;
        return "old page";
      },
      () => current,
    ),
    undefined,
  );
});
