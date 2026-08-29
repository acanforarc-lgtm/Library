// Paste-in primitives for the isometric-furniture skill.
// These are the real ones from `3D room/furniture-extra.jsx` — kept here so a
// design session can be handed the contract and the code together.

function exShade(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16 & 0xff) + pct));
  const g = Math.max(0, Math.min(255, (n >> 8 & 0xff) + pct));
  const b = Math.max(0, Math.min(255, (n & 0xff) + pct));
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

// One light source for the whole room. Never invent per-piece values.
function exFaces(base) {
  return { top: exShade(base, 14), left: exShade(base, -26), right: exShade(base, -8) };
}

// Isometric box. (cx, cy) is the centre of its footprint diamond ON THE FLOOR,
// a/b the diamond's half-width/half-depth (b MUST be a/2), hh the height in px.
function ExBox({ cx, cy, a, b, hh, base, c }) {
  const f = c || exFaces(base);
  return (
    <g>
      <polygon points={`${cx},${cy - b - hh} ${cx + a},${cy - hh} ${cx},${cy + b - hh} ${cx - a},${cy - hh}`} fill={f.top} />
      <polygon points={`${cx - a},${cy - hh} ${cx},${cy + b - hh} ${cx},${cy + b} ${cx - a},${cy}`} fill={f.left} />
      <polygon points={`${cx},${cy + b - hh} ${cx + a},${cy - hh} ${cx + a},${cy} ${cx},${cy + b}`} fill={f.right} />
    </g>);
}

// Oblong footprints (w !== d) are NOT diamonds. Use this instead of squashing b.
// Returns the four floor corners for a w×d piece centred at (cx, cy).
function exFootprint(cx, cy, w, d, TILE = 56) {
  const A = (w + d) * TILE / 4, B = (w - d) * TILE / 4;
  return [
    [cx + A, cy + B / 2], [cx + B, cy + A / 2],
    [cx - A, cy - B / 2], [cx - B, cy - A / 2],
  ];
}

// Prism over an arbitrary footprint — the general form of ExBox.
function ExPrism({ cx, cy, w, d, hh, base, TILE = 56 }) {
  const f = exFaces(base);
  const p = exFootprint(cx, cy, w, d, TILE);
  const up = (pt) => [pt[0], pt[1] - hh];
  const str = (pts) => pts.map((q) => q.join(',')).join(' ');
  // p[1] is the front-right corner, p[3] the front-left; those two faces are
  // the ones a south-facing camera can see.
  return (
    <g>
      <polygon points={str(p.map(up))} fill={f.top} />
      <polygon points={str([p[3], p[1], up(p[1]), up(p[3])])} fill={f.left} />
      <polygon points={str([p[1], p[0], up(p[0]), up(p[1])])} fill={f.right} />
    </g>);
}

// Fixed-size sprite wrapper; bottom-anchors onto its tile.
function ExSprite({ w, h, cls, children, extra }) {
  return (
    <div className={'furniture ' + (cls || '')} style={{ width: w, height: h }}>
      <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>{children}</svg>
      {extra}
    </div>);
}

const exGlow = (color, size) => ({
  position: 'absolute', left: '50%', bottom: '18%', width: size, height: size,
  transform: 'translate(-50%, 50%)', pointerEvents: 'none',
  background: `radial-gradient(circle, ${color}, transparent 68%)`
});
