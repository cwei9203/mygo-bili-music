import { queryWithRetry } from "./query";
import type { Collection, CollectionPage, Detail, SearchPage, Track } from "./mygo";

// Resolve every page before the caller writes anything to the library.
export async function collectionTracks(
  collection: Collection,
  source: {
    collectionItems: (collection: Collection, page: number) => Promise<SearchPage>;
    detail: (bv: string) => Promise<Detail>;
  },
  onProgress: (text: string) => void,
  signal = new AbortController().signal,
) {
  const videos = new Set<string>();
  let page = 1;
  let more = true;
  while (more) {
    onProgress(`正在读取「${collection.title}」第 ${page} 页…`);
    signal.throwIfAborted();
    const result = await queryWithRetry(
      () => source.collectionItems(collection, page),
      () => !signal.aborted,
      (attempt) => onProgress(`正在重试第 ${page} 页（${attempt}/3）…`),
    );
    signal.throwIfAborted();
    if (!result) return [];
    page++;
    result.videos.forEach((video) => videos.add(video.bv));
    more = result.hasMore;
  }
  const tracks = new Map<string, Track>();
  let done = 0;
  for (const bv of videos) {
    onProgress(`正在读取「${collection.title}」分 P（${++done}/${videos.size}）…`);
    signal.throwIfAborted();
    const detail = await queryWithRetry(
      () => source.detail(bv),
      () => !signal.aborted,
      (attempt) => onProgress(`正在重试歌曲 ${done}/${videos.size}（${attempt}/3）…`),
    );
    signal.throwIfAborted();
    if (!detail) return [];
    detail.tracks.forEach((track) => tracks.set(`${track.bv}:${track.cid}`, track));
  }
  return [...tracks.values()];
}


// Search every collection page so a match is not hidden behind infinite scrolling.
export async function searchCollections(
  mid: string,
  keyword: string,
  read: (mid: string, page: number) => Promise<CollectionPage>,
  isCurrent: () => boolean,
) {
  const matches: Collection[] = [];
  let page = 1;
  let more = true;
  while (more && isCurrent()) {
    const result = await queryWithRetry(() => read(mid, page), isCurrent);
    if (!result) return [];
    matches.push(...result.items.filter((c) => c.title.toLocaleLowerCase().includes(keyword.toLocaleLowerCase())));
    more = result.hasMore;
    page++;
  }
  return isCurrent() ? matches : [];
}
