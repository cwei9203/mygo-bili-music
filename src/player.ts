import { useEffect, useRef, useState } from "react";
import { Service, type Playlist, type Track } from "./mygo";
import { Queue, type Mode } from "./queue";
export const trackKey = (t: Track) => `${t.bv}:${t.cid}`;
export const message = (error: unknown) =>
  error instanceof Error ? error.message : String(error);
export function usePlayer() {
  const queue = useRef(new Queue());
  const source = useRef("");
  const tracks = useRef<Track[]>([]);
  const audio = useRef<HTMLAudioElement | null>(null);
  const attempt = useRef(0);
  const stream = useRef("");
  const volumeRef = useRef(0.65);
  const [current, setCurrent] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.65);
  const [mode, setMode] = useState<Mode>("顺序播放");
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
            setError("音频播放失败；歌曲已保留，可手动重试。");
          }
        };
        a.onended = () => {
          if (!live()) return;
          const next = queue.current.next(true);
          if (next) load(next);
          else {
            setPlaying(false);
            setLoading(false);
          }
        };
        a.src = result.url;
        void a.play().catch((err) => {
          if (live()) {
            setLoading(false);
            setPlaying(false);
            setError(message(err));
          }
        });
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
    tracks.current = list.tracks;
    queue.current.start(list.tracks.map(trackKey), trackKey(t));
    load(trackKey(t));
  }
  function sync(lists: Playlist[]) {
    if (!source.current || source.current === "preview") return;
    const list = lists.find((p) => p.id === source.current);
    tracks.current = list?.tracks ?? [];
    if (queue.current.sync(tracks.current.map(trackKey)))
      load(queue.current.current);
  }
  function toggle() {
    if (loading) {
      stop();
      return;
    }
    if (error || !audio.current) {
      load(queue.current.current);
      return;
    }
    const a = audio.current;
    if (a.paused) void a.play().catch((err) => setError(message(err)));
    else a.pause();
  }
  function changeMode(next: Mode) {
    queue.current.setMode(next);
    setMode(next);
  }
  function seek(value: number) {
    if (audio.current) audio.current.currentTime = value;
    setElapsed(value);
  }
  function changeVolume(value: number) {
    volumeRef.current = value;
    setVolume(value);
    if (audio.current) audio.current.volume = value;
  }
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
    changeMode,
    retry: () => load(queue.current.current),
    next: () => {
      const id = queue.current.next();
      if (id) load(id);
      else stop();
    },
    previous: () => load(queue.current.previous()),
  };
}
