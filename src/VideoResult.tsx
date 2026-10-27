import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Music2,
  Heart,
  Play,
  Plus,
} from "lucide-react";
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
  onSelect,
  batchMode,
  onCollect,
  savedTracks,
  saving,
  onDetail,
  onPlay,
  onCollection,
  renderTrack,
}: {
  video: Video;
  batchMode: boolean;
  onCollect: (track: Track) => void;
  savedTracks: Track[];
  saving: boolean;
  onDetail: (tracks: Track[]) => void;
  selected: Track[];
  onSelect: (track: Track) => void;
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
  const actions = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef(false);
  const multiple = detail !== null && detail.tracks.length > 1;
  const picked = detail
    ? detail.tracks.length === 1 &&
      selected.some((t) => trackKey(t) === trackKey(detail.tracks[0]))
    : selected.some((t) => t.bv === video.bv);
  const saved =
    detail?.tracks.length === 1 &&
    savedTracks.some((t) => trackKey(t) === trackKey(detail.tracks[0]));
  function act(action: "select" | "play" | "collect") {
    if (pending.current) return;
    function apply(value: Detail) {
      if (value.tracks.length === 1) {
        if (action === "select") onSelect(value.tracks[0]);
        else if (action === "collect") onCollect(value.tracks[0]);
        else onPlay(value.tracks[0]);
        setOpen(false);
      } else setOpen(true);
    }
    if (detail) {
      if (multiple) setOpen(!open);
      else apply(detail);
      return;
    }
    restoreFocus.current = !!actions.current?.contains(document.activeElement);
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
      <div className="video-row" ref={actions}>
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
            <Music2 size={20} />
          )}
        </div>
        <div className="video-title">
          <button
            className="video-play-title"
            disabled={busy}
            onClick={() => act("play")}
            title={video.title}
          >
            <strong>{video.title}</strong>
          </button>
          <small>
            {video.uploader || "视频"}
            {multiple ? ` · ${detail.tracks.length} 个分 P` : ""}
          </small>
        </div>
        <span className="duration">
          {video.duration
            .split(":")
            .map((part, i) => (i ? part.padStart(2, "0") : part))
            .join(":")}
        </span>
        {multiple ? (
          <Button
            variant="ghost"
            className="part-toggle"
            ref={(node) => {
              if (node && restoreFocus.current) {
                node.focus();
                restoreFocus.current = false;
              }
            }}
            disabled={busy}
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={`${open ? "收起" : "展开"} ${video.title} 的 ${detail.tracks.length} 个分 P`}
          >
            {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            <span>{detail.tracks.length} 个分 P</span>
          </Button>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              disabled={busy}
              onClick={() => act("play")}
              aria-label={`播放 ${video.title}`}
              title="播放；多分 P 视频会先让你选择"
            >
              <Play size={17} />
            </Button>
            <Button
              variant="ghost"
              disabled={busy || saving || !!saved}
              onClick={() => act("collect")}
              aria-label={`收藏 ${video.title}`}
            >
              {busy ? (
                <LoaderCircle size={17} className="spin" />
              ) : (
                <Heart size={17} fill={saved ? "currentColor" : "none"} />
              )}
              <span>{busy ? "读取中" : saved ? "已收藏" : "收藏"}</span>
            </Button>
            {batchMode && (
              <Button
                variant={picked ? "outline" : "ghost"}
                className="select-video"
                disabled={busy}
                onClick={() => act("select")}
                aria-label={`${picked ? "取消选择" : "选择"} ${video.title}`}
                aria-pressed={!!picked}
              >
                {busy ? (
                  <LoaderCircle size={16} className="spin" />
                ) : picked ? (
                  <Check size={16} />
                ) : (
                  <Plus size={16} />
                )}
                <span>{busy ? "读取中" : picked ? "已选" : "选择"}</span>
              </Button>
            )}
          </>
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
          <span>可再次点击播放或选择重试。</span>
        </div>
      )}
      {detail?.collection && (
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
          <div className="parts-hint">
            <span>{detail.tracks.length} 个分 P · 分别播放与收藏</span>
            {batchMode && (
              <Button
                variant="ghost"
                onClick={() => {
                  const all = detail.tracks.every((t) =>
                    selected.some((s) => trackKey(s) === trackKey(t)),
                  );
                  detail.tracks
                    .filter(
                      (t) =>
                        all ||
                        !selected.some((s) => trackKey(s) === trackKey(t)),
                    )
                    .forEach(onSelect);
                }}
              >
                {detail.tracks.every((t) =>
                  selected.some((s) => trackKey(s) === trackKey(t)),
                )
                  ? "取消本组"
                  : "全选本组"}
              </Button>
            )}
          </div>
          {detail.tracks.map(renderTrack)}
        </div>
      )}
    </section>
  );
}
