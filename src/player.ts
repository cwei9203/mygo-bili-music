import { useEffect, useRef, useState } from "react";
import { Service, type Playlist, type Track } from "./mygo";
import { Queue, type Mode } from "./queue";
import { readSettings } from "./settings";
export const trackKey = (t: Track) => `${t.bv}:${t.cid}`;
export const message = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
/** A stream failure is always the same sentence, never the WebView's English one. */
const streamFailure = "这首歌暂时无法播放。";

/** The last track the owner selected, so the next launch opens where they stopped. */
const sessionKey = "shiyin.session";
function readSession(): { list: string; track: string } | null {
  try {
    const saved = JSON.parse(localStorage.getItem(sessionKey) ?? "null");
    return typeof saved?.list === "string" && typeof saved?.track === "string"
      ? saved
      : null;
  } catch {
    return null;
  }
}
function writeSession(list: string, track: string) {
  try {
    localStorage.setItem(sessionKey, JSON.stringify({ list, track }));
  } catch {
    // storage is a convenience here; losing it must never interrupt playback
  }
}
function clearSession() {
  try {
    localStorage.removeItem(sessionKey);
  } catch {
    // same: a failed cleanup must not break the library read
  }
}

/** Volume is a room preference, so it survives the launch that set it. */
const volumeKey = "shiyin.volume";
function readVolume() {
  try {
    const saved = Number(localStorage.getItem(volumeKey));
    return saved > 0 && saved <= 1 ? saved : 0.65;
  } catch {
    return 0.65;
  }
}
function writeVolume(value: number) {
  try {
    localStorage.setItem(volumeKey, String(value));
  } catch {
    // losing the preference is silent; playback itself is not
  }
}
export function usePlayer() {
  const [queue] = useState(() => new Queue(localStorage.getItem("shiyin.playbackMode")));
  const source = useRef("");
  const tracks = useRef<Track[]>([]);
  const audio = useRef<HTMLAudioElement | null>(null);
  const attempt = useRef(0);
  const stream = useRef("");
  const volumeRef = useRef(readVolume());
  const lastVolume = useRef(volumeRef.current);
  const [sourceID, setSourceID] = useState("");
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(volumeRef.current);
  const [mode, setMode] = useState<Mode>(queue.mode);
  const [mixed, setMixed] = useState(false);
  function stop() {
    attempt.current++;
    if (audio.current) {
      audio.current.pause();
      audio.current.removeAttribute("src");
      audio.current.load();
      audio.current = null;
    }
    if (stream.current) {
      void Service.releaseStream(stream.current).catch(() => {});
      stream.current = "";
    }
    setPlaying(false);
    setLoading(false);
  }
  function load(id: string | null) {
    stop();
    setError("");
    setMixed(false);
    setElapsed(0);
    const t = tracks.current.find((t) => trackKey(t) === id) ?? null;
    setCurrent(t);
    setDuration(t?.duration ?? 0);
    if (!t) return;
    if (source.current !== "preview") writeSession(source.current, trackKey(t));
    setLoading(true);
    const token = attempt.current;
    void Service.resolve(t.bv, t.cid).then(
      (result) => {
        if (token !== attempt.current) {
          void Service.releaseStream(result.url).catch(() => {});
          return;
        }
        stream.current = result.url;
        setMixed(result.mixed);
        const a = new Audio();
        audio.current = a;
        a.preload = "metadata";
        a.volume = volumeRef.current;
        const live = () => token === attempt.current;
        a.onplaying = () => {
          if (live()) {
            setLoading(false);
            setPlaying(true);
          }
        };
        a.onpause = () => {
          if (live()) setPlaying(false);
        };
        a.ontimeupdate = () => {
          if (live()) setElapsed(a.currentTime);
        };
        a.ondurationchange = () => {
          if (live() && Number.isFinite(a.duration)) setDuration(a.duration);
        };
        a.onerror = () => {
          if (live()) {
            a.pause();
            setLoading(false);
            setPlaying(false);
            setError(streamFailure);
          }
        };
        a.onended = () => {
          if (!live()) return;
          const next = queue.next(true);
          if (next) load(next);
          else {
            setPlaying(false);
            setLoading(false);
          }
        };
        a.src = result.url;
        // WebKit aborts the first play of a fresh page with AbortError, and a
        // second call starts the same element; a real media failure arrives
        // through onerror instead, so a rejected promise is worth retrying.
        let tries = 0;
        const start = () => {
          if (token !== attempt.current) return;
          void a.play().catch(() => {
            if (token !== attempt.current) return;
            if (++tries < 3) {
              window.setTimeout(start, 200 * tries);
              return;
            }
            setLoading(false);
            setPlaying(false);
            setError(streamFailure);
          });
        };
        start();
      },
      (err) => {
        if (token === attempt.current) {
          setLoading(false);
          setPlaying(false);
          setError(message(err));
        }
      },
    );
  }
  function start(list: Playlist, t: Track) {
    source.current = list.id;
    setSourceID(list.id);
    tracks.current = list.tracks;
    queue.start(list.tracks.map(trackKey), trackKey(t));
    load(trackKey(t));
  }
  /** Restores the last selected track without touching the network or the audio element. */
  function resume(lists: Playlist[]) {
    if (!readSettings().resume) return;
    const saved = readSession();
    if (!saved) return;
    const list = lists.find((p) => p.id === saved.list);
    const t = list?.tracks.find((t) => trackKey(t) === saved.track);
    if (!list || !t) {
      clearSession();
      return;
    }
    source.current = list.id;
    setSourceID(list.id);
    tracks.current = list.tracks;
    queue.start(list.tracks.map(trackKey), saved.track);
    setCurrent(t);
    setDuration(t.duration);
  }
  function sync(lists: Playlist[]) {
    if (!source.current) {
      resume(lists);
      return;
    }
    if (source.current === "preview") return;
    const list = lists.find((p) => p.id === source.current);
    tracks.current = list?.tracks ?? [];
    if (queue.sync(tracks.current.map(trackKey)))
      load(queue.current);
  }
  function toggle() {
    if (loading) {
      stop();
      return;
    }
    if (error || !audio.current) {
      load(queue.current);
      return;
    }
    const a = audio.current;
    if (a.paused) void a.play().catch(() => { if (a.paused) setError(streamFailure); });
    else a.pause();
  }
  function changeMode(next: Mode) {
    queue.setMode(next);
    setMode(next);
    try {
      localStorage.setItem("shiyin.playbackMode", next);
    } catch (err) {
      setError(`播放模式保存失败：${message(err)}`);
    }
  }
  function seek(value: number) {
    if (audio.current) audio.current.currentTime = value;
    setElapsed(value);
  }
  function changeVolume(value: number) {
    if (value > 0) lastVolume.current = value;
    volumeRef.current = value;
    setVolume(value);
    if (audio.current) audio.current.volume = value;
    if (value > 0) writeVolume(value);
  }
  // macOS drops the route when headphones are unplugged; the native side says
  // so, and the song stays where it is.
  useEffect(() => {
    const pause = () => audio.current?.pause();
    window.addEventListener("shiyin:output-lost", pause);
    return () => window.removeEventListener("shiyin:output-lost", pause);
  }, []);
  useEffect(
    () => () => {
      attempt.current++;
      audio.current?.pause();
      if (stream.current)
        void Service.releaseStream(stream.current).catch(() => {});
    },
    [],
  );
  return {
    current,
    sourceID,
    playing,
    loading,
    error,
    elapsed,
    duration,
    volume,
    mode,
    mixed,
    start,
    sync,
    toggle,
    seek,
    changeVolume,
    toggleMute: () => changeVolume(volume > 0 ? 0 : lastVolume.current),
    changeMode,
    retry: () => load(queue.current),
    next: () => {
      const id = queue.next();
      if (id) load(id);
      else stop();
    },
    previous: () => load(queue.previous()),
  };
}
