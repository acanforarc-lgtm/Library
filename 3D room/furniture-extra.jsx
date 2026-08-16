// Extra catalog pieces, part 1 — surfaces, seating, lighting, plants, music.
// Each renderer is registered by styleId in window.EXTRA_RENDERERS; the
// Furniture router in furniture.jsx checks that map before its own switch.

function exShade(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16 & 0xff) + pct));
  const g = Math.max(0, Math.min(255, (n >> 8 & 0xff) + pct));
  const b = Math.max(0, Math.min(255, (n & 0xff) + pct));
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}
// Faces of an isometric box: base colour lit on top, darker on the left.
function exFaces(base) {
  return { top: exShade(base, 14), left: exShade(base, -26), right: exShade(base, -8) };
}
// Isometric box: (cx, cy) is the centre of its footprint diamond on the floor,
// a/b the diamond's half-width/half-depth, hh the height in px.
function ExBox({ cx, cy, a, b, hh, base, c }) {
  const f = c || exFaces(base);
  return (
    <g>
      <polygon points={`${cx},${cy - b - hh} ${cx + a},${cy - hh} ${cx},${cy + b - hh} ${cx - a},${cy - hh}`} fill={f.top} />
      <polygon points={`${cx - a},${cy - hh} ${cx},${cy + b - hh} ${cx},${cy + b} ${cx - a},${cy}`} fill={f.left} />
      <polygon points={`${cx},${cy + b - hh} ${cx + a},${cy - hh} ${cx + a},${cy} ${cx},${cy + b}`} fill={f.right} />
    </g>);
}
// Wrapper: fixed-size sprite that bottom-anchors onto its tile.
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

const EX1 = {};

// ── Surfaces ────────────────────────────────────────────────────────────
EX1['desk-writing'] = () => {
  const wood = '#a8824e';
  return (
    <ExSprite w={150} h={104}>
      <ExBox cx={75} cy={70} a={72} b={36} hh={44} base={wood} />
      <rect x="10" y="72" width="5" height="24" fill={exShade(wood, -30)} />
      <rect x="135" y="72" width="5" height="24" fill={exShade(wood, -30)} />
      <rect x="72" y="86" width="5" height="16" fill={exShade(wood, -30)} />
      <polygon points="78,44 132,30 132,44 78,58" fill={exShade(wood, -14)} />
      <circle cx="104" cy="43" r="2.5" fill="#e0c890" />
      <polygon points="20,40 56,31 56,36 20,45" fill="#efe6d2" />
    </ExSprite>);
};
EX1['coffee-table-round'] = () => {
  const wood = '#b08c58';
  return (
    <ExSprite w={112} h={68}>
      <ellipse cx="56" cy="34" rx="52" ry="24" fill={exShade(wood, -18)} />
      <ellipse cx="56" cy="30" rx="52" ry="24" fill={exShade(wood, 12)} />
      <ellipse cx="56" cy="30" rx="34" ry="15" fill={exShade(wood, 20)} opacity=".5" />
      <path d="M34 42 L30 62 M78 42 L82 62 M56 48 L56 66" stroke={exShade(wood, -28)} strokeWidth="4" strokeLinecap="round" />
    </ExSprite>);
};
EX1['trunk-storage'] = () => {
  const wood = '#8c6a44';
  return (
    <ExSprite w={104} h={72}>
      <ExBox cx={52} cy={48} a={50} b={25} hh={30} base={wood} />
      <polygon points="2,23 52,48 52,54 2,29" fill="#c2a05e" opacity=".9" />
      <polygon points="52,48 102,23 102,29 52,54" fill="#a88a4c" opacity=".9" />
      <rect x="48" y="34" width="8" height="7" rx="1.5" fill="#e0c070" />
      <polygon points="52,23 76,11 76,17 52,29" fill={exShade(wood, 26)} opacity=".55" />
    </ExSprite>);
};
EX1['dresser-oak'] = () => {
  const wood = '#9c7848';
  return (
    <ExSprite w={104} h={110}>
      <ExBox cx={52} cy={86} a={50} b={25} hh={66} base={wood} />
      {[0, 1, 2].map((i) =>
      <g key={i}>
          <polygon points={`2,${34 + i * 20} 52,${59 + i * 20} 52,${75 + i * 20} 2,${50 + i * 20}`} fill={exShade(wood, -34)} opacity=".55" />
          <circle cx="27" cy={55 + i * 20} r="2.4" fill="#e6cd92" />
        </g>
      )}
      <polygon points="52,20 102,45 102,49 52,24" fill={exShade(wood, 26)} opacity=".5" />
    </ExSprite>);
};

// ── Seating ─────────────────────────────────────────────────────────────
EX1['pouf-knit'] = () => (
  <ExSprite w={70} h={52}>
    <ellipse cx="35" cy="38" rx="30" ry="12" fill="#b8907c" />
    <ellipse cx="35" cy="30" rx="30" ry="13" fill="#d3ab92" />
    <ellipse cx="35" cy="24" rx="24" ry="9" fill="#e5c3aa" />
    <path d="M14 30 Q35 38 56 30 M18 24 Q35 31 52 24" stroke="#c09a83" strokeWidth="1.6" fill="none" />
  </ExSprite>);
EX1['floor-cushion'] = () => (
  <ExSprite w={78} h={40}>
    <ellipse cx="39" cy="27" rx="34" ry="12" fill="#8f9e88" />
    <ellipse cx="39" cy="22" rx="34" ry="12" fill="#a9b9a0" />
    <ellipse cx="39" cy="21" rx="7" ry="3" fill="#8f9e88" />
    <path d="M8 22 Q39 34 70 22" stroke="#8f9e88" strokeWidth="1.4" fill="none" />
  </ExSprite>);
EX1['desk-chair-wood'] = () => {
  const wood = '#a8824e';
  return (
    <ExSprite w={64} h={92}>
      <polygon points="10,36 32,25 32,60 10,71" fill={exShade(wood, 4)} />
      <polygon points="32,25 54,36 54,71 32,60" fill={exShade(wood, -16)} />
      <ExBox cx={32} cy={70} a={26} b={13} hh={8} base={wood} />
      <path d="M8 72 L10 88 M56 72 L54 88 M32 83 L32 92" stroke={exShade(wood, -30)} strokeWidth="3.5" strokeLinecap="round" />
    </ExSprite>);
};
EX1['rocking-chair'] = () => {
  const wood = '#8f6a40';
  return (
    <ExSprite w={78} h={100}>
      <polygon points="16,44 40,31 40,66 16,79" fill={exShade(wood, 2)} />
      <polygon points="40,31 64,44 64,79 40,66" fill={exShade(wood, -18)} />
      <ExBox cx={40} cy={76} a={30} b={15} hh={8} base={wood} />
      <path d="M12 84 Q40 98 68 84" stroke={exShade(wood, -26)} strokeWidth="4" fill="none" strokeLinecap="round" />
      <polygon points="22,40 40,31 40,40 22,49" fill="#c69a92" opacity=".85" />
    </ExSprite>);
};
EX1['stool-wood'] = () => {
  const wood = '#b08c58';
  return (
    <ExSprite w={54} h={54}>
      <ExBox cx={27} cy={34} a={25} b={12} hh={7} base={wood} />
      <path d="M6 36 L9 50 M48 36 L45 50 M27 42 L27 53" stroke={exShade(wood, -28)} strokeWidth="3.5" strokeLinecap="round" />
    </ExSprite>);
};

// ── Lighting ────────────────────────────────────────────────────────────
EX1['lantern-paper'] = ({ daynight }) => {
  const on = daynight < 0.4 || daynight > 0.75;
  return (
    <ExSprite w={56} h={92} extra={on ? <div style={exGlow('rgba(255,224,160,.45)', 92)} /> : null}>
      <ellipse cx="28" cy="86" rx="14" ry="4" fill="#7a6242" />
      <rect x="26" y="58" width="4" height="28" fill="#8a6a42" />
      <ellipse cx="28" cy="36" rx="20" ry="22" fill={on ? '#fbe6b0' : '#e2dccb'} />
      <path d="M14 22 Q28 30 42 22 M10 36 Q28 44 46 36 M14 50 Q28 58 42 50" stroke={on ? '#e8c887' : '#cfc7b2'} strokeWidth="1.3" fill="none" />
      <rect x="22" y="12" width="12" height="4" rx="1.5" fill="#8a6a42" />
    </ExSprite>);
};
EX1['salt-lamp'] = ({ daynight }) => {
  const on = daynight < 0.4 || daynight > 0.75;
  return (
    <ExSprite w={38} h={46} extra={on ? <div style={exGlow('rgba(255,168,110,.5)', 56)} /> : null}>
      <ellipse cx="19" cy="41" rx="12" ry="4" fill="#6a4a2a" />
      <path d="M8 40 Q6 22 14 12 Q19 6 24 12 Q32 22 30 40 Z" fill={on ? '#e78b56' : '#c48269'} />
      <path d="M14 12 Q19 22 16 40" stroke={on ? '#f6b183' : '#d29a83'} strokeWidth="2" fill="none" />
    </ExSprite>);
};
EX1['arc-lamp-modern'] = ({ daynight }) => {
  const on = daynight < 0.4 || daynight > 0.75;
  return (
    <ExSprite w={110} h={180} extra={on ? <div style={{ ...exGlow('rgba(255,232,180,.4)', 120), left: '18%', bottom: '60%' }} /> : null}>
      <ellipse cx="86" cy="172" rx="20" ry="6" fill="#6e6a62" />
      <path d="M86 170 Q86 40 30 34" stroke="#8d8a80" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M12 34 L48 34 L40 58 L20 58 Z" fill={on ? '#f5dc9a' : '#b7b1a2'} />
      <ellipse cx="30" cy="58" rx="10" ry="3" fill={on ? '#fff0c8' : '#c9c3b4'} />
    </ExSprite>);
};

// ── Plants ──────────────────────────────────────────────────────────────
EX1['cactus-tall'] = () => (
  <ExSprite w={54} h={110}>
    <path d="M12 104 L42 104 L38 84 L16 84 Z" fill="#c08a68" />
    <path d="M12 104 L42 104 L38 84 L16 84 Z" fill="#000" opacity=".07" />
    <rect x="21" y="30" width="12" height="56" rx="6" fill="#6f9464" />
    <rect x="9" y="52" width="9" height="26" rx="4.5" fill="#628757" />
    <rect x="36" y="44" width="9" height="32" rx="4.5" fill="#7a9f6d" />
    <path d="M27 34 L27 82 M13.5 56 L13.5 74 M40.5 48 L40.5 72" stroke="#54754a" strokeWidth="1.2" />
  </ExSprite>);
EX1['bonsai-tree'] = () => (
  <ExSprite w={66} h={70}>
    <path d="M14 64 L52 64 L48 52 L18 52 Z" fill="#8a6a5a" />
    <path d="M33 52 Q31 40 24 34 M33 46 Q38 38 45 34" stroke="#6a4a34" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <ellipse cx="22" cy="30" rx="14" ry="9" fill="#6f9464" />
    <ellipse cx="45" cy="28" rx="12" ry="8" fill="#7ea472" />
    <ellipse cx="33" cy="20" rx="10" ry="6.5" fill="#8ab07c" />
  </ExSprite>);
EX1['palm-potted'] = () => (
  <ExSprite w={72} h={128}>
    <path d="M20 122 L52 122 L48 100 L24 100 Z" fill="#cbb08a" />
    <path d="M36 100 L36 56" stroke="#8a6a42" strokeWidth="4" />
    <path d="M36 58 Q18 48 8 26 M36 58 Q54 48 64 26 M36 54 Q24 34 26 12 M36 54 Q48 34 46 12 M36 56 Q36 34 36 8"
    stroke="#5f8a58" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M36 58 Q22 50 12 32 M36 58 Q50 50 60 32" stroke="#78a56d" strokeWidth="3" fill="none" strokeLinecap="round" />
  </ExSprite>);
EX1['pampas-vase'] = () => (
  <ExSprite w={60} h={122}>
    <path d="M20 118 Q14 84 24 74 L36 74 Q46 84 40 118 Z" fill="#d8c6a8" />
    <path d="M30 74 L30 40 M30 60 Q20 42 14 22 M30 60 Q40 42 46 22 M30 52 Q24 30 22 10 M30 52 Q36 30 38 10"
    stroke="#c2ad86" strokeWidth="2" fill="none" />
    {[[14, 22], [46, 22], [22, 10], [38, 10], [30, 6]].map((p, i) =>
    <ellipse key={i} cx={p[0]} cy={p[1]} rx="6" ry="10" fill="#e3d4b6" opacity=".9" />
    )}
  </ExSprite>);

// ── Music ───────────────────────────────────────────────────────────────
EX1['guitar-acoustic'] = () => (
  <ExSprite w={62} h={132}>
    <path d="M18 126 L44 126 M31 126 L31 96" stroke="#6a5a44" strokeWidth="3" strokeLinecap="round" />
    <ellipse cx="31" cy="92" rx="24" ry="26" fill="#c98f52" />
    <ellipse cx="31" cy="66" rx="18" ry="18" fill="#c98f52" />
    <circle cx="31" cy="86" r="8" fill="#5e3f22" />
    <rect x="27" y="14" width="8" height="42" fill="#7a5230" />
    <rect x="25" y="6" width="12" height="12" rx="2" fill="#5e3f22" />
    <path d="M31 60 L31 112" stroke="#eadfc6" strokeWidth="1" opacity=".8" />
    <rect x="24" y="104" width="14" height="4" rx="1" fill="#5e3f22" />
  </ExSprite>);
EX1['record-player'] = () => (
  <ExSprite w={90} h={60}>
    <ExBox cx={45} cy={40} a={42} b={20} hh={12} base="#a8824e" />
    <ellipse cx="42" cy="26" rx="22" ry="10" fill="#2c2c30" />
    <ellipse cx="42" cy="26" rx="7" ry="3" fill="#c9743e" />
    <path d="M72 18 L62 27" stroke="#d8d2c4" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="73" cy="17" r="3" fill="#b9b2a2" />
  </ExSprite>);
EX1['vinyl-crate'] = () => (
  <ExSprite w={72} h={62}>
    <ExBox cx={36} cy={44} a={34} b={17} hh={26} base="#8c6a44" />
    {[0, 1, 2, 3].map((i) =>
    <polygon key={i} points={`${10 + i * 5},${20 - i * 1} ${36 + i * 5},${33 - i * 1} ${36 + i * 5},${37 - i} ${10 + i * 5},${24 - i}`}
    fill={['#c9743e', '#3f6f7a', '#d8b86a', '#8a5a8a'][i]} />
    )}
  </ExSprite>);
EX1['piano-upright'] = () => (
  <ExSprite w={150} h={130}>
    <ExBox cx={75} cy={104} a={72} b={26} hh={78} base="#4a3a34" />
    <polygon points="8,50 75,74 75,84 8,60" fill="#f2ecdd" />
    {[...Array(9)].map((_, i) =>
    <polygon key={i} points={`${12 + i * 7},${52 + i * 2.5} ${16 + i * 7},${54 + i * 2.5} ${16 + i * 7},${60 + i * 2.5} ${12 + i * 7},${58 + i * 2.5}`} fill="#2c2620" />
    )}
    <polygon points="8,28 75,52 75,58 8,34" fill="#5c4a42" />
    <polygon points="75,52 142,28 142,34 75,58" fill="#3d302b" />
  </ExSprite>);
EX1['speaker-vintage'] = () => (
  <ExSprite w={58} h={100}>
    <ExBox cx={29} cy={82} a={27} b={13} hh={62} base="#7a5a3e" />
    <polygon points="4,28 29,41 29,72 4,59" fill="#d9cdb4" opacity=".9" />
    <ellipse cx="16" cy="48" rx="8" ry="9" fill="#5a4a3a" transform="rotate(-27 16 48)" />
    <ellipse cx="18" cy="65" rx="5" ry="5.5" fill="#5a4a3a" transform="rotate(-27 18 65)" />
  </ExSprite>);

Object.assign(window.EXTRA_RENDERERS = window.EXTRA_RENDERERS || {}, EX1);
Object.assign(window, { ExBox, ExSprite, exShade, exFaces, exGlow });
