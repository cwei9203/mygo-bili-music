import { test } from "node:test";
import assert from "node:assert/strict";
import { collectionTracks, searchCollections } from "./collection.ts";
import type { Track } from "./mygo";

const collection = { id: "1", mid: "2", title: "孤独摇滚", kind: "season", cover: "", count: null };
const track = (bv: string, cid: string): Track => ({
  bv, cid, title: cid, videoTitle: bv, uploader: "Aki惊蛰",
  cover: "", duration: 10, part: 1,
});

test("reads all pages and parts, deduplicates videos and tracks", async () => {
  const pages: number[] = [];
  const details: string[] = [];
  const progress: string[] = [];
  const result = await collectionTracks(collection, {
    collectionItems: async (_, page) => {
      pages.push(page);
      return {
        page, hasMore: page === 1, uploaders: [],
        videos: (page === 1 ? ["a"] : ["a", "b"]).map((bv) => ({
          bv, title: bv, uploader: "", cover: "", duration: "", views: null,
        })),
      };
    },
    detail: async (bv) => {
      details.push(bv);
      return { collection: null, tracks: [track(bv, "1"), track(bv, "2"), track(bv, "1")] };
    },
  }, (text) => progress.push(text));
  assert.deepEqual(pages, [1, 2]);
  assert.deepEqual(details, ["a", "b"]);
  assert.deepEqual(result.map((t) => t.bv + t.cid), ["a1", "a2", "b1", "b2"]);
  assert.match(progress.at(-1)!, /2\/2/);
});

test("detail failure rejects the whole result instead of returning partial tracks", async () => {
  await assert.rejects(collectionTracks(collection, {
    collectionItems: async () => ({
      page: 1, hasMore: false, uploaders: [],
      videos: ["a", "b"].map((bv) => ({ bv, title: bv, uploader: "", cover: "", duration: "", views: null })),
    }),
    detail: async (bv) => {
      if (bv === "b") throw new Error("blocked");
      return { collection: null, tracks: [track(bv, "1")] };
    },
  }, () => {}), /blocked/);
});

test("empty collection does not read details", async () => {
  assert.deepEqual(await collectionTracks(collection, {
    collectionItems: async () => ({ page: 1, hasMore: false, uploaders: [], videos: [] }),
    detail: async () => { throw new Error("unexpected detail"); },
  }, () => {}), []);
});

test("cancellation during a detail request returns no partial result and stops further reads", async () => {
  const controller = new AbortController();
  let calls = 0;
  await assert.rejects(collectionTracks(collection, {
    collectionItems: async () => ({
      page: 1, hasMore: false, uploaders: [],
      videos: ["a", "b"].map((bv) => ({bv,title:bv,uploader:"",cover:"",duration:"",views:null})),
    }),
    detail: async (bv) => {
      calls++;
      controller.abort();
      return { collection: null, tracks: [track(bv,"1")] };
    },
  }, () => {}, controller.signal), {name:"AbortError"});
  assert.equal(calls,1);
});

test("collection search finds titles on later pages and ignores case", async () => {
  const pages: number[] = [];
  const found = await searchCollections("2", "GIRLS", async (_, page) => {
    pages.push(page);
    return {hasMore:page===1,items:[{...collection,id:String(page),title:page===1?"其他":"girls band cry"}]};
  }, () => true);
  assert.deepEqual(pages,[1,2]);
  assert.equal(found[0].id,"2");
});

test("collection search drops stale results", async () => {
  let current=true;
  const found=await searchCollections("2","孤独",async()=> {
    current=false;
    return {hasMore:true,items:[collection]};
  },()=>current);
  assert.deepEqual(found,[]);
});
