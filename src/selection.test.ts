import { test } from "node:test";
import assert from "node:assert/strict";
import { toggleTracks } from "./selection.ts";
import type { Track } from "./mygo";
const track = (cid: string): Track => ({bv:"BV1xx411c7mD",cid,title:cid,videoTitle:"Album",uploader:"UP",cover:"",duration:10,part:1});
test("group selection fills partial groups, removes complete groups, and preserves unrelated tracks", () => {
  const a=track("1"), b=track("2"), other=track("3");
  assert.deepEqual(toggleTracks([a,other],[a,b]),[a,other,b]);
  assert.deepEqual(toggleTracks([a,b,other],[a,b]),[other]);
  assert.deepEqual(toggleTracks([],[a,b]),[a,b]);
});
