import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Heart,
  Play,
} from "lucide-react";
import { CassetteMark } from "./logo";
import { Button } from "./components/ui/button";
import {
  Service,
  type Video,
  type Track,
  type Detail,
  type Collection,
} from "./mygo";
import { queryWithRetry } from "./query";
import { message, trackKey } from "./player";

export function VideoResult({
  video,
  selected,
  onSelectGroup,
  batchMode,
  onCollect,
  savedTracks,
  saving,
  onDetail,
  onPlay,
  onCollection,
  renderTrack,
  currentCollection,
}: {
  currentCollection?: Collection;
  video: Video;
  batchMode: boolean;
  onCollect: (track: Track) => void;
  savedTracks: Track[];
  saving: boolean;
  onDetail: (tracks: Track[]) => void;
  selected: Track[];
  onSelectGroup: (tracks: Track[]) => void;
  onPlay: (track: Track) => void;
  onCollection: (collection: Collection) => void;
  renderTrack: (track: Track, index: number) => ReactNode;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const mounted = useRef(true);
  const [retryAttempt, setRetryAttempt] = useState(0);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const multiple = detail !== null && detail.tracks.length > 1;
  const pickedCount = detail
    ? detail.tracks.filter((t) => selected.some((s) => trackKey(s) === trackKey(t))).length
    : 0;
  const picked = detail ? pickedCount === detail.tracks.length : selected.some((t) => t.bv === video.bv);
  const partial = !!detail && pickedCount > 0 && !picked;
  const saved =
    detail?.tracks.length === 1 &&
    savedTracks.some((t) => trackKey(t) === trackKey(detail.tracks[0]));
  function act(action: "select" | "play" | "collect") {
    if (pending.current) return;
    function apply(value: Detail) {
      if (action === "select") onSelectGroup(value.tracks);
      else if (action === "play") onPlay(value.tracks[0]);
      else if (value.tracks.length === 1) onCollect(value.tracks[0]);
      else setOpen(true);
    }
    if (detail) {
      apply(detail);
      return;
    }
    pending.current = true;
    setBusy(true);
    setError("");
    setRetryAttempt(0);
    void queryWithRetry(
      () => Service.detail(video.bv),
      () => mounted.current,
      setRetryAttempt,
    )
      .then(
        (value) => {
          if (!value) return;
          setDetail(value);
          onDetail(value.tracks);
          apply(value);
        },
        (err) => setError(`读取失败（已请求 3 次）：${message(err)}`),
      )
      .finally(() => {
        pending.current = false;
        setBusy(false);
      });
  }
  return (
    <section
      className={`video ${open ? "expanded" : ""}`}
      aria-label={video.title}
    >
      <div className={`video-row ${batchMode ? "selectable" : ""} ${picked && batchMode ? "selected" : ""}`}
        onClick={(event) => {
          if (batchMode && !(event.target as HTMLElement).closest("button, input, label")) act("select");
        }}>
        {batchMode && (
          <label className="select-video check">
            <input
              type="checkbox"
              disabled={busy}
              checked={!!picked}
              ref={(node) => { if (node) node.indeterminate = partial; }}
              onChange={() => act("select")}
              aria-label={`${picked ? "取消选择" : "选择"} ${video.title}`}
            />
          </label>
        )}
        <div className="cover" aria-hidden="true">
          {video.cover ? (
            <img
              src={video.cover}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <CassetteMark size={22} />
          )}
        </div>
        <div className="video-title">
          <button
            className="video-play-title"
            aria-pressed={batchMode ? picked : undefined}
            disabled={busy}
            onClick={() => act(batchMode ? "select" : "play")}
            title={video.title}
          >
            <strong>{video.title}</strong>
          </button>
          <small>
            {video.uploader || "B站视频"}
            {video.views != null && video.views >= 0 && (
              <span title={`${video.views.toLocaleString("zh-CN")} 次播放`}>
                {" · "}{video.views >= 100000000
                  ? `${Number((video.views / 100000000).toFixed(1))}亿`
                  : video.views >= 10000
                    ? `${Number((video.views / 10000).toFixed(1))}万`
                    : video.views.toLocaleString("zh-CN")}次播放
              </span>
            )}
            {multiple ? ` · ${detail.tracks.length} 个分 P` : ""}
          </small>
        </div>
        <span className="duration">
          {video.duration
            .split(":")
            .map((part, i) => (i ? part.padStart(2, "0") : part))
            .join(":")}
        </span>
        {multiple && (
          <Button
            variant="ghost"
            className="part-toggle"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={`${open ? "收起" : "展开"} ${video.title} 的 ${detail.tracks.length} 个分 P`}
          >
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>{detail.tracks.length} 首</span>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          disabled={busy}
          onClick={() => act("play")}
          aria-label={`播放 ${video.title}`}
          title="播放"
        >
          {busy ? <LoaderCircle size={17} className="spin" /> : <Play size={17} />}
        </Button>
        {!batchMode && !multiple && (
          <Button
            variant="ghost"
            disabled={busy || saving || !!saved}
            onClick={() => act("collect")}
            aria-label={`收藏 ${video.title}`}
          >
            <Heart size={17} fill={saved ? "currentColor" : "none"} />
            <span>{saved ? "已加入" : "加入"}</span>
          </Button>
        )}
      </div>
      {busy && retryAttempt > 0 && (
        <div className="row-error" role="status">
          正在重试（第 {retryAttempt}/3 次）…
        </div>
      )}
      {error && (
        <div role="alert" className="row-error">
          {error}
        </div>
      )}
      {detail?.collection && !(currentCollection?.id === detail.collection.id && currentCollection.kind === detail.collection.kind) && (
        <Button
          variant="ghost"
          className="collection-link"
          onClick={() => onCollection(detail.collection!)}
        >
          合集：{detail.collection.title}
        </Button>
      )}
      {multiple && open && (
        <div className="parts">
          {detail.tracks.map(renderTrack)}
        </div>
      )}
    </section>
  );
}
