import { useEffect, useRef, useState } from "react";
import {
  Search,
  Heart,
  ListMusic,
  Plus,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Trash2,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  X,
  LoaderCircle,
  Sun,
  Command,
  Info,
  Settings as SettingsIcon,
} from "lucide-react";
import { ChoiceMenu } from "./components/ui/choice-menu";
import { AppIcon, CassetteMark } from "./logo";
import { Button } from "./components/ui/button";
import { Dialog, DialogContent, DialogWindow } from "./components/ui/dialog";
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
import { collectionTracks, searchCollections } from "./collection";
import { toggleTracks } from "./selection";
import { applyPreference, readPreference } from "./theme";
import { applyMotion, readSettings, writeSettings } from "./settings";
import {
  actions as shortcutActions,
  defaultBindings,
  isReserved,
  label as bindingLabel,
  ownerOf,
  readBindings,
  signature,
  writeBindings,
  type ActionID,
} from "./shortcuts";
const time = (n: number) =>
  `${Math.floor(n / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(n % 60)
    .toString()
    .padStart(2, "0")}`;

/** The room's only moving signal: three bars for the row that is currently sounding. */
function Bars({ on }: { on: boolean }) {
  return (
    <span className="bars" data-on={on ? "true" : "false"} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}
/** The preferences window's sections, in sidebar order. */
const prefsPages = [
  { id: "appearance", label: "外观", icon: Sun },
  { id: "playback", label: "播放", icon: Play },
  { id: "shortcuts", label: "快捷键", icon: Command },
  { id: "about", label: "关于", icon: Info },
] as const;
type PrefsPage = (typeof prefsPages)[number]["id"];
type Browse =
  | { kind: "video" | "bili_user"; query: string }
  | { kind: "uploader"; uploader: Uploader; keyword?: string }
  | { kind: "collections"; uploader: Uploader; keyword?: string }
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
  const [library, setLibrary] = useState("");
  const [notice, setNotice] = useState("");
  const [undo, setUndo] = useState<{ listID: string; track: Track; index: number } | null>(null);
  const [collectionError, setCollectionError] = useState("");
  const importController = useRef<AbortController | null>(null);
  const [importStage, setImportStage] = useState<"reading" | "cancelling" | "saving" | null>(null);
  const dialogTrigger = useRef<HTMLElement | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [importProgress, setImportProgress] = useState("");
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
  const [dialog, setDialog] = useState<"create" | "rename" | "delete" | "settings" | null>(
    null,
  );
  const [listName, setListName] = useState("");
  const [target, setTarget] = useState("1");
  const request = useRef(0);
  const player = usePlayer();
  const [preference, setPreference] = useState(readPreference);
  const [settings, setSettings] = useState(readSettings);
  const [bindings, setBindings] = useState(readBindings);
  const [recording, setRecording] = useState<ActionID | null>(null);
  const [shortcutError, setShortcutError] = useState("");
  const [prefsPage, setPrefsPage] = useState<PrefsPage>("appearance");
  const [discover, setDiscover] = useState<Video[]>([]);
  const [discoverStatus, setDiscoverStatus] = useState<"idle" | "loading" | "error">("idle");
  const [discoverError, setDiscoverError] = useState("");
  // The newest player state for the global shortcuts, which subscribe once.
  const playerRef = useRef(player);
  useEffect(() => {
    playerRef.current = player;
  });
  const active = lists.find((p) => p.id === view);
  // The playlist dialogs and the settings dialog share one open/closed state.
  const playlistDialog =
    dialog === "create" || dialog === "rename" || dialog === "delete" ? dialog : null;
  // The playlist the player is running, when it still exists in the library.
  const sourceList = lists.find((p) => p.id === player.sourceID);
  const collectionView = !active && browse.kind === "collection";
  const selectionMode = batchMode || collectionView;
  const hasSourceItems = videos.length > 0 || collections.length > 0;
  const isHome = !active && browse.kind === "video" && !browse.query;
  const pageArt = active?.tracks.find((t) => t.cover)?.cover ?? "";
  const heroCovers = active
    ? [...new Set(active.tracks.map((t) => t.cover).filter(Boolean))].slice(0, 4)
    : [];
  const heroMosaic = heroCovers.length >= 4;
  // The room takes its colour from the page's artwork, or from whatever is playing.
  const roomArt = (active ? pageArt : "") || player.current?.cover || "";
  const resultCount = videos.length
    ? `${videos.length} 个视频`
    : uploaders.length
      ? `${uploaders.length} 位 UP 主`
      : collections.length
        ? `${collections.length} 个合集${more ? " · 继续滚动查看更多" : ""}`
        : loading
          ? "正在查找…"
          : "";
  const heroMinutes = active
    ? Math.round(active.tracks.reduce((sum, t) => sum + t.duration, 0) / 60)
    : 0;
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => { setNotice(""); }, [view, browse]);
  function loadDiscover() {
    setDiscoverStatus("loading");
    setDiscoverError("");
    void Service.discover().then(
      (items) => {
        setDiscover(items);
        setDiscoverStatus("idle");
      },
      (err) => {
        setDiscoverError(`音乐区热门获取失败：${message(err)}`);
        setDiscoverStatus("error");
      },
    );
  }
  useEffect(() => {
    if (isHome && !discover.length && discoverStatus === "idle") loadDiscover();
  }, [isHome]);
  useEffect(() => { applyPreference(preference); }, [preference]);
  useEffect(() => {
    writeSettings(settings);
    applyMotion(settings);
  }, [settings]);
  useEffect(() => { writeBindings(bindings); }, [bindings]);
  // Desktop shortcuts, rebindable in settings: play, skip, search, mute, clear.
  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if (dialog) return;
      const pressed = signature(event);
      if (!pressed) return;
      // ⌘, is the system's settings shortcut, so it is not rebindable.
      if (pressed === "Mod+Comma") {
        event.preventDefault();
        setDialog("settings");
        return;
      }
      const action = shortcutActions.find((item) => bindings[item.id] === pressed);
      if (!action) return;
      const node = event.target as HTMLElement | null;
      const typing = !!node?.closest(
        'input, textarea, select, [contenteditable="true"], [role="menu"]',
      );
      const player = playerRef.current;
      if (action.id === "search") {
        event.preventDefault();
        searchInput.current?.focus();
        searchInput.current?.select();
        return;
      }
      if (action.id === "clearFilter") {
        event.preventDefault();
        if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
        setFilter("");
        return;
      }
      if (typing) return;
      if (action.id === "mute") {
        event.preventDefault();
        player.toggleMute();
        return;
      }
      if (!player.current) return;
      event.preventDefault();
      if (action.id === "playPause") player.toggle();
      else if (action.id === "previous") player.previous();
      else player.next();
    }
    window.addEventListener("keydown", shortcut);
    return () => window.removeEventListener("keydown", shortcut);
  }, [dialog, bindings]);
  // While a row is recording, the next combination is the one it takes.
  useEffect(() => {
    if (!recording) return;
    const row = recording;
    function capture(event: KeyboardEvent) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Escape") {
        setRecording(null);
        setShortcutError("");
        return;
      }
      const pressed = signature(event);
      if (!pressed) return;
      if (isReserved(pressed)) {
        setShortcutError("这个组合被系统或窗口占用，换一个。");
        return;
      }
      const owner = ownerOf(bindings, pressed, row);
      if (owner) {
        setShortcutError(`已经被「${owner.label}」用了，换一个。`);
        return;
      }
      setShortcutError("");
      setBindings({ ...bindings, [row]: pressed });
      setRecording(null);
    }
    window.addEventListener("keydown", capture, true);
    return () => window.removeEventListener("keydown", capture, true);
  }, [recording, bindings]);
  function openDialog(value: "create" | "rename" | "delete", trigger: HTMLElement) {
    dialogTrigger.current = trigger;
    setError("");
    setDialog(value);
  }
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
    void Service.info().then(
      (info) => setLibrary(info.library),
      () => {},
    );
    return () => {
      request.current++;
      importController.current?.abort();
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
    if (next.kind === "uploader" || next.kind === "collections") setUploaderQuery(next.keyword ?? "");
    setLoading(true);
    setError("");
    setFailedPage(null);
    if (p === 1) {
      setCollectionError("");
      setKnownTracks([]);
      setVideos([]);
      setUploaders([]);
      setCollections([]);
      setPage(0);
      setMore(false);
    }
    if (next.kind === "collections") {
      const query = next.keyword
        ? searchCollections(next.uploader.id, next.keyword, Service.collections, () => token === request.current)
            .then((items) => ({ items, hasMore: false }))
        : queryWithRetry(() => Service.collections(next.uploader.id, p), () => token === request.current, setRetryAttempt);
      void query.then(
        (result) => {
          if (token !== request.current || !result) return;
          setCollections((prev) => p === 1 ? result.items : [...prev, ...result.items]);
          setPage(p);
          setMore(result.hasMore);
        },
        (err) => {
          if (token !== request.current) return;
          setError(`合集加载失败：${message(err)}`);
          setFailedPage(p);
        },
      ).finally(() => {
        if (token !== request.current) return;
        fetchingPage.current = false;
        setLoading(false);
      });
      return;
    }
    const operation = () =>
      next.kind === "uploader"
        ? Service.submissions(next.uploader.id, p, next.keyword ?? "")
        : next.kind === "collection"
          ? Service.collectionItems(next.collection, p)
          : Service.search(next.query, next.kind, p);
    const primary = queryWithRetry(operation, () => token === request.current, setRetryAttempt);
    const matchingCollections = next.kind === "uploader" && next.keyword && p === 1
      ? searchCollections(next.uploader.id, next.keyword, Service.collections, () => token === request.current)
      : Promise.resolve<Collection[] | null>(null);
    void Promise.allSettled([primary, matchingCollections]).then(([result, matches]) => {
      if (token !== request.current) return;
      if (matches.status === "fulfilled" && matches.value) setCollections(matches.value);
      if (matches.status === "rejected") setCollectionError(`合集搜索失败：${message(matches.reason)}`);
      if (result.status === "rejected") {
        setError(`查询失败（已请求 3 次）：${message(result.reason)}`);
        setFailedPage(p);
      } else if (result.value) {
        const value = result.value;
        setVideos((prev) => p === 1 ? value.videos : [...prev, ...value.videos.filter((v) => !prev.some((old) => old.bv === v.bv))]);
        setUploaders((prev) => p === 1 ? value.uploaders : [...prev, ...value.uploaders.filter((u) => !prev.some((old) => old.id === u.id))]);
        setPage(p);
        setMore(value.hasMore);
      }
      fetchingPage.current = false;
      setLoading(false);
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
    setCollectionError("");
    if (previous.browse.kind === "uploader" || previous.browse.kind === "collections")
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
  function collectCollection(collection: Collection) {
    if (saving || !destination) return;
    const list = destination;
    setSaving(true);
    setError("");
    const controller = new AbortController();
    importController.current = controller;
    setImportStage("reading");
    void collectionTracks(collection, Service, setImportProgress, controller.signal)
      .then(async (tracks) => {
        controller.signal.throwIfAborted();
        const fresh = tracks.filter(
          (track) => !list.tracks.some((saved) => trackKey(saved) === trackKey(track)),
        );
        if (!fresh.length) {
          setNotice(tracks.length ? "合集中的歌曲已全部加入该歌单" : "合集暂无可加入的歌曲");
          return;
        }
        setImportStage("saving");
        setImportProgress(`正在保存到「${list.name}」…`);
        commit(await Service.addTracks(list.id, fresh));
        setNotice(`已加入 ${fresh.length} 首到「${list.name}」`);
      })
      .catch((err) => {
        if (controller.signal.aborted) setNotice("已取消，歌单未改变");
        else setError(`合集加入失败：${message(err)}。可点击“全部加入”重试。`);
      })
      .finally(() => {
        setSaving(false);
        setImportProgress("");
        setImportStage(null);
        importController.current = null;
      });
  }
  function toggle(t: Track) {
    setSelected((prev) => toggleTracks(prev, [t]));
  }
  function navigate(id: string) {
    request.current++;
    fetchingPage.current = false;
    setLoading(false);
    setView(id);
    if (!selected.length && id !== "source") setTarget(id);
    setFailedPage(null);
    setCollectionError("");
    setFilter("");
    setError("");
  }
  function playTrack(t: Track) {
    player.start(active ?? { id: "preview", name: "试听", tracks: [t] }, t);
  }
  // The player's sleeve and title always lead somewhere: to the playlist it runs,
  // or — for a preview with no playlist of its own — to the video it came from.
  function openNow() {
    if (sourceList) {
      navigate(sourceList.id);
      return;
    }
    const title = player.current?.videoTitle;
    if (!title) return;
    setQuery(title);
    setHistory([]);
    fetchPage({ kind: "video", query: title });
    window.scrollTo(0, 0);
  }
  // A discovery card is a video, so it reads its parts before it can play or save.
  function withTracks(video: Video, use: (tracks: Track[]) => void) {
    void queryWithRetry(() => Service.detail(video.bv), () => true).then(
      (detail) => detail && use(detail.tracks),
      (err) => setError(`读取失败：${message(err)}`),
    );
  }
  function playVideo(video: Video) {
    withTracks(video, (tracks) => {
      if (tracks.length) player.start({ id: "preview", name: "试听", tracks }, tracks[0]);
    });
  }
  function collectVideo(video: Video) {
    if (!destination) return;
    const list = destination;
    withTracks(video, (tracks) => {
      if (!tracks.length) return;
      mutate(
        () => Service.addTracks(list.id, tracks),
        () => setNotice(`已加入「${list.name}」`),
      );
    });
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
  function trackRow(t: Track, index: number, part = false) {
    const isCurrent = !!player.current && trackKey(player.current) === trackKey(t);
    return (
      <div
        className={`track-row ${selectionMode ? "selectable" : ""} ${isSelected(t) && selectionMode ? "selected" : ""} ${isCurrent ? "current" : ""}`}
        key={trackKey(t)}
        aria-current={isCurrent ? "true" : undefined}
        onClick={(event) => {
          if (selectionMode && !(event.target as HTMLElement).closest("button, input, label")) toggle(t);
        }}
      >
        {selectionMode && (
          <label className="check">
            <input
              type="checkbox"
              checked={isSelected(t)}
              onChange={() => toggle(t)}
              aria-label={`选择 ${t.title}`}
            />
          </label>
        )}
        <button
          className="row-index"
          aria-label={selectionMode ? `选择 ${t.title}` : `播放 ${t.title}`}
          onClick={() => (selectionMode ? toggle(t) : playTrack(t))}
        >
          <span className="idx">{part ? `P${t.part}` : index + 1}</span>
          <span className="glyph">
            <Play size={12} fill="currentColor" />
          </span>
          {isCurrent && <Bars on={player.playing} />}
        </button>
        <div className="cover" aria-hidden="true">
          {t.cover ? (
            <img
              src={t.cover}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <CassetteMark size={22} />
          )}
        </div>
        <button className="track-title" aria-pressed={selectionMode ? isSelected(t) : undefined}
          onClick={() => selectionMode ? toggle(t) : playTrack(t)}>
          <strong title={t.title}>{t.title}</strong>
          {!part && <small>
            {t.uploader}
            {t.title !== t.videoTitle ? ` · P${t.part} · ${t.videoTitle}` : ""}
          </small>}
        </button>
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
                mutate(
                  () => Service.removeTrack(active.id, t.bv, t.cid),
                  () => setUndo({ listID: active.id, track: t, index }),
                )
              }
            >
              <Trash2 size={16} />
            </Button>
          </div>
        ) : !selectionMode ? (
          <Button
            variant="ghost"
            disabled={saving || !destination || isSaved(t)}
            onClick={() => collect(t)}
            aria-label={`收藏 ${t.title}`}
          >
            <Heart size={17} fill={isSaved(t) ? "currentColor" : "none"} />
            {isSaved(t) ? "已加入" : "加入"}
          </Button>
        ) : null}
        <span className="duration">{time(t.duration)}</span>
      </div>
    );
  }
  // The sleeve and title are one control only when there is a page to open.
  const nowBody = (
    <>
      <span className="cover">
        {player.current?.cover ? (
          <img src={player.current.cover} alt="" referrerPolicy="no-referrer" />
        ) : (
          <CassetteMark size={28} />
        )}
      </span>
      <span className="now-text">
        <strong>{player.current?.title ?? "还没有播放"}</strong>
        {player.current && (
          <small>{`${player.current.uploader}${player.current.title !== player.current.videoTitle ? ` · P${player.current.part}` : ""}${player.mixed ? " · 仅播放声音" : ""}`}</small>
        )}
      </span>
    </>
  );
  return (
    <div className="app">
      <div
        className="bloom"
        data-on={roomArt ? "true" : "false"}
        style={roomArt ? { backgroundImage: `url("${roomArt}")` } : undefined}
        aria-hidden="true"
      />
      <aside className="sidebar">
        <div className="brand">
          <AppIcon size={26} />
          <span>拾音</span>
        </div>

        <Button
          variant="ghost"
          className={`nav ${view === "source" ? "active" : ""}`}
          aria-current={view === "source" ? "page" : undefined}
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
            onClick={(e) => {
              setListName("");
              openDialog("create", e.currentTarget);
            }}
          >
            <Plus size={18} />
          </Button>
        </div>
        {lists.map((p) => (
          <div className="nav-row" key={p.id}>
            <Button
              variant="ghost"
              className={`nav ${view === p.id ? "active" : ""}`}
              aria-current={view === p.id ? "page" : undefined}
              title={p.name}
              onClick={() => navigate(p.id)}
            >
              {p.id === "1" ? <Heart size={18} /> : <ListMusic size={18} />}
              <span>{p.name}</span>
              {player.current && p.id === player.sourceID ? <Bars on={player.playing} /> : <small>{p.tracks.length}</small>}
            </Button>
            {p.tracks.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="nav-play"
                aria-label={`播放「${p.name}」`}
                title={`播放「${p.name}」`}
                onClick={() => player.start(p, p.tracks[0])}
              >
                <Play size={14} fill="currentColor" />
              </Button>
            )}
          </div>
        ))}
        <div className="side-foot">
          <Button
            variant="ghost"
            className="nav"
            aria-haspopup="dialog"
            onClick={() => setDialog("settings")}
          >
            <SettingsIcon size={18} />
            <span>设置</span>
            <kbd>{bindingLabel("Mod+Comma")}</kbd>
          </Button>
        </div>
      </aside>
      <header>
        <div className="header-inner">
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
              placeholder="全站搜索视频、UP 主"
              aria-label="搜索关键词"
            />
            {query && (
              <Button type="button" variant="ghost" size="icon" aria-label="清空搜索"
                onClick={() => { setQuery(""); searchInput.current?.focus(); }}>
                <X size={16} />
              </Button>
            )}
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
            <Button type="submit" disabled={loading || !query.trim()}>
              搜索
            </Button>
          </form>
        </div>
      </header>
      <main className={isHome ? "home" : undefined}>
        {active ? (
          <section className="hero">
            <div className={`hero-art${heroMosaic ? " mosaic" : ""}`} aria-hidden="true">
              {heroCovers.length ? (
                (heroMosaic ? heroCovers : heroCovers.slice(0, 1)).map((cover) => (
                  <img key={cover} src={cover} alt="" loading="lazy" referrerPolicy="no-referrer" />
                ))
              ) : (
                <CassetteMark size={64} />
              )}
            </div>
            <div className="hero-body">
              <h1>{title}</h1>
              <p className="hero-meta">
                {active.tracks.length
                  ? `${active.tracks.length} 首 · 约 ${heroMinutes} 分钟`
                  : "空歌单"}
              </p>
              <div className="hero-actions">
                <Button
                  disabled={!active.tracks.length}
                  onClick={() => player.start(active, active.tracks[0])}
                >
                  <Play size={15} fill="currentColor" />
                  播放歌单
                </Button>
                <Button
                  variant="outline"
                  aria-pressed={batchMode}
                  onClick={() => setBatchMode(!batchMode)}
                >
                  {batchMode ? "结束多选" : "批量选择"}
                </Button>
                {active.id !== "1" && (
                  <>
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        setListName(active.name);
                        openDialog("rename", e.currentTarget);
                      }}
                    >
                      重命名
                    </Button>
                    <Button variant="ghost" onClick={(e) => openDialog("delete", e.currentTarget)}>
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
              </div>
            </div>
          </section>
        ) : (
          <section className="page-head">
            {history.length > 0 && (
              <Button variant="ghost" size="icon" onClick={goBack} aria-label="返回上一级">
                <ArrowLeft size={18} />
              </Button>
            )}
            <div>
              <h1>{title}</h1>
              {resultCount && <p>{resultCount}</p>}
            </div>
          </section>
        )}
        {libraryError && (
          <div role="alert" className="error">
            资料库加载失败：{libraryError}
            <Button variant="ghost" onClick={readLibrary}>
              重新读取
            </Button>
          </div>
        )}
        {!isHome && !active && (
          <div className="toolbar">
            {(browse.kind === "uploader" || browse.kind === "collections") && (
                <>
                  <Button
                    variant="ghost"
                    aria-pressed={browse.kind === "uploader"}
                    className="browse-tab"
                    onClick={() =>
                      fetchPage({ kind: "uploader", uploader: browse.uploader, keyword: browse.keyword })
                    }
                  >
                    全部投稿
                  </Button>
                  <Button
                    variant="ghost"
                    aria-pressed={browse.kind === "collections"}
                    className="browse-tab"
                    onClick={() =>
                      fetchPage({
                        kind: "collections",
                        uploader: browse.uploader,
                        keyword: browse.keyword,
                      })
                    }
                  >
                    合集与系列
                  </Button>
                </>
              )}
            {hasSourceItems && selected.length === 0 && (
              <div className="destination">
                <span>加入歌单</span>
                <ChoiceMenu label="加入歌单" value={target} disabled={saving}
                  onChange={setTarget} options={lists.map((p) => ({ value: p.id, label: p.name }))} />
              </div>
            )}
            {hasSourceItems && collectionView && browse.kind === "collection" && (
              <Button
                className="collection-all"
                disabled={saving || !destination}
                onClick={() => collectCollection(browse.collection)}
              >
                全部加入
              </Button>
            )}
            {hasSourceItems && browse.kind !== "collections" && (
              <Button
                variant={batchMode ? "outline" : "ghost"}
                aria-pressed={batchMode}
                onClick={() => setBatchMode(!batchMode)}
              >
                {batchMode ? "结束多选" : "批量选择"}
              </Button>
            )}
            {selected.length > 0 && (
              <span className="selection" role="status">
                已选 {selected.length} 首
              </span>
            )}
          </div>
        )}
        {isHome && (
          <section className="discover" aria-label="音乐区热门">
            <div className="section-head">
              <h2>音乐区热门</h2>
              <Button
                variant="ghost"
                className="section-action"
                onClick={loadDiscover}
                disabled={discoverStatus === "loading"}
              >
                {discoverStatus === "loading" && discover.length ? "正在换…" : "换一批"}
              </Button>
            </div>
            {discover.length > 0 && (
              <div className="picks">
                {discover.map((video) => (
                  <article className="pick" key={video.bv}>
                    <div className="pick-frame">
                      <button
                        className="pick-open"
                        onClick={() => playVideo(video)}
                        aria-label={`试听 ${video.title}`}
                      >
                        {video.cover ? (
                          <img
                            src={video.cover}
                            alt=""
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <CassetteMark size={40} />
                        )}
                        <span className="pick-play">
                          <Play size={16} fill="currentColor" />
                        </span>
                        <span className="pick-time">{video.duration}</span>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="pick-add"
                        disabled={saving || !destination}
                        aria-label={`加入 ${video.title}`}
                        onClick={() => collectVideo(video)}
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                    <strong className="pick-title" title={video.title}>
                      {video.title}
                    </strong>
                    <small className="pick-meta">
                      {video.uploader || "B站视频"}
                      {video.views != null && video.views >= 0 && (
                        <span>
                          {" · "}
                          {video.views >= 100000000
                            ? `${Number((video.views / 100000000).toFixed(1))}亿`
                            : video.views >= 10000
                              ? `${Number((video.views / 10000).toFixed(1))}万`
                              : video.views.toLocaleString("zh-CN")}
                          次播放
                        </span>
                      )}
                    </small>
                  </article>
                ))}
              </div>
            )}
            {discoverStatus === "error" ? (
              <p className="home-note" role="status">
                {discoverError}
                <Button variant="ghost" onClick={loadDiscover}>
                  重试
                </Button>
              </p>
            ) : discoverStatus === "loading" && !discover.length ? (
              <p className="home-note" role="status">
                <LoaderCircle size={14} className="spin" />
                正在从 B站音乐区取热门…
              </p>
            ) : null}
          </section>
        )}
        {!active && (browse.kind === "uploader" || browse.kind === "collections") && (
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
              placeholder={browse.kind === "collections" ? "搜索这位 UP 的全部合集" : "搜索这位 UP 的投稿与合集"}
              aria-label={browse.kind === "collections" ? "搜索该 UP 的合集" : "搜索该 UP 的投稿与合集"}
            />
            <Button type="submit" variant="outline" disabled={loading}>
              {browse.kind === "collections" ? "搜索合集" : "搜索"}
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
            {!active && browse.kind === "uploader" && (
              <Button variant="outline"
                onClick={() => fetchPage({ kind: "collections", uploader: browse.uploader, keyword: browse.keyword })}>
                查看合集
              </Button>
            )}
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
        {collectionError && (
          <div className="error" role="alert">
            {collectionError}
            <Button variant="ghost" onClick={() => fetchPage(browse)}>重新搜索</Button>
          </div>
        )}
        {undo && (
          <div className="undo-notice" role="status">
            <span>已移除「{undo.track.title}」</span>
            <Button variant="outline" disabled={saving} onClick={() => {
              const removed = undo;
              mutate(
                () => Service.restoreTrack(removed.listID, removed.track.bv, removed.track.cid, removed.index),
                () => { setUndo(null); setNotice("已恢复歌曲及原有顺序"); },
              );
            }}>撤销移除</Button>
            <Button variant="ghost" size="icon" aria-label="关闭撤销提示" onClick={() => setUndo(null)}>
              <X size={16} />
            </Button>
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
        {importProgress && (
          <div className="batch-tools" role="status">
            <LoaderCircle size={16} className="spin" />
            {importStage === "cancelling" ? "正在取消，等待当前请求结束…" : importProgress}
            {importStage !== "saving" && (
              <Button variant="ghost" disabled={importStage === "cancelling"} onClick={() => {
                importController.current?.abort();
                setImportStage("cancelling");
              }}>取消导入</Button>
            )}
          </div>
        )}
        {selectionMode && (active || videos.length > 0) && (
          <div className="batch-tools">
            <Button
              variant="outline"
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
                  : "全选当前结果"}
            </Button>
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
                        <CassetteMark size={24} />
                      )}
                    </div>
                    <div>
                      <strong>{u.name}</strong>
                      <small>UID {u.id}</small>
                    </div>
                    <Button
                      variant="ghost"
                      className="row-open"
                      aria-label={`查看 ${u.name} 的投稿`}
                      onClick={() =>
                        browseTo({ kind: "uploader", uploader: u })
                      }
                    >
                      查看投稿
                    </Button>
                  </div>
                ))}
                {browse.kind === "uploader" && collections.length > 0 && (
                  <h2 className="result-group-title">相关合集 · {collections.length}</h2>
                )}
                {collections.map((c) => (
                  <div className="up-card" key={`${c.kind}:${c.id}`}>
                    <div className="cover collection-cover" aria-hidden="true">
                      {c.cover ? <img src={c.cover} alt="" loading="lazy" referrerPolicy="no-referrer"
                        onError={(e) => { e.currentTarget.style.display = "none"; }} /> : <ListMusic size={22} />}
                    </div>
                    <div>
                      <button
                        className="video-play-title row-open"
                        aria-label={`展开合集 ${c.title}`}
                        onClick={() => browseTo({ kind: "collection", collection: c })}
                      >
                        <strong>{c.title}</strong>
                      </button>
                      <small>
                        {c.kind === "season" ? "视频合集" : "投稿系列"}{c.count != null ? ` · ${c.count} 个视频` : ""}
                      </small>
                    </div>
                    <Button
                      variant="ghost"
                      className="collection-add"
                      aria-label={`将 ${c.title} 全部加入 ${destination?.name ?? "歌单"}`}
                      disabled={saving || !destination}
                      onClick={() => collectCollection(c)}
                    >
                      <Plus size={16} /> 全部加入
                    </Button>
                  </div>
                ))}
                {browse.kind !== "uploader" && uploaders.length > 0 && videos.length > 0 && (
                  <h2 className="result-group-title">相关视频</h2>
                )}
                {browse.kind === "uploader" && collections.length > 0 && videos.length > 0 && (
                  <h2 className="result-group-title">相关投稿</h2>
                )}
                {videos.map((v) => (
                  <VideoResult
                    key={v.bv}
                    video={browse.kind === "uploader" && !v.uploader ? { ...v, uploader: browse.uploader.name } : v}
                    currentCollection={browse.kind === "collection" ? browse.collection : undefined}
                    selected={selected}
                    onSelectGroup={(tracks) => setSelected((prev) => toggleTracks(prev, tracks))}
                    onDetail={(tracks) =>
                      setKnownTracks((prev) => [
                        ...prev.filter((t) => t.bv !== v.bv),
                        ...tracks,
                      ])
                    }
                    batchMode={selectionMode}
                    onCollect={collect}
                    savedTracks={destination?.tracks ?? []}
                    saving={saving || !destination}
                    onPlay={playTrack}
                    onCollection={(collection) =>
                      browseTo({ kind: "collection", collection })
                    }
                    renderTrack={(track, index) => trackRow(track, index, true)}
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
            {!isHome &&
              !loading &&
              !error &&
              (active
                ? active.tracks.filter((t) =>
                    `${t.title} ${t.videoTitle} ${t.uploader}`.includes(filter),
                  ).length === 0
                : !videos.length &&
                  !uploaders.length &&
                  !collections.length) && (
                <div className="empty">
                  <CassetteMark size={56} />
                  <h2>
                    {active
                      ? filter
                        ? "没有匹配的歌曲"
                        : "歌单还是空的"
                      : page
                        ? "没有找到相关内容"
                        : "从一首喜欢的歌开始"}
                  </h2>
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
                    {active && filter ? "清除筛选" : "开始搜索"}
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

              <ChoiceMenu label="批量收藏到" value={target} disabled={saving}
                onChange={setTarget} options={lists.map((p) => ({ value: p.id, label: p.name }))} />
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
        <div
          className="player-bloom"
          data-on={player.current?.cover ? "true" : "false"}
          style={player.current?.cover ? { backgroundImage: `url("${player.current.cover}")` } : undefined}
          aria-hidden="true"
        />
        {player.current ? (
          <button
            className="now now-link"
            onClick={openNow}
            title={sourceList ? `打开「${sourceList.name}」` : "查看这个视频"}
            aria-label={sourceList ? `打开「${sourceList.name}」` : `查看「${player.current.videoTitle}」`}
          >
            {nowBody}
          </button>
        ) : (
          <div className="now">{nowBody}</div>
        )}
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
                <span className="spin-ring" aria-hidden="true" />
              ) : player.playing ? (
                <Pause size={19} fill="currentColor" />
              ) : (
                <Play size={19} fill="currentColor" />
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
              disabled={!player.current || !player.duration}
              aria-valuetext={`${time(player.elapsed)} / ${time(player.duration)}`}
              value={player.elapsed}
              onChange={(e) => player.seek(Number(e.target.value))}
            />
            <span>{time(player.duration)}</span>
          </div>
        </div>
        <div className="player-options">
          <ChoiceMenu label="播放模式" value={player.mode} onChange={player.changeMode}
            options={modes.map((m) => ({ value: m, label: m }))} />
          <Button
            variant="ghost"
            size="icon"
            className="mute"
            aria-label={player.volume > 0 ? "静音" : "取消静音"}
            aria-pressed={player.volume === 0}
            onClick={player.toggleMute}
          >
            {player.volume > 0 ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </Button>
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
        open={playlistDialog !== null}
        onOpenChange={(open) => {
          if (!open && !saving) setDialog(null);
        }}
      >
        <DialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            if (dialogTrigger.current?.isConnected) dialogTrigger.current.focus();
            else searchInput.current?.focus();
          }}
          title={
            playlistDialog === "create"
              ? "新建歌单"
              : playlistDialog === "rename"
                ? "重命名歌单"
                : "删除歌单"
          }
          description={
            playlistDialog === "delete"
              ? `删除「${active?.name}」及其收录关系，其他歌单不受影响。`
              : undefined
          }
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (playlistDialog === "create" || active) {
                const action =
                  playlistDialog === "create"
                    ? "create"
                    : playlistDialog === "rename"
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
            {playlistDialog !== "delete" && (
              <input
                className="dialog-input"
                autoFocus
                aria-label="歌单名称"
                placeholder="歌单名称"
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
                disabled={saving || (playlistDialog !== "delete" && !listName.trim())}
                variant={playlistDialog === "delete" ? "destructive" : "default"}
              >
                {saving ? "保存中…" : playlistDialog === "create" ? "创建歌单" : playlistDialog === "rename" ? "保存名称" : "删除歌单"}
              </Button>
            </div>
            {error && (
              <p role="alert" className="dialog-error">
                {error}
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialog === "settings"}
        onOpenChange={(open) => {
          if (!open) {
            setDialog(null);
            setRecording(null);
            setShortcutError("");
          }
        }}
      >
        <DialogWindow
          title="设置"
          description="外观、播放、快捷键与版本信息。"
          nav={
            <ul>
              {prefsPages.map((page) => (
                <li key={page.id}>
                  <Button
                    variant="ghost"
                    className="prefs-item"
                    aria-current={prefsPage === page.id ? "page" : undefined}
                    onClick={() => setPrefsPage(page.id)}
                  >
                    <page.icon size={16} />
                    {page.label}
                  </Button>
                </li>
              ))}
            </ul>
          }
        >
          {prefsPage === "appearance" && (
            <section className="prefs-pane" aria-label="外观">
              <h2>外观</h2>
              <div className="setting">
                <div className="setting-text">
                  <strong>主题</strong>
                </div>
                <div className="segmented" role="group" aria-label="主题">
                  {(
                    [
                      ["system", "跟随系统"],
                      ["light", "浅色"],
                      ["dark", "深色"],
                    ] as const
                  ).map(([value, label]) => (
                    <Button
                      key={value}
                      variant="ghost"
                      aria-pressed={(value === "system" ? null : value) === preference}
                      onClick={() => setPreference(value === "system" ? null : value)}
                    >
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="setting">
                <div className="setting-text">
                  <strong>减弱动效</strong>
                </div>
                <Button
                  role="switch"
                  className="switch"
                  aria-checked={settings.calm}
                  aria-label="减弱动效"
                  onClick={() => setSettings({ ...settings, calm: !settings.calm })}
                >
                  <i />
                </Button>
              </div>
            </section>
          )}
          {prefsPage === "playback" && (
            <section className="prefs-pane" aria-label="播放">
              <h2>播放</h2>
              <div className="setting">
                <div className="setting-text">
                  <strong>音量</strong>
                </div>
                <input
                  className="prefs-range"
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={player.volume}
                  onChange={(e) => player.changeVolume(Number(e.target.value))}
                  aria-label="音量"
                />
              </div>
              <div className="setting">
                <div className="setting-text">
                  <strong>启动时回到上次的歌曲</strong>
                </div>
                <Button
                  role="switch"
                  className="switch"
                  aria-checked={settings.resume}
                  aria-label="启动时回到上次的歌曲"
                  onClick={() => setSettings({ ...settings, resume: !settings.resume })}
                >
                  <i />
                </Button>
              </div>
            </section>
          )}
          {prefsPage === "shortcuts" && (
            <section className="prefs-pane" aria-label="快捷键">
              <div className="pane-head">
                <h2>快捷键</h2>
                <Button
                  variant="ghost"
                  className="section-action"
                  onClick={() => {
                    setBindings({ ...defaultBindings });
                    setRecording(null);
                    setShortcutError("");
                  }}
                >
                  恢复默认
                </Button>
              </div>
              {shortcutActions.map((action) => (
                <div className="setting shortcut" key={action.id}>
                  <div className="setting-text">
                    <strong>{action.label}</strong>
                  </div>
                  <Button
                    className={`binding${recording === action.id ? " recording" : ""}`}
                    aria-label={`${action.label}：${bindingLabel(bindings[action.id])}，点击修改`}
                    aria-pressed={recording === action.id}
                    onClick={() => {
                      setShortcutError("");
                      setRecording(recording === action.id ? null : action.id);
                    }}
                  >
                    {recording === action.id ? "按下新的按键…" : bindingLabel(bindings[action.id])}
                  </Button>
                </div>
              ))}
              {shortcutError && (
                <p className="shortcut-error" role="alert">
                  {shortcutError}
                </p>
              )}
            </section>
          )}
          {prefsPage === "about" && (
            <section className="prefs-pane" aria-label="关于">
              <div className="about-head">
                <AppIcon size={64} />
                <div>
                  <strong>拾音</strong>
                  <span>版本 {__APP_VERSION__}</span>
                </div>
              </div>
              <div className="about-row">
                <span>标识</span>
                <code>local.chenwei.shiyin</code>
              </div>
              <div className="about-row">
                <span>资料库</span>
                <code>{library}</code>
              </div>
            </section>
          )}
        </DialogWindow>
      </Dialog>
    </div>
  );
}
