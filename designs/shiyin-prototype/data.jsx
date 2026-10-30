/* 演示数据。曲名与 UP 主均为虚构占位，不指向真实稿件。 */

const UP_COLORS = {
  '迟到的电台': '#8a4b32',
  '木箱子': '#3f6b5a',
  '慢岛': '#55603b',
  '南窗': '#6b4a63',
};

const makeTrack = (bv, cid, title, up, part, dur, extra = {}) => ({
  key: `${bv}#${cid}`,
  bv,
  cid,
  title,
  up,
  part,
  dur,
  cover: extra.cover || UP_COLORS[up] || '#6b5a35',
  broken: !!extra.broken,
});

const TRACKS = [
  makeTrack('BV1Ax411c7Yk', 'p1', '夜航西飞', '迟到的电台', '', 254),
  makeTrack('BV1Bx411c7Yn', 'p1', '海边的房间', '木箱子', '', 218),
  makeTrack('BV1Cx411c7Yq', 'p1', '春困', '南窗', '', 177),
  makeTrack('BV1Dx411c7Yr', 'p1', '灰狗巴士', '迟到的电台', '', 302),
  makeTrack('BV1Ex411c7Ys', 'p1', '十二点的便利店', '慢岛', '', 201),
  makeTrack('BV1Fx411c7Yt', 'p1', '雨落在铁皮上', '木箱子', '', 370),
  makeTrack('BV1Gx411c7Yu', 'p1', '旧城环线', '南窗', '', 285),
  makeTrack('BV1Hx411c7Yv', 'p1', '远处有汽笛', '慢岛', '', 164),
  makeTrack('BV1Jx411c7Yw', 'p1', '冬眠', '南窗', '', 192),
  makeTrack('BV1Kx411c7Yx', 'p1', '潮汐表', '木箱子', '', 333, { broken: true }),
];

/* 搜索语料：一个多 P 稿件、若干单 P，以及一个必然 412 的详情请求。 */
const SEARCH_VIDEOS = [
  {
    bv: 'BV1City00001',
    title: '城市夜行 · 四段',
    up: '迟到的电台',
    parts: [
      { cid: 'p1', name: '高架桥', dur: 192 },
      { cid: 'p2', name: '隧道', dur: 241 },
      { cid: 'p3', name: '江边', dur: 224 },
      { cid: 'p4', name: '凌晨', dur: 320 },
    ],
  },
  { bv: 'BV1Night0001', title: '夜航西飞', up: '迟到的电台', parts: [{ cid: 'p1', name: '', dur: 254 }] },
  { bv: 'BV1Train0001', title: '夜车时刻表', up: '慢岛', parts: [{ cid: 'p1', name: '', dur: 288 }] },
  { bv: 'BV1Rain00001', title: '雨夜合辑 · 十二首', up: '木箱子', parts: [{ cid: 'p1', name: '', dur: 2480 }] },
  { bv: 'BV1Sea000001', title: '海边的房间', up: '木箱子', parts: [{ cid: 'p1', name: '', dur: 218 }] },
  { bv: 'BV1Old000001', title: '旧城环线', up: '南窗', parts: [{ cid: 'p1', name: '', dur: 285 }] },
  { bv: 'BV1Err000001', title: '深夜电台 · 第 12 期', up: '南窗', broken: true, parts: [{ cid: 'p1', name: '', dur: 3482 }] },
];

const SEARCH_TRACKS = {};
SEARCH_VIDEOS.forEach((v) => {
  v.parts.forEach((p) => {
    const t = makeTrack(v.bv, p.cid, v.title, v.up, p.name, p.dur, { cover: UP_COLORS[v.up] });
    SEARCH_TRACKS[t.key] = t;
  });
});

const ALL_TRACKS = {};
TRACKS.forEach((t) => { ALL_TRACKS[t.key] = t; });
Object.assign(ALL_TRACKS, SEARCH_TRACKS);

const findTrack = (key) => ALL_TRACKS[key] || null;

const INITIAL_PLAYLISTS = [
  {
    id: 'liked',
    name: '我喜欢',
    keys: [
      'BV1Ax411c7Yk#p1', 'BV1Bx411c7Yn#p1', 'BV1Fx411c7Yt#p1',
      'BV1Gx411c7Yu#p1', 'BV1Ex411c7Ys#p1', 'BV1Jx411c7Yw#p1',
      'BV1Dx411c7Yr#p1', 'BV1Kx411c7Yx#p1',
    ],
  },
  { id: 'night', name: '夜航', keys: ['BV1Ax411c7Yk#p1', 'BV1Dx411c7Yr#p1', 'BV1Hx411c7Yv#p1', 'BV1Ex411c7Ys#p1'] },
  { id: 'code', name: '写代码', keys: ['BV1Cx411c7Yq#p1', 'BV1Bx411c7Yn#p1', 'BV1Gx411c7Yu#p1', 'BV1Fx411c7Yt#p1', 'BV1Jx411c7Yw#p1'] },
  { id: 'sleep', name: '睡前', keys: ['BV1Hx411c7Yv#p1', 'BV1Jx411c7Yw#p1', 'BV1Cx411c7Yq#p1'] },
];

const MODES = [
  { id: 'sequential', label: '顺序播放' },
  { id: 'loop', label: '列表循环' },
  { id: 'single', label: '单曲循环' },
  { id: 'shuffle', label: '随机播放' },
];

const fmt = (sec) => {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m >= 60) return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${m}:${String(r).padStart(2, '0')}`;
};

const fmtTotal = (sec) => {
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)} 小时 ${m % 60} 分` : `${m} 分钟`;
};

const catalogNo = (i) => String(i + 1).padStart(3, '0');

Object.assign(window, {
  TRACKS, SEARCH_VIDEOS, SEARCH_TRACKS, ALL_TRACKS, findTrack,
  INITIAL_PLAYLISTS, MODES, fmt, fmtTotal, catalogNo, UP_COLORS,
});
