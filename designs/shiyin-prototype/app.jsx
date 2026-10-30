const { useState, useEffect, useRef } = React;

const BROKEN_KEY = 'BV1Kx411c7Yx#p1';

function Cover({ t, size }) {
  return (
    <div
      className={'cover' + (size === 'lg' ? ' cover-lg' : '')}
      style={t ? { background: t.cover } : { background: 'var(--rule)' }}
      aria-hidden="true"
    >
      {t ? t.title.slice(0, 1) : ''}
    </div>
  );
}

function App({ skin = 'catalog' }) {
  const [playlists, setPlaylists] = useState(INITIAL_PLAYLISTS);
  const [view, setView] = useState({ type: 'playlist', id: 'liked' });
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState({ state: 'idle', q: '', items: [] });
  const [expanded, setExpanded] = useState([]);
  const [selected, setSelected] = useState([]);
  const [fixed, setFixed] = useState([]);
  const [retrying, setRetrying] = useState([]);
  const [player, setPlayer] = useState({
    key: 'BV1Ax411c7Yk#p1',
    playing: false,
    pos: 0,
    mode: 1,
    queue: INITIAL_PLAYLISTS[0].keys,
    error: false,
  });
  const [queueOpen, setQueueOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addMenu, setAddMenu] = useState(false);
  const [dragIndex, setDragIndex] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [nextId, setNextId] = useState(1);

  const searchRef = useRef(null);
  const rootRef = useRef(null);
  const failedOnce = useRef(false);

  /* ── search ─────────────────────────────────────────────── */
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearch({ state: 'idle', q: '', items: [] });
      return;
    }
    setSearch({ state: 'loading', q, items: [] });
    const timer = setTimeout(() => {
      setSearch({
        state: 'loaded',
        q,
        items: SEARCH_VIDEOS.filter(
          (v) => v.title.includes(q) || v.up.includes(q)
        ),
      });
    }, 380);
    return () => clearTimeout(timer);
  }, [query]);

  /* ── playback timer ─────────────────────────────────────── */
  useEffect(() => {
    if (!player.playing || player.error) return;
    const timer = setInterval(() => {
      setPlayer((p) => {
        const tr = findTrack(p.key);
        if (!tr) return p;
        if (p.pos + 1 < tr.dur) return { ...p, pos: p.pos + 1 };
        const q = p.queue.length ? p.queue : [p.key];
        const mode = MODES[p.mode].id;
        if (mode === 'single') return { ...p, pos: 0 };
        if (mode === 'shuffle') {
          const pick = q[Math.floor(Math.random() * q.length)] || p.key;
          return { ...p, key: pick, pos: 0 };
        }
        const next = q[q.indexOf(p.key) + 1];
        if (!next) {
          if (mode === 'loop') return { ...p, key: q[0], pos: 0 };
          return { ...p, playing: false, pos: tr.dur };
        }
        return { ...p, key: next, pos: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [player.playing, player.error]);

  /* 演示“播放失败但歌不丢”：这首歌第一次播放必然断流 */
  useEffect(() => {
    if (player.key !== BROKEN_KEY || !player.playing || player.error || failedOnce.current) return;
    const timer = setTimeout(() => {
      failedOnce.current = true;
      setPlayer((p) => ({ ...p, playing: false, error: true }));
    }, 1800);
    return () => clearTimeout(timer);
  }, [player.key, player.playing, player.error]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  /* ── helpers ────────────────────────────────────────────── */
  const playlist = view.type === 'playlist' ? playlists.find((p) => p.id === view.id) : null;
  const tracks = playlist ? playlist.keys.map(findTrack).filter(Boolean) : [];
  const total = tracks.reduce((sum, t) => sum + t.dur, 0);
  const current = findTrack(player.key);
  const queueKeys = player.queue.length ? player.queue : [player.key];
  const queueTracks = queueKeys.map(findTrack).filter(Boolean);
  const currentIndex = queueKeys.indexOf(player.key);
  const upcoming = queueTracks.slice(currentIndex + 1);

  const playTrack = (key, queue) => {
    setPlayer((p) => ({
      ...p,
      key,
      queue: queue && queue.length ? queue : [key],
      playing: true,
      pos: 0,
      error: false,
    }));
  };

  const togglePlay = () => {
    if (!current) return;
    setPlayer((p) => ({ ...p, playing: !p.playing, error: false }));
  };

  const step = (dir) => {
    if (!queueTracks.length) return;
    const i = currentIndex < 0 ? 0 : currentIndex;
    const nextIndex = (i + dir + queueTracks.length) % queueTracks.length;
    playTrack(queueTracks[nextIndex].key, queueKeys);
  };

  const cycleMode = () => setPlayer((p) => ({ ...p, mode: (p.mode + 1) % MODES.length }));

  const retryPlayback = () => setPlayer((p) => ({ ...p, error: false, playing: true, pos: 0 }));

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setPlayer((p) => {
      const tr = findTrack(p.key);
      return { ...p, pos: Math.round(ratio * (tr ? tr.dur : 0)), error: false };
    });
  };

  const toggleSelect = (key) => {
    setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]));
  };

  const addTo = (keys, pid) => {
    const target = playlists.find((p) => p.id === pid);
    if (!target || !keys.length) return;
    const prev = target.keys;
    const added = keys.filter((k) => !prev.includes(k)).length;
    if (added) {
      setPlaylists((ps) =>
        ps.map((p) =>
          p.id === pid ? { ...p, keys: [...new Set([...p.keys, ...keys])] } : p
        )
      );
    }
    setSelected([]);
    setAddMenu(false);
    setToast({
      text: added ? `已加入「${target.name}」 · ${added} 首` : `这些歌已经在「${target.name}」里`,
      undo: added
        ? () => setPlaylists((ps) => ps.map((p) => (p.id === pid ? { ...p, keys: prev } : p)))
        : null,
    });
  };

  const removeFrom = (pid, key) => {
    const target = playlists.find((p) => p.id === pid);
    if (!target) return;
    const prev = target.keys;
    setPlaylists((ps) =>
      ps.map((p) => (p.id === pid ? { ...p, keys: p.keys.filter((k) => k !== key) } : p))
    );
    setToast({
      text: `已移出「${target.name}」`,
      undo: () => setPlaylists((ps) => ps.map((p) => (p.id === pid ? { ...p, keys: prev } : p))),
    });
  };

  const reorder = (to) => {
    if (dragIndex === null || dragIndex === to) return;
    setPlaylists((ps) =>
      ps.map((p) => {
        if (p.id !== playlist.id) return p;
        const keys = [...p.keys];
        const [moved] = keys.splice(dragIndex, 1);
        keys.splice(to, 0, moved);
        return { ...p, keys };
      })
    );
    setDragIndex(to);
  };

  const createPlaylist = () => {
    const id = `list-${nextId}`;
    setNextId(nextId + 1);
    setPlaylists((ps) => [...ps, { id, name: '新列表', keys: [] }]);
    setView({ type: 'playlist', id });
    setEditing(id);
    setConfirmDelete(false);
  };

  const commitRename = (id, name) => {
    const clean = name.trim();
    if (clean) setPlaylists((ps) => ps.map((p) => (p.id === id ? { ...p, name: clean } : p)));
    setEditing(null);
  };

  const deletePlaylist = (id) => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setPlaylists((ps) => ps.filter((p) => p.id !== id));
    setView({ type: 'playlist', id: 'liked' });
    setConfirmDelete(false);
  };

  const retryVideo = (bv) => {
    setRetrying((r) => [...r, bv]);
    setTimeout(() => {
      setRetrying((r) => r.filter((b) => b !== bv));
      setFixed((f) => [...f, bv]);
    }, 900);
  };

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      searchRef.current && searchRef.current.focus();
    } else if (e.key === 'Escape') {
      setQueueOpen(false);
      setSelected([]);
      setAddMenu(false);
    }
  };

  const goSearch = () => {
    setView({ type: 'search' });
    setTimeout(() => searchRef.current && searchRef.current.focus(), 0);
  };

  /* ── fragments ──────────────────────────────────────────── */
  const rowClass = (key) => 'row' + (player.key === key ? ' is-playing' : '');

  const trackRow = (t, i, opts) => (
    <div
      key={t.key}
      className={rowClass(t.key)}
      draggable={!!opts.drag}
      onDragStart={opts.drag ? () => setDragIndex(i) : undefined}
      onDragOver={opts.drag ? (e) => { e.preventDefault(); reorder(i); } : undefined}
      onDragEnd={opts.drag ? () => setDragIndex(null) : undefined}
      onClick={() => playTrack(t.key, opts.queue)}
    >
      {opts.drag && <span className="row-grip"><Icon name="grip" size={13} /></span>}
      <span className="row-index">{catalogNo(i)}</span>
      <Cover t={t} />
      <div className="row-main">
        <div className="row-title">
          {t.title}
          {t.part ? <span className="row-part">{t.part}</span> : null}
        </div>
        <div className="row-sub">
          <span>{t.up}</span>
          <span className="row-bv">{t.bv}</span>
        </div>
      </div>
      <span className="row-dur">{fmt(t.dur)}</span>
      {opts.removable ? (
        <button
          className="row-act"
          title="移出列表"
          aria-label="移出列表"
          onClick={(e) => { e.stopPropagation(); removeFrom(playlist.id, t.key); }}
        >
          <Icon name="close" size={13} />
        </button>
      ) : null}
    </div>
  );

  const partKeys = (v) => v.parts.map((p) => `${v.bv}#${p.cid}`);

  const playVideo = (v, part) => {
    const key = `${v.bv}#${part.cid}`;
    playTrack(key, partKeys(v));
  };

  const videoRow = (v) => {
    const isBroken = v.broken && !fixed.includes(v.bv);
    const isRetrying = retrying.includes(v.bv);
    const first = findTrack(`${v.bv}#${v.parts[0].cid}`);
    const open = expanded.includes(v.bv);

    if (isBroken) {
      return (
        <div className="result result-error" key={v.bv}>
          <Cover t={first} />
          <div className="row-main">
            <div className="row-title">{v.title}</div>
            <div className="row-sub">
              <span className="err-text">{isRetrying ? '正在重新获取…' : 'B 站返回 412 · 稿件详情获取失败'}</span>
            </div>
          </div>
          <button className="btn btn-sm" disabled={isRetrying} onClick={() => retryVideo(v.bv)}>
            {isRetrying ? '重试中' : '重试'}
          </button>
        </div>
      );
    }

    if (v.parts.length === 1) {
      const t = first;
      const on = selected.includes(t.key);
      return (
        <div className="result" key={v.bv} onClick={() => playVideo(v, v.parts[0])}>
          <button
            className={'check' + (on ? ' is-on' : '')}
            aria-label="选择"
            onClick={(e) => { e.stopPropagation(); toggleSelect(t.key); }}
          >
            <Icon name="check" size={12} />
          </button>
          <Cover t={t} />
          <div className="row-main">
            <div className="row-title">{v.title}</div>
            <div className="row-sub"><span>{v.up}</span><span className="row-bv">{v.bv}</span></div>
          </div>
          <span className="row-dur">{fmt(v.parts[0].dur)}</span>
          <button
            className="row-act"
            title="加入我喜欢"
            aria-label="加入我喜欢"
            onClick={(e) => { e.stopPropagation(); addTo([t.key], 'liked'); }}
          >
            <Icon name="plus" size={14} />
          </button>
        </div>
      );
    }

    const allKeys = partKeys(v);
    const chosen = allKeys.filter((k) => selected.includes(k)).length;
    const allOn = chosen === allKeys.length;

    return (
      <div key={v.bv}>
        <div
          className="result"
          onClick={() => setExpanded((x) => (open ? x.filter((b) => b !== v.bv) : [...x, v.bv]))}
        >
          <button
            className={'check' + (allOn ? ' is-on' : chosen ? ' is-partial' : '')}
            title="全选分P"
            aria-label="全选分P"
            onClick={(e) => {
              e.stopPropagation();
              setSelected((s) =>
                allOn
                  ? s.filter((k) => !allKeys.includes(k))
                  : [...new Set([...s, ...allKeys])]
              );
            }}
          >
            <Icon name={allOn ? 'check' : chosen ? 'minus' : 'check'} size={12} />
          </button>
          <Cover t={first} />
          <div className="row-main">
            <div className="row-title">{v.title}</div>
            <div className="row-sub">
              <span>{v.up}</span>
              <span>{v.parts.length} 个分P · {fmtTotal(v.parts.reduce((s, p) => s + p.dur, 0))}</span>
            </div>
          </div>
          <span className="badge">{open ? '收起' : '展开分P'}</span>
        </div>
        {open ? (
          <div className="parts">
            {v.parts.map((p, i) => {
              const t = findTrack(`${v.bv}#${p.cid}`);
              const on = selected.includes(t.key);
              return (
                <div className="part" key={p.cid} onClick={() => playVideo(v, p)}>
                  <button
                    className={'check' + (on ? ' is-on' : '')}
                    aria-label="选择这个分P"
                    onClick={(e) => { e.stopPropagation(); toggleSelect(t.key); }}
                  >
                    <Icon name="check" size={12} />
                  </button>
                  <span className="p-name">
                    {i + 1}. {p.name}
                  </span>
                  <span className="row-dur">{fmt(p.dur)}</span>
                  <button
                    className="row-act"
                    title="加入我喜欢"
                    aria-label="加入我喜欢"
                    onClick={(e) => { e.stopPropagation(); addTo([t.key], 'liked'); }}
                  >
                    <Icon name="plus" size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  };

  /* ── main views ─────────────────────────────────────────── */
  const renderPlaylist = () => (
    <>
      <div className="mainhead">
        <div className="eyebrow">
          {playlist.id === 'liked' ? '收藏 · 固定列表' : '列表'} · SY-
          {catalogNo(playlists.findIndex((p) => p.id === playlist.id))}
        </div>
        {editing === playlist.id ? (
          <input
            className="display display-input"
            autoFocus
            defaultValue={playlist.name}
            onBlur={(e) => commitRename(playlist.id, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') setEditing(null);
            }}
          />
        ) : (
          <h1 className="display">{playlist.name}</h1>
        )}
        <div className="headmeta">
          <span>{tracks.length} 首</span>
          <span className="dot">·</span>
          <span>{fmtTotal(total)}</span>
          <span className="dot">·</span>
          <span>列表存在这台 Mac</span>
        </div>
      </div>

      <div className="toolbar">
        <button
          className="btn btn-primary"
          disabled={!tracks.length}
          onClick={() => tracks.length && playTrack(tracks[0].key, playlist.keys)}
        >
          <Icon name="play" size={12} />播放全部
        </button>
        <button
          className="btn"
          disabled={!tracks.length}
          onClick={() => {
            if (!tracks.length) return;
            const pick = tracks[Math.floor(Math.random() * tracks.length)];
            playTrack(pick.key, playlist.keys);
          }}
        >
          <Icon name="shuffle" size={13} />随机
        </button>
        <span className="spacer" />
        {playlist.id !== 'liked' ? (
          <>
            <button className="btn btn-ghost" onClick={() => setEditing(playlist.id)}>
              <Icon name="edit" size={13} />重命名
            </button>
            <button
              className={'btn btn-sm ' + (confirmDelete ? 'btn-danger' : 'btn-ghost')}
              onBlur={() => setConfirmDelete(false)}
              onClick={() => deletePlaylist(playlist.id)}
            >
              <Icon name="trash" size={13} />{confirmDelete ? '再点一次确认' : '删除'}
            </button>
          </>
        ) : null}
      </div>

      {tracks.length === 0 ? (
        <div className="empty">
          <div className="empty-mark">空</div>
          <h3>这个列表还是空的</h3>
          <p>去搜索一首歌，点 + 就收进来了。列表只存在这台 Mac。</p>
          <button className="btn btn-primary" onClick={goSearch}>
            <Icon name="search" size={13} />去搜索
          </button>
        </div>
      ) : (
        <div className="list">
          <div className="listhead">
            <span className="h-num">#</span>
            <span className="h-title">标题</span>
            <span className="h-dur">时长</span>
            <span className="h-act" />
          </div>
          {tracks.map((t, i) => trackRow(t, i, { drag: true, removable: true, queue: playlist.keys }))}
        </div>
      )}
    </>
  );

  const renderSearch = () => {
    const items = search.items;
    return (
      <>
        <div className="mainhead">
          <div className="eyebrow">搜索 · B 站全站</div>
          <h1 className="display">{search.state === 'idle' ? '找一首歌' : search.q}</h1>
          <div className="headmeta">
            {search.state === 'loading' ? (
              <span>正在搜索…</span>
            ) : search.state === 'loaded' ? (
              <span>{items.length} 个稿件 · 展开分P后可以逐个收藏</span>
            ) : (
              <span>视频、分P、UP 主都能搜</span>
            )}
          </div>
        </div>

        {search.state === 'idle' ? (
          <div className="empty">
            <div className="empty-mark">搜</div>
            <h3>输入关键词，搜索整个 B 站</h3>
            <p>找到的歌按“稿件 + 分P”收藏。加进列表只要一次点击。</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              {['夜', '海', '电台'].map((s) => (
                <button key={s} className="btn btn-sm" onClick={() => setQuery(s)}>试试「{s}」</button>
              ))}
            </div>
          </div>
        ) : search.state === 'loading' ? (
          <div className="list">
            {[0, 1, 2].map((i) => (
              <div className="skeleton" key={i}>
                <div className="sk" style={{ width: 28, height: 28 }} />
                <div style={{ flex: 1 }}>
                  <div className="sk" style={{ width: `${38 - i * 6}%`, marginBottom: 6 }} />
                  <div className="sk" style={{ width: '18%', height: 8 }} />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="empty">
            <div className="empty-mark">无</div>
            <h3>没有找到「{search.q}」</h3>
            <p>试试更短的关键词，或者直接搜 UP 主的名字。</p>
            <button className="btn" onClick={() => { setQuery(''); searchRef.current && searchRef.current.focus(); }}>
              换个关键词
            </button>
          </div>
        ) : (
          <div className="list">{items.map(videoRow)}</div>
        )}
      </>
    );
  };

  /* ── player ─────────────────────────────────────────────── */
  const modeIcon = ['list', 'repeat', 'repeat', 'shuffle'][player.mode];
  const pct = current && current.dur ? (player.pos / current.dur) * 100 : 0;

  return (
    <div
      className="app"
      data-skin={skin}
      tabIndex={0}
      ref={rootRef}
      onKeyDown={onKeyDown}
    >
      <div className="body">
        <aside className="rail">
          <div className="brand">
            <div className="brand-seal">拾</div>
            <div>
              <div className="brand-name">拾音</div>
              <span className="brand-tag">收藏喜欢的声音</span>
            </div>
          </div>

          <div className={'searchbox' + (searchFocused ? ' is-focus' : '')}>
            <Icon name="search" size={14} />
            <input
              ref={searchRef}
              value={query}
              placeholder="搜索 B 站"
              aria-label="搜索 B 站"
              onChange={(e) => {
                setQuery(e.target.value);
                setView({ type: 'search' });
              }}
              onFocus={() => { setSearchFocused(true); setView({ type: 'search' }); }}
              onBlur={() => setSearchFocused(false)}
            />
            <kbd>⌘K</kbd>
          </div>

          <div className="rail-sec">
            <div className="rail-title">列表</div>
            {playlists.map((p, i) => (
              <button
                key={p.id}
                className={
                  'navitem' + (view.type === 'playlist' && view.id === p.id ? ' is-active' : '')
                }
                onClick={() => { setView({ type: 'playlist', id: p.id }); setConfirmDelete(false); }}
              >
                <span className="num">{catalogNo(i)}</span>
                <span className="nm">{p.name}</span>
                <span className="ct">{p.keys.length}</span>
              </button>
            ))}
            <button className="newlist" onClick={createPlaylist}>
              <Icon name="plus" size={13} />新建列表
            </button>
          </div>

          <div className="rail-foot">
            <b>列表存在这台 Mac</b><br />
            播放时连接 B 站 · 曲目为演示数据
          </div>
        </aside>

        <main className="main">{view.type === 'search' ? renderSearch() : renderPlaylist()}</main>

        {queueOpen ? (
          <aside className="queue">
            <div className="queue-head">
              <h4>播放队列 · {queueTracks.length} 首</h4>
              <button className="ctrl" aria-label="关闭队列" onClick={() => setQueueOpen(false)}>
                <Icon name="close" size={15} />
              </button>
            </div>
            <div className="queue-body">
              <div className="queue-label">正在播放</div>
              {current ? (
                <button className="qrow is-playing" onClick={() => setQueueOpen(false)}>
                  <Cover t={current} />
                  <div className="qrow-main">
                    <div className="qrow-title">{current.title}</div>
                    <div className="qrow-sub">{current.up}{current.part ? ` · ${current.part}` : ''}</div>
                  </div>
                  <span className="row-dur">{fmt(current.dur)}</span>
                </button>
              ) : null}
              <div className="queue-label">接下来 · {upcoming.length} 首</div>
              {upcoming.map((t) => (
                <button
                  key={t.key}
                  className="qrow"
                  onClick={() => playTrack(t.key, queueKeys)}
                >
                  <Cover t={t} />
                  <div className="qrow-main">
                    <div className="qrow-title">{t.title}</div>
                    <div className="qrow-sub">{t.up}</div>
                  </div>
                  <span className="row-dur">{fmt(t.dur)}</span>
                </button>
              ))}
              {upcoming.length === 0 ? (
                <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--ink-3)' }}>
                  队列到头了，换一个列表继续。
                </div>
              ) : null}
            </div>
          </aside>
        ) : null}
      </div>

      {selected.length > 0 ? (
        <div className="batchbar">
          <span className="n">已选 {selected.length} 首</span>
          <button className="btn btn-primary" onClick={() => addTo(selected, 'liked')}>
            加入我喜欢
          </button>
          <div className="menu-wrap">
            <button className="btn" onClick={() => setAddMenu(!addMenu)}>
              加入列表 <Icon name="chevron" size={12} style={{ transform: 'rotate(90deg)' }} />
            </button>
            {addMenu ? (
              <div className="menu">
                {playlists.map((p) => (
                  <button key={p.id} onClick={() => addTo(selected, p.id)}>
                    {p.name} <span style={{ color: 'var(--ink-3)' }}>· {p.keys.length}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button className="btn btn-ghost" onClick={() => setSelected([])}>取消</button>
        </div>
      ) : null}

      <div className={'player' + (player.error ? ' is-error' : '')}>
        <div className="np">
          <Cover t={current} size="lg" />
          <div className="np-meta">
            <div className="np-title">{current ? current.title : '未在播放'}</div>
            <div className="np-sub">
              {current ? `${current.up}${current.part ? ` · ${current.part}` : ''}` : '选一首歌开始'}
            </div>
          </div>
        </div>

        <div className="np-center">
          {player.error ? (
            <div className="retry-strip">
              <span>音频加载失败，这首歌还在队列里</span>
              <button className="btn btn-sm" onClick={retryPlayback}>
                <Icon name="repeat" size={12} />重试
              </button>
            </div>
          ) : (
            <div className="controls">
              <button className="ctrl" aria-label="上一首" onClick={() => step(-1)}>
                <Icon name="prev" size={15} />
              </button>
              <button className="ctrl ctrl-play" aria-label={player.playing ? '暂停' : '播放'} onClick={togglePlay}>
                <Icon name={player.playing ? 'pause' : 'play'} size={15} />
              </button>
              <button className="ctrl" aria-label="下一首" onClick={() => step(1)}>
                <Icon name="next" size={15} />
              </button>
            </div>
          )}
          <div className="progress">
            <span className="time">{fmt(player.error ? current.dur : player.pos)}</span>
            <div className="pbar" onClick={seek}>
              <div className="pbar-track">
                <div className="pbar-fill" style={{ width: `${pct}%` }} />
                <div className="pbar-knob" style={{ left: `${pct}%` }} />
              </div>
            </div>
            <span className="time">{current ? fmt(current.dur) : '0:00'}</span>
          </div>
        </div>

        <div className="np-right">
          <button
            className={'ctrl' + (queueOpen ? ' is-on' : '')}
            aria-label="播放队列"
            onClick={() => setQueueOpen(!queueOpen)}
          >
            <Icon name="list" size={16} />
          </button>
          <button className="mode-btn" onClick={cycleMode} title="切换播放模式">
            <Icon name={modeIcon} size={13} />
            <span className="mode-label">{MODES[player.mode].label}</span>
          </button>
        </div>
      </div>

      {toast ? (
        <div className="toast">
          <span>{toast.text}</span>
          {toast.undo ? (
            <button onClick={() => { toast.undo(); setToast(null); }}>撤销</button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

Object.assign(window, { App });
