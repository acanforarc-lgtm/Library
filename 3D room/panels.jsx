// panels.jsx — Inventory catalog, shelf detail, book detail, toolbar.

function Inventory({ open, onClose, catalog, onAdd, onStartPlacing }) {
  const [active, setActive] = React.useState('My Shelves');
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef(null);
  const cat = catalog.find((c) => c.category === active) || catalog[0];

  React.useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('pointerdown', onDoc);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDoc); window.removeEventListener('keydown', onKey); };
  }, [menuOpen]);
  React.useEffect(() => { if (!open) setMenuOpen(false); }, [open]);

  if (!open) return null;
  return (
    <div className="inv-panel">
      <div className="inv-head">
        <h3>Catalog</h3>
        <button className="inv-close" onClick={onClose}>✕</button>
      </div>
      <div className="inv-catbar" ref={menuRef}>
        <button className={'inv-catbtn' + (menuOpen ? ' on' : '')} onClick={() => setMenuOpen((v) => !v)} aria-expanded={menuOpen}>
          <span>{cat.category}</span>
          <span className="inv-catcount">{cat.items.length}</span>
          <span className="inv-caret">▾</span>
        </button>
        {menuOpen && (
          <div className="inv-catmenu">
            {catalog.map((c) => (
              <button key={c.category} className={'inv-catopt' + (c.category === active ? ' on' : '')}
                onClick={() => { setActive(c.category); setMenuOpen(false); }}>
                <span>{c.category}</span>
                <span className="inv-catcount">{c.items.length}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="inv-grid">
        {cat.items.length === 0 && active === 'My Shelves' && (
          <div className="inv-empty">
            <div className="inv-empty-icon">📚</div>
            <div className="inv-empty-title">Your shelves will appear here</div>
            <div className="inv-empty-sub">Once connected, the bookshelves you've set up in the 2D library will sync here, ready to place in your room.</div>
          </div>
        )}
        {cat.items.map((it) => (
          <div key={it.styleId}
            className={'inv-card' + (it.locked ? ' locked' : '')}
            draggable={!it.locked}
            onDragStart={(e) => {
              if (it.locked) return;
              // Hide the browser's default drag image so we can render
              // a custom floating sprite that matches the actual item.
              const empty = document.createElement('div');
              empty.style.width = '1px'; empty.style.height = '1px';
              empty.style.opacity = '0';
              document.body.appendChild(empty);
              try { e.dataTransfer.setDragImage(empty, 0, 0); } catch (err) {}
              setTimeout(() => empty.remove(), 0);
              onStartPlacing(e, it);
            }}
            onDoubleClick={() => !it.locked && onAdd(it)}
          >
            <div className="inv-thumb">
              <InventoryPreview item={it} />
            </div>
            <div className="inv-name">{it.name}</div>
            {it.locked && <div className="inv-lock">🔒 Streak 60</div>}
          </div>
        ))}
      </div>
      <div className="inv-hint">drag from a card to place · double-click to drop in center</div>
    </div>
  );
}

function InventoryPreview({ item }) {
  // Standardized preview: outer warm frame, inner cream card,
  // item SVG scaled to fit. Matches the reference the user provided.
  const fakeItem = { id: 'prev_' + item.styleId, type: item.type, styleId: item.styleId, x: 0, y: 0, rotation: 0 };
  const ref = React.useRef(null);
  const [scale, setScale] = React.useState(1);
  // Measure sprite size and fit to the inner card (100x84).
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sprite = el.querySelector('.furniture');
    if (!sprite) return;
    const w = sprite.offsetWidth || 100;
    const h = sprite.offsetHeight || 100;
    // Inner card is CSS aspect-ratio ~110x90; fit with padding
    const boxW = el.clientWidth - 14;
    const boxH = el.clientHeight - 14;
    const s = Math.min(boxW / w, boxH / h, 1.15);
    setScale(s);
  }, [item.styleId]);
  return (
    <div className="inv-preview" ref={ref}>
      <div className="inv-preview-inner" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <window.Furniture
          item={fakeItem}
          style={item}
          shelf={null}
          books={window.MOCK_BOOKS}
          daynight={0.5}
          onClickShelf={() => {}}
          selected={false}
          dragging={false}
        />
      </div>
    </div>
  );
}

// ── Shelf detail drawer ──────────────────────────────────────────────────
function ShelfDetail({ shelf, books, onClose, onClickBook, selectedBookId }) {
  if (!shelf) return null;
  const shelfBooks = shelf.bookIds.map((id) => books.find((b) => b.id === id)).filter(Boolean);
  const sorted = sortBooks(shelfBooks, shelf.sortBy);
  return (
    <div className="shelf-detail">
      <div className="shelf-detail-head">
        <div>
          <div className="sd-label">Shelf</div>
          <h2>{shelf.name}</h2>
          <div className="sd-meta">
            {shelfBooks.length} books · sorted by {shelf.sortBy}
            <span className="sd-sync">⟳ synced with library</span>
          </div>
        </div>
        <button className="sd-close" onClick={onClose}>✕</button>
      </div>
      <div className="sd-books">
        {sorted.map((b) => (
          <BookSpine key={b.id} book={b}
            onClick={() => onClickBook(b)}
            selected={selectedBookId === b.id}
            highlighted={false} />
        ))}
      </div>
    </div>
  );
}

function sortBooks(books, mode) {
  const copy = [...books];
  if (mode === 'color') {
    copy.sort((a, b) => hueOf(a.spine) - hueOf(b.spine));
  } else if (mode === 'height') {
    copy.sort((a, b) => b.height - a.height);
  } else if (mode === 'recent') {
    copy.sort((a, b) => (b.status === 'read' ? 1 : 0) - (a.status === 'read' ? 1 : 0));
  }
  return copy;
}
function hueOf(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 0xff) / 255, g = ((n >> 8) & 0xff) / 255, b = (n & 0xff) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return h * 60;
}

// ── Book detail card ─────────────────────────────────────────────────────
function BookDetail({ book, onClose }) {
  if (!book) return null;
  const pct = Math.round((book.pagesRead / book.pages) * 100);
  const statusLabel = { read: 'Read', reading: 'Currently reading', tbr: 'To be read' }[book.status];
  return (
    <div className="book-detail">
      <div className="bd-head">
        <div className="bd-cover" style={{
          background: `linear-gradient(145deg, ${book.spine}, ${shade(book.spine, -20)})`,
        }}>
          <div className="bd-cover-title">{book.title}</div>
          <div className="bd-cover-author">{book.author}</div>
        </div>
        <button className="bd-close" onClick={onClose}>✕</button>
      </div>
      <div className="bd-body">
        <h2>{book.title}</h2>
        <div className="bd-author">by {book.author}</div>
        <div className="bd-chips">
          <span className={'bd-chip status-' + book.status}>{statusLabel}</span>
          <span className="bd-chip">{book.genre}</span>
          {book.rating > 0 && <span className="bd-chip stars">{'★'.repeat(book.rating)}{'☆'.repeat(5 - book.rating)}</span>}
        </div>
        <div className="bd-progress">
          <div className="bd-progress-label">
            <span>Progress</span>
            <span>{book.pagesRead} / {book.pages} pages · {pct}%</span>
          </div>
          <div className="bd-progress-bar"><div style={{ width: pct + '%' }} /></div>
        </div>
        {book.notes && (
          <div className="bd-notes">
            <div className="bd-notes-label">Your notes</div>
            <div>“{book.notes}”</div>
          </div>
        )}
        <div className="bd-actions">
          <button className="bd-btn primary">Open in library</button>
          <button className="bd-btn">Edit</button>
        </div>
      </div>
    </div>
  );
}

// ── Toolbar ──────────────────────────────────────────────────────────────
function Toolbar({ state, setState, account, onToggleInventory, onToggleRoomSettings, roomSettingsOpen, onResetRoom, onFullscreen, isFullscreen, editMode, onToggleEdit }) {
  const timeLabel = (() => {
    const t = state.daynight;
    if (t < 0.18) return '🌙 Late night';
    if (t < 0.28) return '🌅 Dawn';
    if (t < 0.45) return '☀︎ Morning';
    if (t < 0.58) return '☀︎ Midday';
    if (t < 0.72) return '☀︎ Afternoon';
    if (t < 0.85) return '🌆 Dusk';
    return '🌙 Evening';
  })();
  const privacyIcon = { public: '🌐', friends: '👥', private: '🔒' }[account.privacy];
  return (
    <div className="toolbar">
      <div className="tb-group">
        <button className={'tb-btn primary' + (editMode ? ' on' : '')} onClick={onToggleEdit}>
          <span className="tb-icon">✎</span> {editMode ? 'Done' : 'Edit room'}
        </button>
        {editMode && (
          <button className="tb-btn" onClick={onToggleInventory}>
            <span className="tb-icon">＋</span> Catalog
          </button>
        )}
        {editMode && (
          <button className={'tb-btn' + (roomSettingsOpen ? ' on' : '')} onClick={onToggleRoomSettings}>
            <span className="tb-icon">⚙</span> Room
          </button>
        )}
      </div>
      <div className="tb-group tb-center">
        <button className={'tb-chip' + (state.gridVisible ? ' on' : '')}
          onClick={() => setState({ ...state, gridVisible: !state.gridVisible })}>
          ⊞ Grid
        </button>
        <button className={'tb-chip' + (state.snapToGrid ? ' on' : '')}
          onClick={() => setState({ ...state, snapToGrid: !state.snapToGrid })}>
          ⟐ Snap
        </button>
        <div className="tb-divider" />
        <div className="tb-time" role="group" aria-label="Time of day">
          {[
            { key: 'auto', label: 'Auto', icon: '🕒' },
            { key: 'dawn', label: 'Dawn', icon: '🌅', v: 0.24 },
            { key: 'day',  label: 'Day',  icon: '☀︎', v: 0.5 },
            { key: 'dusk', label: 'Dusk', icon: '🌇', v: 0.78 },
            { key: 'night',label: 'Night',icon: '🌙', v: 0.95 },
          ].map((p) => {
            const on = (state.timeMode || 'auto') === p.key;
            return (
              <button key={p.key}
                className={'tb-time-btn' + (on ? ' on' : '')}
                title={p.key === 'auto' ? ('Follow my local time — ' + timeLabel) : ('Set ' + p.label)}
                onClick={() => p.key === 'auto'
                  ? setState({ ...state, timeMode: 'auto' })
                  : setState({ ...state, timeMode: p.key, daynight: p.v })}>
                <span className="tb-time-ic">{p.icon}</span>
                <span className="tb-time-lb">{p.key === 'auto' && on ? timeLabel.replace(/^\S+\s/, '') : p.label}</span>
              </button>);
          })}
        </div>
        <div className="tb-divider" />
        <button className={'tb-chip' + (state.audioOn ? ' on' : '')}
          onClick={() => setState({ ...state, audioOn: !state.audioOn })}>
          {state.audioOn ? '♪' : '♪̸'} Ambient
        </button>
      </div>
      <div className="tb-group">
        <div className="tb-streak">
          🔥 <b>{account.readingStreak}</b> day streak
        </div>
        <div className="tb-privacy" title={`Room visibility: ${account.privacy}`}>
          <span>{privacyIcon}</span> {account.privacy}
        </div>
        <button className="tb-btn ghost" onClick={onFullscreen} title="Fullscreen">
          {isFullscreen ? '⤢' : '⛶'}
        </button>
      </div>
    </div>
  );
}

// ── Room settings (footprint, materials, layouts) ─────────────────────────
const WALL_SWATCHES = [
  { name: 'Oatmeal', c: '#e8dcc8' }, { name: 'Sage', c: '#cfd8c6' },
  { name: 'Blush', c: '#ecd6d1' }, { name: 'Clay', c: '#d9b89b' },
  { name: 'Mist', c: '#c2cbd2' }, { name: 'Mocha', c: '#8f7461' },
];
const FLOOR_SWATCHES = [
  { name: 'Oak', base: '#d0a878', line: '#8a6a42' }, { name: 'Walnut', base: '#9c6b45', line: '#5e3d24' },
  { name: 'Ash', base: '#c8b898', line: '#8a7a5a' }, { name: 'Honey', base: '#e0b070', line: '#a07838' },
  { name: 'Slate', base: '#6f6a63', line: '#3d3a34' }, { name: 'Rosewood', base: '#c79b93', line: '#8f6a62' },
];

// Small blocking confirm used for destructive room actions.
function ConfirmDialog({ title, body, confirmLabel, onConfirm, onCancel }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return ReactDOM.createPortal((
    <div className="cf-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="cf-card" role="dialog" aria-modal="true">
        <h4>{title}</h4>
        <p>{body}</p>
        <div className="cf-actions">
          <button className="cf-btn" onClick={onCancel}>Cancel</button>
          <button className="cf-btn danger" autoFocus onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  ), document.body);
}

function RoomSettings({ open, room, setRoom, onClose, onRotateRoom, onResetRoom, onClearLayout, layouts, onSaveLayout, onLoadLayout, onDeleteLayout, onShareSnapshot, weatherPref, liveWeather, onEnableLiveWeather, onDisableLiveWeather }) {
  const [name, setName] = React.useState('');
  const [confirming, setConfirming] = React.useState(null);
  if (!open) return null;
  const itemCount = (room.items || []).length;
  const setSize = (w, d) => setRoom((r) => ({ ...r, size: { w: Math.max(8, Math.min(16, w)), d: Math.max(6, Math.min(14, d)) } }));
  const activeWall = (room.wallColor || '#e8dcc8').toLowerCase();
  const activeFloor = (room.floorBase || '#d0a878').toLowerCase();
  return (
    <div className="rs-panel">
      <div className="rs-head">
        <h3>Room settings</h3>
        <button className="rs-close" onClick={onClose}>✕</button>
      </div>
      <div className="rs-body">
        <div className="rs-sec">
          <div className="rs-label">Footprint</div>
          <div className="rs-stepper">
            <span>Width</span>
            <div className="rs-step-ctrls">
              <button onClick={() => setSize(room.size.w - 1, room.size.d)}>−</button>
              <b>{room.size.w}</b>
              <button onClick={() => setSize(room.size.w + 1, room.size.d)}>+</button>
            </div>
          </div>
          <div className="rs-stepper">
            <span>Depth</span>
            <div className="rs-step-ctrls">
              <button onClick={() => setSize(room.size.w, room.size.d - 1)}>−</button>
              <b>{room.size.d}</b>
              <button onClick={() => setSize(room.size.w, room.size.d + 1)}>+</button>
            </div>
          </div>
          <div className="rs-hint">or drag the corner dots on the floor</div>
        </div>

        <div className="rs-sec">
          <div className="rs-label">Wall height</div>
          <input className="rs-range" type="range" min="260" max="460" step="10"
            value={room.wallHeight || 380}
            onChange={(e) => setRoom((r) => ({ ...r, wallHeight: Number(e.target.value) }))} />
        </div>

        <div className="rs-sec">
          <div className="rs-label">Wall colour</div>
          <div className="rs-swatches">
            {WALL_SWATCHES.map((s) => (
              <button key={s.name} title={s.name}
                className={'rs-sw' + (activeWall === s.c ? ' on' : '')}
                style={{ background: s.c }}
                onClick={() => setRoom((r) => ({ ...r, wallColor: s.c }))} />
            ))}
          </div>
        </div>

        <div className="rs-sec">
          <div className="rs-label">Floor</div>
          <div className="rs-swatches">
            {FLOOR_SWATCHES.map((s) => (
              <button key={s.name} title={s.name}
                className={'rs-sw' + (activeFloor === s.base ? ' on' : '')}
                style={{ background: `linear-gradient(135deg, ${s.base}, ${s.line})` }}
                onClick={() => setRoom((r) => ({ ...r, floorBase: s.base, floorLine: s.line, floorStyle: s.name }))} />
            ))}
          </div>
        </div>

        <div className="rs-sec">
          <div className="rs-label">Window weather</div>
          <label className="rs-toggle">
            <span>Use my location for live weather</span>
            <input type="checkbox" checked={!!(weatherPref && weatherPref.enabled)}
              onChange={(e) => e.target.checked ? onEnableLiveWeather() : onDisableLiveWeather()} />
            <span className="rs-switch" />
          </label>
          <div className="rs-weather-status">
            {(() => {
              const on = weatherPref && weatherPref.enabled;
              if (!on) return 'Windows use the preset scene you place from the catalog.';
              if (liveWeather.status === 'locating') return 'Locating… allow the browser prompt.';
              if (liveWeather.status === 'denied') return 'Location blocked — using presets. Enable it in your browser to go live.';
              if (liveWeather.status === 'error') return "Couldn't reach the weather service — using presets.";
              if (liveWeather.status === 'ok') {
                const label = { clear: '☀ Clear', clouds: '☁ Cloudy', rain: '🌧 Rain', snow: '❄ Snow', fog: '🌫 Fog', storm: '⛈ Storm' }[liveWeather.condition] || liveWeather.condition;
                return 'Live: ' + label + (liveWeather.tempC != null ? ' · ' + liveWeather.tempC + '°C' : '');
              }
              return 'Turning on…';
            })()}
          </div>
        </div>

        <div className="rs-sec">
          <div className="rs-label">Arrange</div>
          <div className="rs-btn-row">
            <button className="rs-btn" onClick={onRotateRoom}>↻ Rotate 90°</button>
            <button className="rs-btn" onClick={onShareSnapshot}>⬆ Share</button>
          </div>
        </div>

        <div className="rs-sec">
          <div className="rs-label">Saved layouts</div>
          <div className="rs-save-row">
            <input className="rs-input" placeholder="Name this layout…" value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { onSaveLayout(name); setName(''); } }} />
            <button className="rs-btn primary" onClick={() => { onSaveLayout(name); setName(''); }}>Save</button>
          </div>
          <div className="rs-layouts">
            {layouts.length === 0 && <div className="rs-empty">No saved layouts yet.</div>}
            {layouts.map((ly) => (
              <div key={ly.id} className="rs-layout">
                <button className="rs-layout-load" onClick={() => onLoadLayout(ly)}>{ly.name}</button>
                <button className="rs-layout-del" title="Delete" onClick={() => onDeleteLayout(ly)}>✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="rs-sec rs-danger">
          <div className="rs-label">Start over</div>
          <button className="rs-reset" onClick={() => setConfirming('clear')}>Clear layout</button>
          <button className="rs-reset" onClick={() => setConfirming('reset')}>Reset room to default</button>
          <div className="rs-hint">Clearing empties the floor but keeps your walls, floor and footprint.</div>
        </div>
      </div>
      {confirming === 'clear' && (
        <ConfirmDialog
          title="Clear this layout?"
          body={itemCount === 0
            ? 'The room is already empty.'
            : `This removes all ${itemCount} ${itemCount === 1 ? 'piece' : 'pieces'} from the room. Saved layouts aren't affected.`}
          confirmLabel="Clear layout"
          onCancel={() => setConfirming(null)}
          onConfirm={() => { setConfirming(null); onClearLayout(); }}
        />
      )}
      {confirming === 'reset' && (
        <ConfirmDialog
          title="Reset room to default?"
          body="Furniture, footprint, wall colour and floor all go back to the starting room. Saved layouts aren't affected."
          confirmLabel="Reset room"
          onCancel={() => setConfirming(null)}
          onConfirm={() => { setConfirming(null); onResetRoom(); }}
        />
      )}
    </div>
  );
}

Object.assign(window, { Inventory, ShelfDetail, BookDetail, Toolbar, RoomSettings, ConfirmDialog });
