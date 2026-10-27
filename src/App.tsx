import { useEffect, useRef, useState } from "react";
import {
  Music2,
  Search,
  Heart,
  ListMusic,
  Plus,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Trash2,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  X,
  LoaderCircle,
} from "lucide-react";
import { Button } from "./components/ui/button";
import { Dialog, DialogContent } from "./components/ui/dialog";
import {
  Service,
  type Track,
  type Playlist,
  type Video,
  type Uploader,
  type Collection,
} from "./mygo";
import { usePlayer, trackKey, message } from "./player";
import { modes } from "./queue";
import { queryWithRetry } from "./query";
import { VideoResult } from "./VideoResult";
const time = (n: number) =>
  `${Math.floor(n / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(n % 60)
    .toString()
    .padStart(2, "0")}`;
type Browse =
  | { kind: "video" | "bili_user"; query: string }
  | { kind: "uploader"; uploader: Uploader; keyword?: string }
  | { kind: "collections"; uploader: Uploader }
  | { kind: "collection"; collection: Collection };
export default function App() {
  const [lists, setLists] = useState<Playlist[]>([]);
  const [view, setView] = useState("source");
  const [uploaderQuery, setUploaderQuery] = useState("");
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"video" | "bili_user">("video");
  const [browse, setBrowse] = useState<Browse>({ kind: "video", query: "" });
  const [videos, setVideos] = useState<Video[]>([]);
  const [uploaders, setUploaders] = useState<Uploader[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const loadSentinel = useRef<HTMLDivElement>(null);
  const fetchingPage = useRef(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [failedPage, setFailedPage] = useState<number | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const [libraryError, setLibraryError] = useState("");
  const [notice, setNotice] = useState("");
  const [selecting, setSelecting] = useState(false);
  const [knownTracks, setKnownTracks] = useState<Track[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [history, setHistory] = useState<
    {
      browse: Browse;
      videos: Video[];
      uploaders: Uploader[];
      collections: Collection[];
      page: number;
      more: boolean;
      scroll: number;
    }[]
  >([]);
  const [selected, setSelected] = useState<Track[]>([]);
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<"create" | "rename" | "delete" | null>(
    null,
  );
  const [listName, setListName] = useState("");
  const [target, setTarget] = useState("1");
  const request = useRef(0);
  const player = usePlayer();
  const active = lists.find((p) => p.id === view);
  function commit(next: Playlist[]) {
    setLists(next);
    if (!next.some((p) => p.id === target)) setTarget("1");
    player.sync(next);
  }
  function readLibrary() {
    void Service.library().then(
      (next) => {
        commit(next);
        setLibraryError("");
      },
      (err) => setLibraryError(message(err)),
    );
  }
  useEffect(() => {
    readLibrary();
    return () => {
      request.current++;
    };
  }, []);
  function mutate(
    operation: () => Promise<Playlist[]>,
    success: () => void = () => {},
  ) {
    if (saving) return;
    setSaving(true);
    setError("");
    void operation()
      .then(
        (next) => {
          commit(next);
          success();
        },
        (err) => setError(message(err)),
      )
      .finally(() => setSaving(false));
  }
  function fetchPage(next: Browse, p = 1) {
    const token = ++request.current;
    fetchingPage.current = true;
    setRetryAttempt(0);
    setView("source");
    setBrowse(next);
    if (next.kind === "uploader") setUploaderQuery(next.keyword ?? "");
    setLoading(true);
    setError("");
    setFailedPage(null);
    if (p === 1) {
      setKnownTracks([]);
      setVideos([]);
      setUploaders([]);
      setCollections([]);
      setPage(0);
      setMore(false);
    }
    if (next.kind === "collections") {
      void queryWithRetry(
        () => Service.collections(next.uploader.id, p),
        () => token === request.current,
        setRetryAttempt,
      )
        .then(
          (result) => {
            if (token !== request.current || !result) return;
            setCollections((prev) =>
              p === 1 ? result.items : [...prev, ...result.items],
            );
            setPage(p);
            setMore(result.hasMore);
          },
          (err) => {
            if (token === request.current) {
              setError(`查询失败（已请求 3 次）：${message(err)}`);
              setFailedPage(p);
            }
          },
        )
        .finally(() => {
          if (token === request.current) {
            fetchingPage.current = false;
            setLoading(false);
          }
        });
      return;
    }
    const operation = () =>
      next.kind === "uploader"
        ? Service.submissions(next.uploader.id, p, next.keyword ?? "")
        : next.kind === "collection"
          ? Service.collectionItems(next.collection, p)
          : Service.search(next.query, next.kind, p);
    void queryWithRetry(
      operation,
      () => token === request.current,
      setRetryAttempt,
    )
      .then(
        (result) => {
          if (token !== request.current || !result) return;
          setVideos((prev) =>
            p === 1
              ? result.videos
              : [
                  ...prev,
                  ...result.videos.filter(
                    (v) => !prev.some((old) => old.bv === v.bv),
                  ),
                ],
          );
          setUploaders((prev) =>
            p === 1
              ? result.uploaders
              : [
                  ...prev,
                  ...result.uploaders.filter(
                    (u) => !prev.some((old) => old.id === u.id),
                  ),
                ],
          );
          setPage(p);
          setMore(result.hasMore);
        },
        (err) => {
          if (token === request.current) {
            setError(`查询失败（已请求 3 次）：${message(err)}`);
            setFailedPage(p);
          }
        },
      )
      .finally(() => {
        if (token === request.current) {
          fetchingPage.current = false;
          setLoading(false);
        }
      });
  }
  useEffect(() => {
    const node = loadSentinel.current;
    if (!node || active || !page || !more || loading || failedPage !== null)
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !fetchingPage.current)
          fetchPage(browse, page + 1);
      },
      { rootMargin: "0px 0px 180px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [active, browse, page, more, loading, failedPage, view]);
  function browseTo(next: Browse) {
    setHistory((prev) => [
      ...prev,
      {
        browse,
        videos,
        uploaders,
        collections,
        page,
        more,
        scroll: window.scrollY,
      },
    ]);
    fetchPage(next);
    window.scrollTo(0, 0);
  }
  function goBack() {
    const previous = history.at(-1);
    if (!previous) return;
    request.current++;
    fetchingPage.current = false;
    setHistory((prev) => prev.slice(0, -1));
    setBrowse(previous.browse);
    if (previous.browse.kind === "uploader")
      setUploaderQuery(previous.browse.keyword ?? "");
    setVideos(previous.videos);
    setUploaders(previous.uploaders);
    setCollections(previous.collections);
    setPage(previous.page);
    setMore(previous.more);
    setLoading(false);
    setError("");
    setFailedPage(null);
    requestAnimationFrame(() => window.scrollTo(0, previous.scroll));
  }
  const destination = lists.find((p) => p.id === target);
  const isSaved = (t: Track) =>
    !!destination?.tracks.some((saved) => trackKey(saved) === trackKey(t));
  function collect(t: Track) {
    if (isSaved(t)) return;
    mutate(
      () => Service.addTracks(target, [t]),
      () => setNotice(`已加入「${destination?.name ?? "歌单"}」`),
    );
  }
  function toggle(t: Track) {
    setSelected((prev) =>
      prev.some((p) => trackKey(p) === trackKey(t))
        ? prev.filter((p) => trackKey(p) !== trackKey(t))
        : [...prev, t],
    );
  }
  function navigate(id: string) {
    request.current++;
    fetchingPage.current = false;
    setLoading(false);
    setView(id);
    if (!selected.length && id !== "source") setTarget(id);
    setFailedPage(null);
    setFilter("");
    setError("");
  }
  function playTrack(t: Track) {
    player.start(active ?? { id: "preview", name: "试听", tracks: [t] }, t);
  }
  const title =
    active?.name ??
    (browse.kind === "uploader" || browse.kind === "collections"
      ? browse.uploader.name
      : browse.kind === "collection"
        ? browse.collection.title
        : browse.query
          ? `“${browse.query}”`
          : "探索声音");
  const isSelected = (t: Track) =>
    selected.some((p) => trackKey(p) === trackKey(t));
  function trackRow(t: Track, index: number) {
    return (
      <div
        className={`track-row ${player.current && trackKey(player.current) === trackKey(t) ? "current" : ""}`}
        key={trackKey(t)}
      >
        {batchMode && (
          <label className="check">
            <input
              type="checkbox"
              checked={isSelected(t)}
              onChange={() => toggle(t)}
              aria-label={`选择 ${t.title}`}
            />
          </label>
        )}
        <div className="cover" aria-hidden="true">
          {t.cover ? (
            <img
              src={t.cover}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <Music2 size={21} />
          )}
        </div>
        <button className="track-title" onClick={() => playTrack(t)}>
          <strong title={t.title}>{t.title}</strong>
          <small>
            {t.uploader}
            {t.title !== t.videoTitle ? ` · P${t.part} · ${t.videoTitle}` : ""}
          </small>
        </button>
        <span className="duration">{time(t.duration)}</span>
        {active ? (
          <div className="row-actions">
            <Button
              variant="ghost"
              size="icon"
              disabled={saving || index === 0}
              aria-label={`上移 ${t.title}`}
              onClick={() =>
                mutate(() => Service.moveTrack(active.id, t.bv, t.cid, -1))
              }
            >
              <ArrowUp size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={saving || index === active.tracks.length - 1}
              aria-label={`下移 ${t.title}`}
              onClick={() =>
                mutate(() => Service.moveTrack(active.id, t.bv, t.cid, 1))
              }
            >
              <ArrowDown size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              disabled={saving}
              aria-label={`移除 ${t.title}`}
              onClick={() =>
                mutate(() => Service.removeTrack(active.id, t.bv, t.cid))
              }
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            disabled={saving || !destination || isSaved(t)}
            onClick={() => collect(t)}
            aria-label={`收藏 ${t.title}`}
          >
            <Heart size={17} fill={isSaved(t) ? "currentColor" : "none"} />
            {isSaved(t) ? "已收藏" : "收藏"}
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Music2 />
          <span>
            拾音<small>收藏喜欢的声音</small>
          </span>
        </div>

        <Button
          variant="ghost"
          className={`nav ${view === "source" ? "active" : ""}`}
          onClick={() => navigate("source")}
        >
          <Search size={18} />
          探索声音
        </Button>
        <div className="side-label heading">
          <span>我的歌单</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="新建歌单"
            disabled={!!libraryError}
            onClick={() => {
              setListName("");
              setDialog("create");
            }}
          >
            <Plus size={18} />
          </Button>
        </div>
        {lists.map((p) => (
          <Button
            key={p.id}
            variant="ghost"
            className={`nav ${view === p.id ? "active" : ""}`}
            onClick={() => navigate(p.id)}
          >
            {p.id === "1" ? <Heart size={18} /> : <ListMusic size={18} />}
            <span>{p.name}</span>
            <small>{p.tracks.length}</small>
          </Button>
        ))}
        <p className="sidebar-note">
          歌单保存在这台 Mac
          <br />
          播放时连接 B站
        </p>
      </aside>
      <main>
        <header>
          <form
            className="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) {
                setHistory([]);
                fetchPage({ kind, query: query.trim() });
              }
            }}
          >
            <Search size={18} />
            <input
              ref={searchInput}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索视频、UP 主"
              aria-label="搜索关键词"
            />
            <div className="search-types" aria-label="搜索类型">
              {(["video", "bili_user"] as const).map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant="ghost"
                  aria-pressed={kind === value}
                  onClick={() => {
                    setKind(value);
                    if (query.trim()) {
                      setHistory([]);
                      fetchPage({ kind: value, query: query.trim() });
                    }
                  }}
                >
                  {value === "video" ? "视频" : "UP 主"}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              type="submit"
              disabled={loading || !query.trim()}
            >
              搜索
            </Button>
          </form>
        </header>
        <section className="profile">
          {!active && history.length > 0 && (
            <Button variant="ghost" onClick={goBack} aria-label="返回上一级">
              <ArrowLeft size={18} />
              返回
            </Button>
          )}
          <div>
            <h1>{title}</h1>
            <p>
              {active
                ? `${active.tracks.length} 首 · 本地歌单`
                : browse.kind === "uploader"
                  ? browse.keyword
                    ? `投稿搜索「${browse.keyword}」 · 不限制分区`
                    : "按发布时间浏览投稿 · 不限制分区"
                  : browse.kind === "collection"
                    ? "从合集里挑选喜欢的歌曲"
                    : browse.kind === "bili_user"
                      ? "UP 主搜索结果"
                      : browse.kind === "video" && browse.query
                        ? "视频搜索结果 · 不限分区"
                        : "搜索视频或 UP 主，收藏喜欢的声音"}
            </p>
          </div>
        </section>
        {libraryError && (
          <div role="alert" className="error">
            资料库加载失败：{libraryError}
            <Button variant="ghost" onClick={readLibrary}>
              重新读取
            </Button>
          </div>
        )}
        <div className="toolbar">
          {active ? (
            <>
              <Button
                disabled={!active.tracks.length}
                onClick={() => player.start(active, active.tracks[0])}
              >
                <Play size={16} />
                播放歌单
              </Button>
              <Button
                variant="ghost"
                aria-pressed={batchMode}
                onClick={() => setBatchMode(!batchMode)}
              >
                {batchMode ? "结束多选" : "批量选择"}
              </Button>
              {active.id !== "1" && (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setListName(active.name);
                      setDialog("rename");
                    }}
                  >
                    重命名
                  </Button>
                  <Button variant="ghost" onClick={() => setDialog("delete")}>
                    删除歌单
                  </Button>
                </>
              )}
              <input
                className="filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="筛选歌单内歌曲"
                aria-label="筛选歌曲"
              />
            </>
          ) : (
            <>
              <span className="muted">
                {videos.length
                  ? `${videos.length} 个视频`
                  : uploaders.length
                    ? `${uploaders.length} 位 UP 主`
                    : collections.length
                      ? `${collections.length} 个合集`
                      : "不限制视频分区"}
              </span>
              {(browse.kind === "uploader" ||
                browse.kind === "collections") && (
                <>
                  <Button
                    variant={browse.kind === "uploader" ? "outline" : "ghost"}
                    onClick={() =>
                      fetchPage({ kind: "uploader", uploader: browse.uploader })
                    }
                  >
                    全部投稿
                  </Button>
                  <Button
                    variant={
                      browse.kind === "collections" ? "outline" : "ghost"
                    }
                    onClick={() =>
                      fetchPage({
                        kind: "collections",
                        uploader: browse.uploader,
                      })
                    }
                  >
                    合集与系列
                  </Button>
                </>
              )}
            </>
          )}
          {selected.length > 0 && (
            <span className="selection" role="status">
              已选 {selected.length} 首
            </span>
          )}
        </div>
        {!active && browse.kind === "uploader" && (
          <form
            className="uploader-search"
            onSubmit={(e) => {
              e.preventDefault();
              fetchPage({ ...browse, keyword: uploaderQuery.trim() });
            }}
          >
            <Search size={17} aria-hidden="true" />
            <input
              value={uploaderQuery}
              onChange={(e) => setUploaderQuery(e.target.value)}
              maxLength={100}
              placeholder={`搜索 ${browse.uploader.name} 的投稿`}
              aria-label="搜索该 UP 的投稿"
            />
            <Button type="submit" variant="outline" disabled={loading}>
              搜索投稿
            </Button>
            {(uploaderQuery || browse.keyword) && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => fetchPage({ ...browse, keyword: "" })}
              >
                清空
              </Button>
            )}
          </form>
        )}
        {error && (
          <div role="alert" className="error">
            {error}
            {view === "source" && failedPage !== null && (
              <Button
                variant="ghost"
                disabled={loading}
                onClick={() => fetchPage(browse, failedPage!)}
              >
                重试本页
              </Button>
            )}
          </div>
        )}
        {notice && (
          <div role="status" className="notice">
            {notice}
            <Button
              variant="ghost"
              size="icon"
              aria-label="关闭提示"
              onClick={() => setNotice("")}
            >
              <X size={16} />
            </Button>
          </div>
        )}
        {!active && (
          <div className="collection-toolbar">
            <label htmlFor="target-list">收藏到</label>
            <select
              id="target-list"
              value={target}
              disabled={saving}
              onChange={(e) => setTarget(e.target.value)}
            >
              {lists.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="muted">点标题播放</span>
            <Button
              variant={batchMode ? "outline" : "ghost"}
              aria-pressed={batchMode}
              onClick={() => {
                setBatchMode(!batchMode);
              }}
            >
              {batchMode ? "结束多选" : "批量选择"}
            </Button>
          </div>
        )}
        {batchMode && (
          <div className="batch-tools">
            <Button
              variant="ghost"
              disabled={
                selecting ||
                loading ||
                !(active?.tracks.length || videos.length)
              }
              onClick={async () => {
                setSelecting(true);
                const token = request.current;
                const candidates = active
                  ? active.tracks.filter((t) =>
                      `${t.title} ${t.videoTitle} ${t.uploader}`.includes(
                        filter,
                      ),
                    )
                  : [];
                try {
                  if (!active) {
                    for (const video of videos) {
                      if (request.current !== token) return;
                      const cached = knownTracks.filter(
                        (t) => t.bv === video.bv,
                      );
                      const detail = cached.length
                        ? null
                        : await queryWithRetry(
                            () => Service.detail(video.bv),
                            () => request.current === token,
                          );
                      const tracks = cached.length
                        ? cached
                        : (detail?.tracks ?? []);
                      if (request.current !== token) return;
                      candidates.push(...tracks);
                    }
                    setKnownTracks(candidates);
                  }
                  setSelected((prev) => [
                    ...prev,
                    ...candidates.filter(
                      (t) => !prev.some((s) => trackKey(s) === trackKey(t)),
                    ),
                  ]);
                } catch (err) {
                  setError(`批量读取失败：${message(err)}。原有选择已保留。`);
                } finally {
                  setSelecting(false);
                }
              }}
            >
              {selecting
                ? "正在读取分 P…"
                : active
                  ? "全选筛选结果"
                  : "全选已加载视频（含分 P）"}
            </Button>
            <span className="muted">只处理当前已加载的结果，不自动翻页</span>
          </div>
        )}
        <div className="workspace">
          <section className="results" aria-label="曲目与投稿">
            {active ? (
              active.tracks
                .filter((t) =>
                  `${t.title} ${t.videoTitle} ${t.uploader}`.includes(filter),
                )
                .map((t) => trackRow(t, active.tracks.indexOf(t)))
            ) : (
              <>
                {uploaders.map((u) => (
                  <div className="up-card" key={u.id}>
                    <div className="cover">
                      {u.avatar ? (
                        <img
                          src={u.avatar}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Music2 />
                      )}
                    </div>
                    <div>
                      <strong>{u.name}</strong>
                      <small>UID {u.id}</small>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        browseTo({ kind: "uploader", uploader: u })
                      }
                    >
                      查看投稿
                    </Button>
                  </div>
                ))}
                {collections.map((c) => (
                  <div className="up-card" key={`${c.kind}:${c.id}`}>
                    <ListMusic />
                    <div>
                      <strong>{c.title}</strong>
                      <small>
                        {c.kind === "season" ? "视频合集" : "投稿系列"}
                      </small>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        browseTo({ kind: "collection", collection: c })
                      }
                    >
                      展开合集
                    </Button>
                  </div>
                ))}
                {videos.map((v) => (
                  <VideoResult
                    key={v.bv}
                    video={v}
                    selected={selected}
                    onSelect={toggle}
                    onDetail={(tracks) =>
                      setKnownTracks((prev) => [
                        ...prev.filter((t) => t.bv !== v.bv),
                        ...tracks,
                      ])
                    }
                    batchMode={batchMode}
                    onCollect={collect}
                    savedTracks={destination?.tracks ?? []}
                    saving={saving || !destination}
                    onPlay={playTrack}
                    onCollection={(collection) =>
                      browseTo({ kind: "collection", collection })
                    }
                    renderTrack={trackRow}
                  />
                ))}
              </>
            )}
            {loading && (
              <div role="status" className="empty">
                <LoaderCircle className="spin" />
                {retryAttempt
                  ? `请求失败，正在重试（第 ${retryAttempt}/3 次）…`
                  : "正在加载…"}
              </div>
            )}
            {!loading &&
              !error &&
              (active
                ? active.tracks.filter((t) =>
                    `${t.title} ${t.videoTitle} ${t.uploader}`.includes(filter),
                  ).length === 0
                : !videos.length &&
                  !uploaders.length &&
                  !collections.length) && (
                <div className="empty">
                  <Music2 size={35} />
                  <h2>
                    {active
                      ? filter
                        ? "没有匹配的歌曲"
                        : "歌单还是空的"
                      : page
                        ? "没有找到相关内容"
                        : "从一首喜欢的歌开始"}
                  </h2>
                  <p>
                    {active
                      ? filter
                        ? "换个关键词，或清除筛选查看全部歌曲。"
                        : "搜索喜欢的歌曲，选中后加入这张歌单。"
                      : page
                        ? "当前结果为空。试试别的关键词。"
                        : "输入关键词搜索；所有分区的视频都可以选。"}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (active && filter) setFilter("");
                      else {
                        navigate("source");
                        searchInput.current?.focus();
                      }
                    }}
                  >
                    {active && filter ? "清除筛选" : "搜索歌曲"}
                  </Button>
                </div>
              )}
            {!active && page > 0 && (
              <div
                className="pagination"
                ref={loadSentinel}
                role="status"
                aria-live="polite"
              >
                {!loading &&
                  (failedPage !== null ? (
                    <>
                      <span>加载下一页失败，已请求 3 次；已有结果已保留。</span>
                      <Button
                        variant="outline"
                        onClick={() => fetchPage(browse, failedPage)}
                      >
                        重新尝试
                      </Button>
                    </>
                  ) : more ? (
                    "继续向下滚动，自动加载"
                  ) : (
                    "已显示全部结果"
                  ))}
              </div>
            )}
          </section>
          {selected.length > 0 && (
            <aside className="basket" aria-label="选曲篮">
              <div className="heading">
                <h2>
                  已选 <span>{selected.length}</span>
                </h2>
                <Button
                  variant="ghost"
                  disabled={!selected.length || saving}
                  onClick={() => setSelected([])}
                >
                  清空
                </Button>
              </div>

              <select
                aria-label="批量收藏到"
                value={target}
                disabled={saving}
                onChange={(e) => setTarget(e.target.value)}
              >
                {lists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Button
                className="basket-save"
                disabled={!lists.length || saving}
                onClick={() => {
                  const batch = [...selected];
                  const destination = lists.find((p) => p.id === target);
                  mutate(
                    () => Service.addTracks(target, batch),
                    () => {
                      setSelected((prev) =>
                        prev.filter(
                          (t) =>
                            !batch.some((b) => trackKey(b) === trackKey(t)),
                        ),
                      );
                      setNotice(`已加入「${destination?.name ?? "歌单"}」`);
                    },
                  );
                }}
              >
                {saving ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <Plus size={16} />
                )}{" "}
                {saving ? "保存中…" : `加入 ${selected.length} 首`}
              </Button>
            </aside>
          )}
        </div>
      </main>
      <footer className="player">
        <div className="now">
          <div className="cover">
            {player.current?.cover ? (
              <img
                src={player.current.cover}
                alt=""
                referrerPolicy="no-referrer"
              />
            ) : (
              <Music2 />
            )}
          </div>
          <div>
            <strong>{player.current?.title ?? "还没有播放"}</strong>
            <small>
              {player.current
                ? `${player.current.uploader}${player.current.title !== player.current.videoTitle ? ` · P${player.current.part}` : ""}${player.mixed ? " · 仅播放声音" : ""}`
                : "选择一首喜欢的声音"}
            </small>
          </div>
        </div>
        <div className="transport">
          <div className="transport-buttons">
            <Button
              variant="ghost"
              size="icon"
              aria-label="上一首"
              disabled={!player.current}
              onClick={player.previous}
            >
              <SkipBack size={19} />
            </Button>
            <Button
              className="play-button"
              size="icon"
              aria-label={
                player.loading ? "取消加载" : player.playing ? "暂停" : "播放"
              }
              disabled={!player.current}
              onClick={player.toggle}
            >
              {player.loading ? (
                <LoaderCircle className="spin" size={19} />
              ) : player.playing ? (
                <Pause size={19} />
              ) : (
                <Play size={19} />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="下一首"
              disabled={!player.current}
              onClick={player.next}
            >
              <SkipForward size={19} />
            </Button>
          </div>
          <div className="seek">
            <span>{time(player.elapsed)}</span>
            <input
              type="range"
              aria-label="播放进度"
              min="0"
              max={player.duration || 1}
              value={player.elapsed}
              onChange={(e) => player.seek(Number(e.target.value))}
            />
            <span>{time(player.duration)}</span>
          </div>
        </div>
        <div className="player-options">
          <label className="sr-only" htmlFor="mode">
            播放模式
          </label>
          <select
            id="mode"
            value={player.mode}
            onChange={(e) =>
              player.changeMode(modes.find((m) => m === e.target.value)!)
            }
          >
            {modes.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
          <Volume2 size={18} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={player.volume}
            onChange={(e) => player.changeVolume(Number(e.target.value))}
            aria-label="音量"
          />
        </div>
        {player.error && (
          <div className="player-error" role="alert">
            {player.error}
            <Button variant="ghost" onClick={player.retry}>
              重试
            </Button>
          </div>
        )}
      </footer>
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open && !saving) setDialog(null);
        }}
      >
        <DialogContent
          title={
            dialog === "create"
              ? "新建歌单"
              : dialog === "rename"
                ? "重命名歌单"
                : "删除歌单"
          }
          description={
            dialog === "delete"
              ? `删除「${active?.name}」及其收录关系，其他歌单不受影响。`
              : "名称最多 80 个字符。"
          }
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (dialog === "create" || active) {
                const action =
                  dialog === "create"
                    ? "create"
                    : dialog === "rename"
                      ? "rename"
                      : "delete";
                mutate(
                  () => Service.editList(active?.id ?? "", listName, action),
                  () => {
                    setDialog(null);
                    if (action === "delete") navigate("1");
                  },
                );
              }
            }}
          >
            {dialog !== "delete" && (
              <input
                className="dialog-input"
                autoFocus
                aria-label="歌单名称"
                maxLength={80}
                value={listName}
                onChange={(e) => setListName(e.target.value)}
              />
            )}
            <div className="dialog-actions">
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => setDialog(null)}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={saving}
                variant={dialog === "delete" ? "destructive" : "default"}
              >
                {saving ? "保存中…" : "确认"}
              </Button>
            </div>
            {error && (
              <p role="alert" className="text-red-700 mt-3">
                {error}
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
