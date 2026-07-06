// panels.jsx — Inventory catalog, shelf detail, book detail, toolbar.

function Inventory({ open, onClose, catalog, onAdd, onStartPlacing }) {
  const [active, setActive] = React.useState('My Shelves');
  const tabsRef = React.useRef(null);
  const [canL, setCanL] = React.useState(false);
  const [canR, setCanR] = React.useState(false);
  const cat = catalog.find((c) => c.category === active) || catalog[0];

  const updateArrows = React.useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanL(el.scrollLeft > 4);
    setCanR(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);
  React.useEffect(() => {
    updateArrows();
    const el = tabsRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, open]);
  const scrollBy = (dx) => tabsRef.current?.scrollBy({ left: dx, behavior: 'smooth' });

  if (!open) return null;
  return (
    <div className="inv-panel">
      <div className="inv-head">
        <h3>Catalog</h3>
        <button className="inv-close" onClick={onClose}>✕</button>
      </div>
      <div className="inv-tabs-wrap">
        <button className={'inv-arrow left' + (canL ? '' : ' dim')} onClick={() => scrollBy(-140)} aria-label="Scroll categories left">‹</button>
        <div className="inv-tabs" ref={tabsRef}>
          {catalog.map((c) => (
            <button key={c.category} className={'inv-tab' + (c.category === active ? ' on' : '')} onClick={() => setActive(c.category)}>
              {c.category}
            </button>
          ))}
        </div>
        <button className={'inv-arrow right' + (canR ? '' : ' dim')} onClick={() => scrollBy(140)} aria-label="Scroll categories right">›</button>
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
function Toolbar({ state, setState, account, onToggleInventory, onToggleRoomSettings, onResetRoom, onFullscreen, isFullscreen, editMode, onToggleEdit }) {
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
        <div className="tb-time">
          <span>{timeLabel}</span>
          <input type="range" min="0" max="1" step="0.01" value={state.daynight}
            onChange={(e) => setState({ ...state, daynight: Number(e.target.value) })} />
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

Object.assign(window, { Inventory, ShelfDetail, BookDetail, Toolbar });
