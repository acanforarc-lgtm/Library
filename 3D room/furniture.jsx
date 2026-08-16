// furniture.jsx — Isometric sprite components.
// ==============================================
// Each piece is a CSS/SVG illustration drawn in an isometric projection
// (2:1 axonometric). Returns a <div> absolutely positioned at the item's
// room tile. Books on shelves are procedurally drawn from the book list.

// Convert room tile (x, y) to screen pixels in isometric projection.
// x grows east (right), y grows south (toward camera).
function tileToIso(x, y, tileSize) {
  const isoX = (x - y) * tileSize * 0.5;
  const isoY = (x + y) * tileSize * 0.25;
  return { left: isoX, top: isoY };
}

// ── Book rendering ───────────────────────────────────────────────────────
// Draws a row of book spines on a shelf. Spines are tinted rectangles
// with subtle depth, matching each book's `spine` color + `height` + `width`.
function BookSpine({ book, onClick, highlighted, selected }) {
  const h = 64 * book.height;
  const w = 40 * book.width + 6;
  const readingBookmark = book.status === 'reading';
  return (
    <button
      className="book-spine"
      onClick={onClick}
      title={book.title}
      style={{
        width: w, height: h,
        background: `linear-gradient(180deg, ${book.spine}, ${shade(book.spine, -12)})`,
        boxShadow: selected ?
        '0 0 0 2px #c98a5a, 0 3px 8px rgba(0,0,0,.3)' :
        highlighted ?
        '0 0 0 1.5px rgba(217,138,90,.7), 0 2px 4px rgba(0,0,0,.2)' :
        'inset -2px 0 4px rgba(0,0,0,.25), inset 1px 0 0 rgba(255,255,255,.15), 0 2px 3px rgba(0,0,0,.15)'
      }}>
      
      <span className="book-spine-title" style={{ color: textOn(book.spine) }}>
        {truncate(book.title, 18)}
      </span>
      {readingBookmark && <span className="book-bookmark" />}
    </button>);

}

function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16 & 0xff) + pct));
  const g = Math.max(0, Math.min(255, (n >> 8 & 0xff) + pct));
  const b = Math.max(0, Math.min(255, (n & 0xff) + pct));
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}
function textOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lum = 0.299 * (n >> 16 & 0xff) + 0.587 * (n >> 8 & 0xff) + 0.114 * (n & 0xff);
  return lum > 140 ? 'rgba(40,30,20,.75)' : 'rgba(255,248,235,.8)';
}
function truncate(s, n) {return s.length > n ? s.slice(0, n - 1) + '…' : s;}

// ── Shelf ────────────────────────────────────────────────────────────────
function Shelf({ item, style, shelf, books, onClickShelf, selected, dragging }) {
  const widthPx = style.w * 56;
  const heightPx = style.h * 32;
  // Visual style variation
  const wood = {
    'shelf-tall-oak': { body: '#b88a5a', dark: '#7a5a3a', shelves: 3 },
    'shelf-wide-walnut': { body: '#6a4a3a', dark: '#4a2e20', shelves: 3 },
    'shelf-short-oak': { body: '#c8a070', dark: '#8a6a4a', shelves: 2 },
    'shelf-glass': { body: '#d4c8b0', dark: '#8a7a5a', shelves: 4 },
    'shelf-ladder': { body: '#d4a878', dark: '#8a6a4a', shelves: 4 }
  }[style.styleId] || { body: '#b88a5a', dark: '#7a5a3a', shelves: 3 };

  const shelfBooks = (shelf?.bookIds || []).map((id) => books.find((b) => b.id === id)).filter(Boolean);
  const booksPerShelf = Math.ceil(shelfBooks.length / wood.shelves);

  return (
    <div
      className={'furniture shelf' + (selected ? ' selected' : '') + (dragging ? ' dragging' : '')}
      onClick={(e) => {e.stopPropagation();onClickShelf(item, shelf);}}
      style={{ width: widthPx, height: heightPx + 90 }}>
      
      {/* Back panel & frame */}
      <div className="shelf-body" style={{
        width: widthPx, height: heightPx + 80,
        background: `linear-gradient(180deg, ${wood.body}, ${wood.dark})`,
        boxShadow: `inset -6px 0 12px ${wood.dark}, inset 0 -4px 6px rgba(0,0,0,.3), 0 6px 12px rgba(0,0,0,.2)`
      }}>
        {/* Horizontal shelves with books */}
        {Array.from({ length: wood.shelves }).map((_, i) => {
          const shelfRow = shelfBooks.slice(i * booksPerShelf, (i + 1) * booksPerShelf);
          return (
            <div key={i} className="shelf-row" style={{
              bottom: 10 + i * ((heightPx + 60) / wood.shelves),
              background: wood.dark
            }}>
              <div className="shelf-books">
                {shelfRow.map((b) =>
                <div key={b.id} className="shelf-book-mini" style={{
                  height: 28 + 18 * b.height,
                  width: 6 + 10 * b.width,
                  background: `linear-gradient(180deg, ${b.spine}, ${shade(b.spine, -15)})`
                }} />
                )}
              </div>
            </div>);

        })}
        {/* Name plate */}
        <div className="shelf-nameplate">{shelf?.name || 'Empty shelf'}</div>
      </div>
      {/* Floor shadow */}
      <div className="furn-shadow" style={{ width: widthPx * 0.9 }} />
    </div>);

}

// ── Generic furniture pieces ─────────────────────────────────────────────
function Armchair({ item, style }) {
  // Properly isometric (2:1 axonometric) armchair facing front (south).
  // Seat is a diamond on the floor; sides recede at 26.565°.
  const color = style.styleId === 'armchair-cream' ? '#ede3d0' :
  style.styleId === 'armchair-rose' ? '#c88888' :
  '#9fb0a0';
  const top = shade(color, 8);
  const right = shade(color, -10);
  const left = shade(color, -20);
  return (
    <div className="furniture armchair" style={{ width: 96, height: 110 }}>
      <svg viewBox="0 0 96 110" width="96" height="110">
        {/* SEAT BASE block (cube under the seat) */}
        <polygon points="88,72  88,88  48,108  48,92" fill={right} />
        <polygon points="8,72   8,88   48,108  48,92" fill={left} />
        {/* SEAT TOP diamond */}
        <polygon points="48,56  88,72  48,92  8,72" fill={top} />
        {/* BACKREST — two panels wrapping the back corner */}
        <polygon points="48,56  8,72   8,24   48,8" fill={shade(color, -8)} />
        <polygon points="48,56  88,72  88,24  48,8" fill={shade(color, -18)} />
        {/* Backrest top edge highlight */}
        <polygon points="48,8  88,24  84,26  48,12  12,26  8,24" fill={shade(color, 14)} />
        {/* ARMRESTS — short blocks on left/right */}
        <polygon points="68,64  88,72  88,60  68,52" fill={top} />
        <polygon points="68,64  88,72  88,80  68,72" fill={right} />
        <polygon points="28,64  8,72   8,60   28,52" fill={top} />
        <polygon points="28,64  8,72   8,80   28,72" fill={left} />
        {/* CUSHION (small inset diamond on seat top) */}
        <polygon points="48,62  76,74  48,84  20,74" fill={shade(color, 14)} opacity=".7" />
      </svg>
    </div>);

}

function Sofa({ item, style }) {
  const color = style.styleId === 'sofa-sage' ? '#a3b598' : '#c88888';
  const top = shade(color, 8);
  const right = shade(color, -10);
  const left = shade(color, -20);
  return (
    <div className="furniture sofa" style={{ width: 184, height: 110 }}>
      <svg viewBox="0 0 184 110" width="184" height="110">
        {/* SEAT BASE block. Footprint diamond: pts top(92,54) right(176,72) bottom(92,90) left(8,72). Block height 16. */}
        <polygon points="176,72  176,88  92,106  92,90" fill={right} />
        <polygon points="8,72    8,88    92,106  92,90" fill={left} />
        <polygon points="92,54   176,72  92,90   8,72" fill={top} />
        {/* BACKREST: two back panels meeting at back vertex (92,54). Height 50. */}
        <polygon points="92,54   8,72    8,22    92,4" fill={shade(color, -8)} />
        <polygon points="92,54   176,72  176,22  92,4" fill={shade(color, -18)} />
        <polygon points="92,4    176,22  172,24  92,8    12,24   8,22" fill={shade(color, 14)} />
        {/* ARMRESTS at left and right ends */}
        <polygon points="30,63   8,72    8,60    30,51" fill={top} />
        <polygon points="30,63   8,72    8,80    30,72" fill={right} />
        <polygon points="154,63  176,72  176,60  154,51" fill={top} />
        <polygon points="154,63  176,72  176,80  154,72" fill={left} />
        {/* CUSHIONS: three small diamonds on seat top */}
        <polygon points="40,68   78,79   40,86   12,75" fill={shade(color, 14)} opacity=".6" />
        <polygon points="92,64   130,75  92,86   52,75" fill={shade(color, 14)} opacity=".6" />
        <polygon points="144,68  172,75  144,86  108,79" fill={shade(color, 14)} opacity=".6" />
      </svg>
    </div>);

}

function BeanBag({ item, style }) {
  // Soft squashed dome that sits on the floor (iso ellipse top + side wedges)
  return (
    <div className="furniture beanbag" style={{ width: 80, height: 50 }}>
      <svg viewBox="0 0 80 50" width="80" height="50">
        {/* base shadow-like darker body */}
        <ellipse cx="40" cy="42" rx="34" ry="6" fill="#8a4a3a" />
        {/* main blob */}
        <ellipse cx="40" cy="32" rx="34" ry="14" fill="#b86850" />
        {/* top dimple */}
        <ellipse cx="40" cy="22" rx="24" ry="10" fill="#d88868" />
        {/* highlight */}
        <ellipse cx="32" cy="18" rx="8" ry="3" fill="#e8a888" opacity=".7" />
      </svg>
    </div>);

}

function SideTable({ item, style }) {
  // Clean iso cube with a slimmer top (tabletop overhang look)
  const wood = '#a8824e', dark = '#7a5a36', mid = '#8a6a42';
  return (
    <div className="furniture sidetable" style={{ width: 60, height: 64 }}>
      <svg viewBox="0 0 60 64" width="60" height="64">
        {/* Tabletop diamond: top(30,12) right(56,24) bottom(30,36) left(4,24). Top is 4px thick. */}
        <polygon points="56,24  56,28  30,40  30,36" fill={dark} />
        <polygon points="4,24   4,28   30,40  30,36" fill={shade(dark, -6)} />
        <polygon points="30,12  56,24  30,36  4,24" fill={wood} />
        {/* Base block below tabletop (slimmer). Footprint diamond center=(30,40), thickness 18 */}
        <polygon points="50,30  50,48  30,58  30,40" fill={mid} />
        <polygon points="10,30  10,48  30,58  30,40" fill={shade(mid, -10)} />
      </svg>
    </div>);

}

function FloorLamp({ item, style, daynight }) {
  const on = daynight < 0.4 || daynight > 0.75;
  return (
    <div className="furniture floorlamp" style={{ width: 42, height: 174 }}>
      <svg viewBox="14 28 44 156" width="42" height="174">
        <ellipse cx="30" cy="184" rx="14" ry="3" fill="rgba(0,0,0,.25)" />
        <ellipse cx="30" cy="180" rx="12" ry="3" fill="#8a6a3a" />
        <rect x="28.5" y="60" width="3" height="120" fill="#a88a4a" />
        <path d="M10 60 L50 60 L44 30 L16 30 Z" fill={on ? '#f5dc9a' : '#b8a070'} />
        <path d="M10 60 L50 60 L44 30 L16 30 Z" fill={on ? 'url(#lampglow)' : 'transparent'} opacity=".8" />
        <defs>
          <radialGradient id="lampglow" cx="50%" cy="70%">
            <stop offset="0%" stopColor="#ffe9a8" />
            <stop offset="100%" stopColor="#e8b858" />
          </radialGradient>
        </defs>
      </svg>
      {on && <div className="lamp-halo" />}
    </div>);

}

function TableLamp({ item, style, daynight }) {
  const on = daynight < 0.4 || daynight > 0.75;
  return (
    <div className="furniture tablelamp" style={{ width: 30, height: 50 }}>
      <svg viewBox="7 6 30 50" width="30" height="50">
        <ellipse cx="22" cy="52" rx="10" ry="3" fill="rgba(0,0,0,.25)" />
        <rect x="20" y="30" width="4" height="20" fill="#a88a4a" />
        <path d="M8 30 L36 30 L30 8 L14 8 Z" fill={on ? '#f5e8c0' : '#d0c090'} />
      </svg>
      {on && <div className="lamp-halo small" />}
    </div>);

}

function Plant({ item, style }) {
  if (style.styleId === 'fern-hanging') {
    return (
      <div className="furniture plant-hanging" style={{ width: 70, height: 120 }}>
        <svg viewBox="0 0 70 120" width="70" height="120" style={{ width: "70px" }}>
          <line x1="35" y1="0" x2="35" y2="40" stroke="#6a4a2a" strokeWidth="1.5" />
          <ellipse cx="35" cy="50" rx="20" ry="8" fill="#6a4a2a" />
          <ellipse cx="35" cy="46" rx="20" ry="8" fill="#8a6a3a" />
          {[...Array(14)].map((_, i) => {
            const a = i / 14 * Math.PI;
            const x = 35 + Math.cos(a) * 18;
            return <path key={i} d={`M${x} 50 Q${x + (i % 2 ? 6 : -6)} ${65 + i * 2} ${x + (i % 2 ? -4 : 8)} ${90 + i * 2}`} stroke={['#5a7a4a', '#6a8a5a', '#4a6a3a'][i % 3]} strokeWidth="3" fill="none" strokeLinecap="round" />;
          })}
        </svg>
      </div>);

  }
  if (style.styleId === 'succulent-set') {
    return (
      <div className="furniture plant-succ" style={{ width: 32, height: 30 }}>
        <svg viewBox="10 12 32 32" width="32" height="32">
          <ellipse cx="25" cy="42" rx="14" ry="2.5" fill="rgba(0,0,0,.2)" />
          <path d="M10 36 L40 36 L36 26 L14 26 Z" fill="#c8a080" />
          <path d="M10 36 L40 36 L36 26 L14 26 Z" fill="url(#potsh)" opacity=".3" />
          <g>
            <circle cx="20" cy="22" r="5" fill="#6a8a5a" />
            <circle cx="30" cy="20" r="6" fill="#7a9a6a" />
            <circle cx="25" cy="16" r="4" fill="#8aa878" />
          </g>
          <defs><linearGradient id="potsh" x1="0" x2="1"><stop stopColor="#fff" /><stop offset="1" stopColor="#000" /></linearGradient></defs>
        </svg>
      </div>);

  }
  // default: monstera
  return (
    <div className="furniture plant-monstera" style={{ width: 50, height: 110 }}>
      <svg viewBox="15 28 50 110" width="50" height="110">
        <ellipse cx="40" cy="134" rx="22" ry="4" fill="rgba(0,0,0,.25)" />
        <path d="M16 130 L64 130 L58 108 L22 108 Z" fill="#a8684a" />
        <path d="M16 130 L64 130 L58 108 L22 108 Z" fill="url(#mg)" opacity=".25" />
        <path d="M40 108 Q26 80 18 60 Q22 40 40 30 Q58 40 62 60 Q54 80 40 108 Z" fill="#4a7a4a" />
        <path d="M40 108 Q32 74 32 48 M40 108 Q28 90 18 72 M40 108 Q52 90 62 72 M40 108 Q50 78 56 54" stroke="#3a5a3a" strokeWidth="1" fill="none" />
        <path d="M22 68 Q14 58 20 50 M58 68 Q66 58 60 50 M20 50 Q22 42 32 40 M60 50 Q58 42 48 40" stroke="#3a5a3a" strokeWidth="1" fill="none" />
        <defs><linearGradient id="mg" x1="0" x2="1"><stop stopColor="#fff" /><stop offset="1" stopColor="#000" /></linearGradient></defs>
      </svg>
    </div>);

}

function Rug({ item, style }) {
  // True iso projection of an N×M rectangle on the floor (2:1 axonometric).
  // Corners (in tile coords relative to top-back corner):
  //   back(0,0) → right(N,0) → front(N,M) → left(0,M)
  // Project with (x,y) → ((x-y)*T/2, (x+y)*T/4)
  const N = style.w;   // tiles along room x
  const M = style.d;   // tiles along room y
  const T = 56;
  // Corners in screen coords (we'll normalize so the SVG starts at 0,0)
  const p = (x, y) => ({ x: (x - y) * T / 2, y: (x + y) * T / 4 });
  const c1 = p(0, 0), c2 = p(N, 0), c3 = p(N, M), c4 = p(0, M);
  const minX = Math.min(c1.x, c2.x, c3.x, c4.x);
  const maxX = Math.max(c1.x, c2.x, c3.x, c4.x);
  const minY = Math.min(c1.y, c2.y, c3.y, c4.y);
  const maxY = Math.max(c1.y, c2.y, c3.y, c4.y);
  const w = maxX - minX, h = maxY - minY;
  const off = (q) => `${q.x - minX},${q.y - minY}`;
  // Inset corners proportionally for the inner bands
  const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const band = (t) => {
    const a = lerp(c1, c3, t);
    const b = lerp(c2, c4, t);
    // Inset each original corner toward center
    const center = { x: (c1.x + c3.x) / 2, y: (c1.y + c3.y) / 2 };
    const ic1 = lerp(c1, center, t), ic2 = lerp(c2, center, t);
    const ic3 = lerp(c3, center, t), ic4 = lerp(c4, center, t);
    return `${off(ic1)} ${off(ic2)} ${off(ic3)} ${off(ic4)}`;
  };

  const palette = {
    'rug-persian-warm': ['#a04a3a', '#d8a868', '#3a2a1a', '#c88858'],
    'rug-sheepskin':    ['#f0e8d8', '#e8dccc', '#d8ccbc', '#f0e8d8'],
    'rug-jute':         ['#c8a878', '#b89868', '#d8b888', '#a88858']
  }[style.styleId] || ['#a04a3a', '#d8a868', '#3a2a1a', '#c88858'];

  return (
    <div className="furniture rug" style={{ width: w, height: h }}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
        <polygon points={`${off(c1)} ${off(c2)} ${off(c3)} ${off(c4)}`} fill={palette[0]} />
        <polygon points={band(0.10)} fill={palette[1]} />
        <polygon points={band(0.22)} fill={palette[2]} />
        <polygon points={band(0.35)} fill={palette[3]} />
        {style.styleId === 'rug-persian-warm' && (
          <g opacity=".5" transform={`translate(${(w) / 2} ${(h) / 2})`}>
            <ellipse rx="14" ry="6" fill={palette[1]} />
            <ellipse rx="5" ry="2.5" fill={palette[2]} />
          </g>
        )}
      </svg>
    </div>
  );

}

function Cat({ item, style }) {
  const color = style.styleId === 'cat-tuxedo' ? '#2a2a2a' : '#d88848';
  return (
    <div className="furniture cat" style={{ width: 32, height: 32 }}>
      <svg viewBox="3 9 36 32" width="32" height="32">
        <ellipse cx="25" cy="42" rx="14" ry="3" fill="rgba(0,0,0,.25)" />
        <ellipse cx="25" cy="32" rx="14" ry="9" fill={color} />
        <circle cx="35" cy="22" r="7" fill={color} />
        <polygon points="30,18 30,10 34,16" fill={color} />
        <polygon points="40,18 40,10 36,16" fill={color} />
        <circle cx="33" cy="22" r="1" fill="#1a1a1a" />
        <circle cx="37" cy="22" r="1" fill="#1a1a1a" />
        <path d="M34 25 Q35 26 36 25" stroke="#1a1a1a" strokeWidth=".8" fill="none" />
        <path d="M12 32 Q8 38 4 30" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
        {style.styleId === 'cat-tuxedo' && <ellipse cx="25" cy="34" rx="6" ry="5" fill="#f8f0e0" />}
      </svg>
    </div>);

}

function Art({ item, style }) {
  const style2 = {
    'frame-botanical': { bg: '#e8dcc0', content: '🌿' },
    'frame-vintage': { bg: '#d8c8a8', content: '' },
    'mirror-oval': { bg: '#d0dce4', content: '' },
    'tapestry-woven': { bg: '#b88868', content: '' }
  }[style.styleId] || { bg: '#e8dcc0' };
  const w = style.w * 50;
  const h = style.h * 40;
  return (
    <div className="furniture art" style={{ width: w, height: h }}>
      <div className="art-frame" style={{ width: w, height: h }}>
        <div className="art-inner" style={{ background: style2.bg }}>
          {style.styleId === 'frame-botanical' &&
          <svg viewBox="0 0 60 80" width="100%" height="100%">
              <path d="M30 72 Q30 50 30 30 M30 50 Q22 44 18 38 M30 50 Q38 44 42 38 M30 38 Q24 32 20 26 M30 38 Q36 32 40 26" stroke="#5a7a4a" strokeWidth="1.5" fill="none" />
              <ellipse cx="18" cy="38" rx="4" ry="2" fill="#6a8a5a" />
              <ellipse cx="42" cy="38" rx="4" ry="2" fill="#6a8a5a" />
              <ellipse cx="20" cy="26" rx="3" ry="2" fill="#6a8a5a" />
              <ellipse cx="40" cy="26" rx="3" ry="2" fill="#6a8a5a" />
            </svg>
          }
          {style.styleId === 'frame-vintage' &&
          <svg viewBox="0 0 40 60" width="100%" height="100%">
              <circle cx="20" cy="22" r="8" fill="#d8b898" />
              <path d="M8 50 Q20 32 32 50 L32 60 L8 60 Z" fill="#8a5858" />
            </svg>
          }
          {style.styleId === 'mirror-oval' &&
          <svg viewBox="0 0 40 60" width="100%" height="100%">
              <ellipse cx="20" cy="30" rx="14" ry="22" fill="url(#mir)" />
              <defs><radialGradient id="mir"><stop stopColor="#f0f4f8" /><stop offset="1" stopColor="#a0b0bc" /></radialGradient></defs>
            </svg>
          }
          {style.styleId === 'tapestry-woven' &&
          <svg viewBox="0 0 60 60" width="100%" height="100%">
              {[0, 1, 2, 3, 4].map((i) =>
            <rect key={i} y={i * 12} width="60" height="10" fill={['#a04a3a', '#d8a868', '#3a2a1a', '#c88858', '#8a3828'][i]} opacity=".8" />
            )}
            </svg>
          }
        </div>
      </div>
    </div>);

}

function Window({ item, style, daynight, weather }) {
  const w = 110, h = 140;
  // Effective condition: live weather wins; otherwise the preset styleId.
  const cond = weather || (
    style.styleId === 'window-rain' ? 'rain' :
    style.styleId === 'window-snow' ? 'snow' :
    'clear');
  // Each preset carries its own canonical time-of-day so a placed window
  // always matches its catalog name ("Sunny Morning" reads as morning even
  // when the room's global clock is set to evening). Live weather takes over
  // the real time-of-day.
  const presetTime = { 'window-rain': 0.80, 'window-sunny': 0.34, 'window-snow': 0.5 };
  const morning = !weather && style.styleId === 'window-sunny';
  const t = weather ? daynight : (presetTime[style.styleId] ?? daynight);
  const isNight = t < 0.2 || t > 0.86;
  const isDawn = t >= 0.2 && t < 0.32;
  const isDusk = t > 0.72 && t <= 0.86;
  const overcast = cond === 'rain' || cond === 'clouds' || cond === 'snow' || cond === 'fog' || cond === 'storm';
  const showSun = !overcast && !isNight;
  const showMoon = isNight && cond !== 'storm';

  // Sky gradient by time + condition
  let skyTop, skyBot;
  if (cond === 'fog') { skyTop = '#c3c7c9'; skyBot = '#dadedd'; }
  else if (cond === 'storm') { skyTop = '#363c44'; skyBot = '#59616a'; }
  else if (isNight) { skyTop = overcast ? '#1b2130' : '#12193a'; skyBot = overcast ? '#2b313e' : '#2c3866'; }
  else if (isDawn) { skyTop = '#4b5c92'; skyBot = '#f0b183'; }
  else if (isDusk) { skyTop = '#39477e'; skyBot = '#ee9a63'; }
  else { skyTop = overcast ? '#8b98a7' : '#5f9bd6'; skyBot = overcast ? '#bcc4cc' : '#d3e8f4'; }

  // Hill / treeline palette
  const hills = isNight ? ['#233250', '#1a2842', '#111c31']
    : (isDawn || isDusk) ? ['#6b6a8e', '#54527b', '#3c3a62']
    : overcast ? ['#8a988c', '#6d8070', '#516551']
    : ['#a3c585', '#7bac64', '#5b8b49'];
  const uid = String(item.id || style.styleId).replace(/[^a-z0-9]/gi, '');
  const skyId = 'sky_' + uid, sunId = 'sun_' + uid;
  const sunX = morning ? 33 : isDawn ? 28 : isDusk ? 72 : 50;
  const sunY = morning ? 40 : (isDawn || isDusk) ? 60 : 30;
  const sunFill = isDusk ? '#ffd9a6' : isDawn ? '#ffe8c0' : '#fff3cf';
  const snowy = cond === 'snow';

  return (
    <div className="furniture window" style={{ width: w, height: h }}>
      <div className="window-frame">
        <div className="window-view">
          <svg viewBox="0 0 100 130" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
            <defs>
              <linearGradient id={skyId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={skyTop} />
                <stop offset="1" stopColor={skyBot} />
              </linearGradient>
              <radialGradient id={sunId} cx="0.5" cy="0.5" r="0.5">
                <stop offset="0" stopColor={sunFill} stopOpacity="0.95" />
                <stop offset="0.4" stopColor={sunFill} stopOpacity="0.35" />
                <stop offset="1" stopColor={sunFill} stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="100" height="130" fill={`url(#${skyId})`} />

            {/* Stars on clear nights */}
            {isNight && !overcast && [...Array(14)].map((_, i) => (
              <circle key={i} cx={(i * 29 + 11) % 100} cy={((i * 17) % 55) + 4}
                r={i % 3 === 0 ? 0.8 : 0.5} fill="#fff" opacity={0.35 + (i % 3) * 0.22} />
            ))}

            {/* Sun with soft glow */}
            {showSun && <>
              <circle cx={sunX} cy={sunY} r="22" fill={`url(#${sunId})`} />
              <circle cx={sunX} cy={sunY} r="9" fill={sunFill} />
            </>}
            {/* Moon */}
            {showMoon && <>
              <circle cx="70" cy="26" r="18" fill="#cdd6ea" opacity="0.2" />
              <circle cx="70" cy="26" r="8" fill="#eef1f8" />
              <circle cx="73" cy="24" r="2" fill="#d2d8e6" opacity="0.7" />
              <circle cx="67" cy="29" r="1.4" fill="#d2d8e6" opacity="0.6" />
            </>}

            {/* Clouds */}
            {(cond === 'clouds' || cond === 'rain' || cond === 'storm' || (cond === 'clear' && !isNight)) && (() => {
              const cloud = cond === 'clear' ? '#ffffff' : cond === 'storm' ? '#3f454d' : isNight ? '#39414f' : '#e4e9ee';
              const op = cond === 'clear' ? 0.9 : 0.85;
              const puffs = cond === 'clear' ? [[26, 22, 9], [34, 24, 7]] : [[24, 18, 11], [36, 20, 9], [70, 30, 12], [82, 32, 9]];
              return puffs.map((p, i) => <ellipse key={i} cx={p[0]} cy={p[1]} rx={p[2]} ry={p[2] * 0.62} fill={cloud} opacity={op} />);
            })()}

            {/* Distant hills / treeline */}
            <path d="M0 74 Q26 64 52 70 T100 68 L100 130 L0 130 Z" fill={hills[0]} />
            <path d="M0 90 Q30 79 60 86 T100 84 L100 130 L0 130 Z" fill={hills[1]} />
            <path d="M0 106 Q22 98 46 104 T100 102 L100 130 L0 130 Z" fill={hills[2]} />
            {/* Snow caps */}
            {snowy && <>
              <path d="M0 74 Q26 64 52 70 T100 68 L100 78 Q52 72 0 82 Z" fill="#f2f5f8" opacity="0.85" />
              <path d="M0 90 Q30 79 60 86 T100 84 L100 92 Q60 88 0 96 Z" fill="#e8edf1" opacity="0.8" />
            </>}
            {/* Fir trees on the near ridge */}
            {[14, 30, 58, 78, 90].map((x, i) => {
              const ty = 100 + (i % 2) * 4;
              const tc = snowy ? '#dfe6ea' : hills[2];
              return <path key={i} d={`M${x} ${ty} l4 8 l-8 0 Z M${x} ${ty + 4} l5 8 l-10 0 Z`} fill={tc} opacity="0.9" />;
            })}
            {/* Warm window lights in the distance at night */}
            {isNight && [22, 44, 63, 81].map((x, i) => (
              <rect key={i} x={x} y={96 + (i % 2) * 5} width="2" height="2.4" fill="#ffcf7a" opacity="0.85" />
            ))}
            {/* Horizon haze */}
            <rect x="0" y="70" width="100" height="16" fill={skyBot} opacity="0.28" />
          </svg>

          {/* Weather overlays */}
          {(cond === 'rain' || cond === 'storm') && (() => {
            const heavy = cond === 'storm';
            // Deterministic per-window variation.
            const seed = uid.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
            const beads = [[18, 22, 5], [70, 15, 4], [41, 52, 6], [84, 58, 4], [27, 76, 5], [61, 83, 4], [52, 33, 3], [10, 64, 4], [90, 34, 3]];
            const runners = [[24, 8, 3.6, 0], [66, 24, 4.6, 1.5], [46, 3, 5.3, 3.0], [81, 12, 4.1, 2.3]];
            const rn = heavy ? runners : runners.slice(0, 3);
            return (
              <div className={'win-rain' + (heavy ? ' heavy' : '')}>
                <div className="win-rain-fall" />
                {beads.map((b, i) => {
                  const dx = ((seed + i * 37) % 9) - 4, dy = ((seed + i * 53) % 7) - 3;
                  return <span key={'b' + i} className="win-bead" style={{ left: (b[0] + dx) + '%', top: (b[1] + dy) + '%', width: b[2], height: b[2] * 1.15 }} />;
                })}
                {rn.map((r, i) => {
                  const dx = ((seed + i * 29) % 11) - 5;
                  const left = r[0] + dx, top = r[1];
                  return <span key={'r' + i} className="win-runner" style={{ left: left + '%', top: top + '%', '--travel': (118 - top) + 'px', '--dur': (r[2] / (heavy ? 1.4 : 1)) + 's', '--delay': r[3] + 's' }} />;
                })}
              </div>
            );
          })()}
          {cond === 'snow' && <div className="win-snow" />}
          {cond === 'fog' && <div className="win-fog" />}
          {cond === 'storm' && <div className="win-flash" />}
          {/* Glass sheen */}
          <div className="win-glass" />
        </div>
        {/* Mullions */}
        <div className="window-mullion-v" />
        <div className="window-mullion-h" />
        <div className="window-sill" />
      </div>
    </div>);

}

function Trinket({ item, style }) {
  const size = { w: 28, h: 32 };
  if (style.styleId === 'mug-ceramic') {
    return (
      <div className="furniture trinket" style={{ width: 26, height: 30 }}>
        <svg viewBox="0 0 26 30" width="26" height="30">
          <ellipse cx="13" cy="28" rx="9" ry="2" fill="rgba(0,0,0,.2)" />
          <path d="M5 10 L21 10 L19 26 L7 26 Z" fill="#f0e8d8" />
          <ellipse cx="13" cy="10" rx="8" ry="2" fill="#d8c8a8" />
          <path d="M20 14 Q24 16 22 20 Q20 22 19 20" fill="none" stroke="#d8c8a8" strokeWidth="2" />
          <ellipse cx="13" cy="10.5" rx="6" ry="1.2" fill="#6a3a2a" />
        </svg>
      </div>);

  }
  if (style.styleId === 'candle-amber') {
    return (
      <div className="furniture trinket candle" style={{ width: 22, height: 36 }}>
        <svg viewBox="0 0 22 36" width="22" height="36">
          <ellipse cx="11" cy="34" rx="8" ry="2" fill="rgba(0,0,0,.2)" />
          <rect x="4" y="10" width="14" height="22" rx="2" fill="#d88848" />
          <ellipse cx="11" cy="10" rx="7" ry="2" fill="#e89858" />
          <path d="M11 10 L11 4" stroke="#3a2a1a" strokeWidth="1" />
          <ellipse cx="11" cy="4" rx="2" ry="3" fill="#ffd080" />
          <ellipse cx="11" cy="3" rx="1" ry="1.5" fill="#fff0c0" />
        </svg>
        <div className="candle-glow" />
      </div>);

  }
  if (style.styleId === 'globe-vintage') {
    return (
      <div className="furniture trinket" style={{ width: 36, height: 42 }}>
        <svg viewBox="0 0 36 42" width="36" height="42">
          <ellipse cx="18" cy="40" rx="12" ry="2" fill="rgba(0,0,0,.2)" />
          <circle cx="18" cy="20" r="14" fill="#c88868" />
          <path d="M6 20 Q18 14 30 20 M6 20 Q18 26 30 20 M18 6 Q24 20 18 34 M18 6 Q12 20 18 34" stroke="#6a3a2a" strokeWidth=".8" fill="none" />
          <rect x="16" y="34" width="4" height="6" fill="#6a4a2a" />
        </svg>
      </div>);

  }
  if (style.styleId === 'clock-mantel') {
    return (
      <div className="furniture trinket" style={{ width: 40, height: 50 }}>
        <svg viewBox="0 0 40 50" width="40" height="50">
          <ellipse cx="20" cy="48" rx="14" ry="2" fill="rgba(0,0,0,.2)" />
          <path d="M6 16 Q20 8 34 16 L34 44 L6 44 Z" fill="#a8824a" />
          <circle cx="20" cy="26" r="10" fill="#f0e4c0" />
          <circle cx="20" cy="26" r="9" fill="none" stroke="#3a2a1a" strokeWidth=".5" />
          <line x1="20" y1="26" x2="20" y2="19" stroke="#3a2a1a" strokeWidth="1.2" />
          <line x1="20" y1="26" x2="24" y2="26" stroke="#3a2a1a" strokeWidth="1.2" />
        </svg>
      </div>);

  }
  return (
    <div className="furniture trinket" style={{ width: 32, height: 24 }}>
      <svg viewBox="0 0 32 24" width="32" height="24">
        <rect x="4" y="8" width="24" height="5" fill="#8a5a3a" />
        <rect x="6" y="13" width="24" height="5" fill="#c88858" />
        <rect x="4" y="18" width="24" height="5" fill="#6a4a2a" />
      </svg>
    </div>);

}

function StringLights({ item, style }) {
  return (
    <div className="furniture stringlights" style={{ width: 260, height: 60 }}>
      <svg viewBox="0 0 260 60" width="260" height="60">
        <path d="M4 8 Q130 50 256 8" stroke="#6a4a3a" strokeWidth="1" fill="none" />
        {[...Array(14)].map((_, i) => {
          const t = i / 13;
          const x = 4 + t * 252;
          const y = 8 + Math.sin(t * Math.PI) * 42;
          return <circle key={i} cx={x} cy={y} r="2.5" fill="#ffe090" opacity={.9} />;
        })}
        {[...Array(14)].map((_, i) => {
          const t = i / 13;
          const x = 4 + t * 252;
          const y = 8 + Math.sin(t * Math.PI) * 42;
          return <circle key={'g' + i} cx={x} cy={y} r="6" fill="#ffe090" opacity={.15} />;
        })}
      </svg>
    </div>);

}

// Router
function Furniture({ item, style, shelf, books, daynight, onClickShelf, selected, dragging, weather }) {
  if (!style) return null;
  // Extra catalog pieces register themselves by styleId and take priority.
  const extra = window.EXTRA_RENDERERS && window.EXTRA_RENDERERS[style.styleId];
  if (extra) return React.createElement(extra, { item, style, daynight });
  switch (item.type) {
    case 'shelf':return <Shelf item={item} style={style} shelf={shelf} books={books} onClickShelf={onClickShelf} selected={selected} dragging={dragging} />;
    case 'chair':
      if (style.styleId.startsWith('sofa')) return <Sofa item={item} style={style} />;
      if (style.styleId.startsWith('beanbag')) return <BeanBag item={item} style={style} />;
      return <Armchair item={item} style={style} />;
    case 'table':return <SideTable item={item} style={style} />;
    case 'lamp':
      if (style.styleId === 'floor-lamp-brass') return <FloorLamp item={item} style={style} daynight={daynight} />;
      if (style.styleId === 'string-lights') return <StringLights item={item} style={style} />;
      return <TableLamp item={item} style={style} daynight={daynight} />;
    case 'plant':return <Plant item={item} style={style} />;
    case 'rug':return <Rug item={item} style={style} />;
    case 'pet':return <Cat item={item} style={style} />;
    case 'art':return <Art item={item} style={style} />;
    case 'window':return <Window item={item} style={style} daynight={daynight} weather={weather} />;
    case 'trinket':return <Trinket item={item} style={style} />;
    default:return null;
  }
}

Object.assign(window, { Furniture, BookSpine, tileToIso, shade });