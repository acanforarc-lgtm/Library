// Extra catalog pieces, part 2 — tech, wellness, hobby, sports, kids, pets,
// and wall-hung decor. Registered into window.EXTRA_RENDERERS (see part 1).

const EX2 = {};
const ex2Shade = window.exShade;
const ExBox2 = window.ExBox, ExSprite2 = window.ExSprite, exGlow2 = window.exGlow;

// ── Gaming & tech ───────────────────────────────────────────────────────
EX2['tv-stand'] = ({ daynight }) => {
  const on = daynight < 0.4 || daynight > 0.75;
  return (
    <ExSprite2 w={150} h={110} extra={on ? <div style={{ ...exGlow2('rgba(140,190,235,.35)', 120), bottom: '50%' }} /> : null}>
      <ExBox2 cx={75} cy={94} a={70} b={22} hh={26} base="#8c6a44" />
      <polygon points="20,26 75,46 75,74 20,54" fill="#2a2a2e" />
      <polygon points="75,46 130,26 130,54 75,74" fill="#1e1e22" />
      <polygon points="24,29 75,48 75,70 24,51" fill={on ? '#5c86a8' : '#3c4048'} />
      <polygon points="75,48 126,29 126,51 75,70" fill={on ? '#4a708e' : '#33373e'} />
      <rect x="72" y="72" width="6" height="10" fill="#2a2a2e" />
    </ExSprite2>);
};
EX2['arcade-cabinet'] = ({ daynight }) => {
  const on = daynight < 0.45 || daynight > 0.7;
  return (
    <ExSprite2 w={86} h={160} extra={on ? <div style={{ ...exGlow2('rgba(200,120,220,.35)', 90), bottom: '55%' }} /> : null}>
      <ExBox2 cx={43} cy={140} a={40} b={20} hh={120} base="#4a3f66" />
      <polygon points="6,44 43,62 43,86 6,68" fill={on ? '#7ce0d8' : '#3b4a58'} />
      <polygon points="43,62 80,44 80,68 43,86" fill={on ? '#5ec0bc' : '#31414e'} />
      <polygon points="6,90 43,108 43,120 6,102" fill="#2f2844" />
      <circle cx="20" cy="102" r="4" fill="#e0655a" />
      <circle cx="31" cy="108" r="3.5" fill="#e9c25c" />
      <polygon points="6,20 43,38 43,46 6,28" fill={on ? '#e06fb0' : '#5a4a68'} />
      <polygon points="43,38 80,20 80,28 43,46" fill={on ? '#b95a94' : '#4a3d58'} />
    </ExSprite2>);
};
EX2['gaming-desk'] = ({ daynight }) => {
  const on = daynight < 0.45 || daynight > 0.7;
  return (
    <ExSprite2 w={150} h={116} extra={on ? <div style={{ ...exGlow2('rgba(120,160,240,.32)', 130), bottom: '48%' }} /> : null}>
      <ExBox2 cx={75} cy={94} a={72} b={30} hh={14} base="#3f3b44" />
      <rect x="12" y="82" width="5" height="26" fill="#2c2930" />
      <rect x="133" y="82" width="5" height="26" fill="#2c2930" />
      <polygon points="30,30 75,46 75,74 30,58" fill="#26262c" />
      <polygon points="75,46 120,30 120,58 75,74" fill="#1c1c22" />
      <polygon points="34,33 75,48 75,70 34,55" fill={on ? '#5f7fd8' : '#3a3e4a'} />
      <polygon points="75,48 116,33 116,55 75,70" fill={on ? '#4a68b8' : '#32363f'} />
      <ExBox2 cx={52} cy={84} a={16} b={8} hh={4} base="#5a5560" />
      <ellipse cx="98" cy="82" rx="7" ry="4" fill="#5a5560" />
    </ExSprite2>);
};
EX2['desk-pc-tower'] = () => (
  <ExSprite2 w={54} h={92}>
    <ExBox2 cx={27} cy={78} a={25} b={12} hh={62} base="#33323a" />
    <polygon points="4,30 27,42 27,68 4,56" fill="#7fa8e8" opacity=".55" />
    <circle cx="15" cy="38" r="2.4" fill="#7ce0d8" />
  </ExSprite2>);

// ── Wellness ────────────────────────────────────────────────────────────
EX2['yoga-mat'] = () => (
  <ExSprite2 w={132} h={72}>
    <polygon points="66,8 128,39 66,64 4,33" fill="#8fa9b8" />
    <polygon points="66,12 120,39 66,60 12,33" fill="#a4c0cf" />
    <path d="M28 32 L98 32" stroke="#8fa9b8" strokeWidth="1.5" opacity=".7" />
  </ExSprite2>);
EX2['meditation-cushion'] = () => (
  <ExSprite2 w={64} h={44}>
    <ellipse cx="32" cy="30" rx="27" ry="11" fill="#8a6a8c" />
    <ellipse cx="32" cy="22" rx="27" ry="12" fill="#a688a8" />
    <ellipse cx="32" cy="21" rx="6" ry="2.5" fill="#8a6a8c" />
  </ExSprite2>);
EX2['fireplace-stone'] = ({ daynight }) => {
  const on = daynight < 0.45 || daynight > 0.7;
  return (
    <ExSprite2 w={132} h={124} extra={on ? <div style={{ ...exGlow2('rgba(255,150,70,.4)', 120), bottom: '25%' }} /> : null}>
      <ExBox2 cx={66} cy={108} a={62} b={24} hh={86} base="#9a8f80" />
      <polygon points="14,52 66,74 66,100 14,78" fill="#3a2e28" />
      <polygon points="66,74 118,52 118,78 66,100" fill="#2e2420" />
      {on &&
      <g>
          <path d="M40 92 Q46 72 52 92 Z" fill="#c9552a" />
          <path d="M38 94 Q48 68 58 94 Z" fill="#e8863a" />
          <path d="M44 94 Q50 78 56 94 Z" fill="#f7d06a" />
        </g>
      }
      <polygon points="66,72 118,50 118,54 66,76" fill="#b3a696" />
      <polygon points="14,50 66,72 66,76 14,54" fill="#c2b5a4" />
    </ExSprite2>);
};
EX2['floor-mirror'] = () => (
  <ExSprite2 w={70} h={158}>
    <path d="M18 150 L52 150 M35 150 L35 138" stroke="#8a6a42" strokeWidth="4" strokeLinecap="round" />
    <rect x="8" y="6" width="54" height="136" rx="27" fill="#a8824e" />
    <rect x="13" y="11" width="44" height="126" rx="22" fill="#dfe7ec" />
    <path d="M20 110 L50 34" stroke="#f4f8fa" strokeWidth="8" opacity=".8" />
  </ExSprite2>);
EX2['tea-set'] = () => (
  <ExSprite2 w={46} h={34}>
    <ellipse cx="23" cy="28" rx="19" ry="5" fill="#d8cbb2" />
    <path d="M10 26 Q8 12 20 12 Q32 12 30 26 Z" fill="#eae1cd" />
    <path d="M30 16 Q38 18 34 24" stroke="#eae1cd" strokeWidth="3" fill="none" />
    <ellipse cx="20" cy="12" rx="10" ry="3" fill="#c9b79a" />
    <ellipse cx="38" cy="26" rx="6" ry="2.5" fill="#eae1cd" />
  </ExSprite2>);

// ── Hobbies ─────────────────────────────────────────────────────────────
EX2['easel-painting'] = () => (
  <ExSprite2 w={96} h={140}>
    <path d="M20 134 L44 44 M76 134 L52 44 M48 40 L48 120" stroke="#a8824e" strokeWidth="4" strokeLinecap="round" />
    <path d="M26 96 L70 96" stroke="#8a6a42" strokeWidth="4" strokeLinecap="round" />
    <rect x="18" y="34" width="60" height="60" fill="#f1e9d7" stroke="#c2ae86" strokeWidth="2" />
    <path d="M22 82 Q40 58 54 74 Q64 84 74 70 L74 90 L22 90 Z" fill="#8fae86" />
    <circle cx="60" cy="48" r="7" fill="#e8b86a" />
  </ExSprite2>);
EX2['telescope'] = () => (
  <ExSprite2 w={90} h={140}>
    <path d="M30 134 L46 92 M62 134 L46 92 M46 134 L46 92" stroke="#7a6a52" strokeWidth="3.5" strokeLinecap="round" />
    <rect x="18" y="46" width="58" height="16" rx="8" fill="#4f5a68" transform="rotate(-24 47 54)" />
    <circle cx="72" cy="34" r="10" fill="#3c4552" />
    <circle cx="72" cy="34" r="6" fill="#8fa8c4" />
    <rect x="14" y="62" width="12" height="8" rx="3" fill="#c9a45a" transform="rotate(-24 20 66)" />
  </ExSprite2>);
EX2['chess-table'] = () => (
  <ExSprite2 w={92} h={78}>
    <ExBox2 cx={46} cy={54} a={43} b={21} hh={10} base="#8c6a44" />
    <g>
      {[...Array(4)].map((_, r) =>
      [...Array(4)].map((_, c) => {
        const x = 46 + (c - r) * 9.5, y = 34 + (c + r) * 4.75;
        return <polygon key={r + '-' + c} points={`${x},${y - 4.75} ${x + 9.5},${y} ${x},${y + 4.75} ${x - 9.5},${y}`}
        fill={(r + c) % 2 ? '#f0e6cf' : '#5b4632'} />;
      })
      )}
    </g>
    <path d="M40 30 L40 22 M52 34 L52 26" stroke="#2c2620" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M8 56 L11 72 M84 56 L81 72" stroke="#6d5334" strokeWidth="3.5" strokeLinecap="round" />
  </ExSprite2>);
EX2['camera-tripod'] = () => (
  <ExSprite2 w={80} h={140}>
    <path d="M24 134 L40 60 M56 134 L40 60 M40 134 L40 60" stroke="#4a4640" strokeWidth="3.5" strokeLinecap="round" />
    <rect x="22" y="34" width="38" height="24" rx="4" fill="#2f2c28" />
    <circle cx="41" cy="46" r="9" fill="#5e6a76" />
    <circle cx="41" cy="46" r="4.5" fill="#9fb3c4" />
    <rect x="46" y="28" width="10" height="7" rx="2" fill="#2f2c28" />
  </ExSprite2>);

// ── Sports & outdoors ───────────────────────────────────────────────────
EX2['surfboard-leaning'] = () => (
  <ExSprite2 w={70} h={170}>
    <path d="M30 166 Q4 90 26 14 Q34 2 42 14 Q64 90 38 166 Z" fill="#e9e2d2" transform="rotate(9 34 84)" />
    <path d="M34 20 L34 158" stroke="#c9743e" strokeWidth="5" opacity=".85" transform="rotate(9 34 84)" />
    <path d="M34 20 L34 158" stroke="#3f7f8c" strokeWidth="1.6" transform="rotate(9 34 84)" />
  </ExSprite2>);
EX2['skateboard-deck'] = () => (
  <ExSprite2 w={56} h={126}>
    <path d="M20 120 Q8 118 10 106 Q12 96 22 96 L34 20 Q38 6 46 10 Q54 16 48 26 L34 106 Q32 120 20 120 Z" fill="#7a4a6a" />
    <ellipse cx="24" cy="104" rx="6" ry="4" fill="#e0d2b8" />
    <ellipse cx="42" cy="24" rx="6" ry="4" fill="#e0d2b8" />
    <path d="M22 96 L44 20" stroke="#a86a92" strokeWidth="2" opacity=".7" />
  </ExSprite2>);
EX2['bicycle'] = () => (
  <ExSprite2 w={150} h={90}>
    <circle cx="34" cy="62" r="24" fill="none" stroke="#3d3a36" strokeWidth="4" />
    <circle cx="116" cy="62" r="24" fill="none" stroke="#3d3a36" strokeWidth="4" />
    <circle cx="34" cy="62" r="12" fill="none" stroke="#8d8a82" strokeWidth="1.4" />
    <circle cx="116" cy="62" r="12" fill="none" stroke="#8d8a82" strokeWidth="1.4" />
    <path d="M34 62 L70 62 L88 26 L116 62 M70 62 L88 26 M62 30 L92 30 M75 62 L88 26" stroke="#3f7f8c" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M56 26 Q66 22 74 28" stroke="#5b4632" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M116 62 L116 24 L104 20" stroke="#3f7f8c" strokeWidth="4" fill="none" strokeLinecap="round" />
  </ExSprite2>);

// ── Kids & whimsy ───────────────────────────────────────────────────────
EX2['teddy-bear'] = () => (
  <ExSprite2 w={48} h={56}>
    <ellipse cx="24" cy="42" rx="14" ry="11" fill="#c08f5e" />
    <circle cx="24" cy="22" r="12" fill="#cd9b68" />
    <circle cx="14" cy="12" r="5" fill="#b8845a" />
    <circle cx="34" cy="12" r="5" fill="#b8845a" />
    <ellipse cx="24" cy="26" rx="6" ry="4.5" fill="#e6c8a2" />
    <circle cx="19" cy="19" r="1.7" fill="#3a2a1c" />
    <circle cx="29" cy="19" r="1.7" fill="#3a2a1c" />
    <circle cx="24" cy="25" r="2" fill="#3a2a1c" />
    <ellipse cx="10" cy="42" rx="5" ry="7" fill="#b8845a" />
    <ellipse cx="38" cy="42" rx="5" ry="7" fill="#b8845a" />
  </ExSprite2>);
EX2['rocking-horse'] = () => (
  <ExSprite2 w={96} h={80}>
    <path d="M14 70 Q48 82 82 70" stroke="#a8824e" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M26 68 L34 44 M68 68 L60 44" stroke="#a8824e" strokeWidth="4" strokeLinecap="round" />
    <ellipse cx="47" cy="40" rx="26" ry="13" fill="#e0d2b8" />
    <path d="M66 38 Q78 30 74 18 L64 24 Q60 30 60 36 Z" fill="#e0d2b8" />
    <path d="M70 20 Q60 26 58 34" stroke="#c9743e" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M22 38 Q10 34 8 44" stroke="#c9743e" strokeWidth="4" fill="none" strokeLinecap="round" />
    <circle cx="70" cy="26" r="1.8" fill="#3a2a1c" />
  </ExSprite2>);
EX2['toy-blocks'] = () => (
  <ExSprite2 w={70} h={62}>
    <ExBox2 cx={26} cy={52} a={16} b={8} hh={16} base="#c9743e" />
    <ExBox2 cx={50} cy={50} a={15} b={7.5} hh={15} base="#5b8fa8" />
    <ExBox2 cx={34} cy={34} a={15} b={7.5} hh={15} base="#e0b45a" />
  </ExSprite2>);

// ── Pets & critters ─────────────────────────────────────────────────────
EX2['fish-tank'] = ({ daynight }) => {
  const on = daynight < 0.45 || daynight > 0.7;
  return (
    <ExSprite2 w={116} h={120} extra={on ? <div style={{ ...exGlow2('rgba(110,190,220,.32)', 100), bottom: '45%' }} /> : null}>
      <ExBox2 cx={58} cy={110} a={54} b={20} hh={30} base="#7a5a3e" />
      <polygon points="8,42 58,62 58,92 8,72" fill="#79b6c9" opacity=".85" />
      <polygon points="58,62 108,42 108,72 58,92" fill="#5f9db2" opacity=".85" />
      <polygon points="8,72 58,92 58,98 8,78" fill="#d9c9a4" />
      <polygon points="58,92 108,72 108,78 58,98" fill="#c6b590" />
      <path d="M28 78 Q26 64 32 58 M40 80 Q42 66 36 60" stroke="#4f8f6a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <g fill="#e8973f"><ellipse cx="70" cy="70" rx="6" ry="3.5" /><polygon points="76,70 82,66 82,74" /></g>
      <g fill="#e0c05a"><ellipse cx="86" cy="82" rx="4.5" ry="2.6" /><polygon points="90,82 95,79 95,85" /></g>
      <polygon points="8,40 58,60 58,64 8,44" fill="#5a4636" />
      <polygon points="58,60 108,40 108,44 58,64" fill="#493729" />
    </ExSprite2>);
};
EX2['dog-bed'] = () => (
  <ExSprite2 w={92} h={50}>
    <ellipse cx="46" cy="34" rx="42" ry="15" fill="#8f9e88" />
    <ellipse cx="46" cy="30" rx="42" ry="15" fill="#a9b9a0" />
    <ellipse cx="46" cy="30" rx="30" ry="10" fill="#8a7f6e" />
    <ellipse cx="46" cy="29" rx="26" ry="8" fill="#cbbfa6" />
  </ExSprite2>);
EX2['cat-tower'] = () => (
  <ExSprite2 w={92} h={166}>
    <ExBox2 cx={46} cy={156} a={44} b={20} hh={12} base="#a89a84" />
    <rect x="38" y="70" width="16" height="80" fill="#c9b79a" />
    <path d="M38 78 L54 78 M38 92 L54 92 M38 106 L54 106 M38 120 L54 120 M38 134 L54 134" stroke="#b3a184" strokeWidth="2" />
    <ExBox2 cx={46} cy={78} a={34} b={15} hh={10} base="#b8ab94" />
    <ellipse cx="46" cy="62" rx="20" ry="9" fill="#8a7f6e" />
    <ellipse cx="46" cy="60" rx="17" ry="7" fill="#cbbfa6" />
    <circle cx="74" cy="106" r="7" fill="#c9743e" />
    <path d="M74 99 L74 84" stroke="#b3a184" strokeWidth="1.6" />
  </ExSprite2>);
EX2['bird-cage'] = () => (
  <ExSprite2 w={72} h={124}>
    <ellipse cx="36" cy="112" rx="26" ry="9" fill="#a8824e" />
    <path d="M10 112 Q10 40 36 30 Q62 40 62 112" fill="none" stroke="#c2a86a" strokeWidth="3" />
    <path d="M22 114 Q20 44 36 32 M36 116 L36 32 M50 114 Q52 44 36 32" stroke="#c2a86a" strokeWidth="2" fill="none" />
    <path d="M12 74 Q36 82 60 74" stroke="#c2a86a" strokeWidth="2" fill="none" />
    <path d="M36 30 L36 16 M28 16 Q36 6 44 16" stroke="#c2a86a" strokeWidth="3" fill="none" />
    <ellipse cx="34" cy="66" rx="8" ry="6" fill="#e0c05a" />
    <circle cx="41" cy="61" r="4.5" fill="#e8cd6e" />
    <circle cx="43" cy="60" r="1.2" fill="#3a2a1c" />
  </ExSprite2>);

// ── Wall pieces (type: art) ─────────────────────────────────────────────
const ExWall = ({ w, h, children, extra }) => (
  <div className="furniture art" style={{ width: w, height: h }}>
    <div className="art-frame" style={{ width: w, height: h }}>
      <div className="art-inner">
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%">{children}</svg>
      </div>
    </div>
    {extra}
  </div>);
// Frameless wall objects (neon, pennants, instruments) skip the art frame.
const ExWallBare = ({ w, h, children, extra }) => (
  <div className="furniture" style={{ width: w, height: h, position: 'relative' }}>
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>{children}</svg>
    {extra}
  </div>);

EX2['neon-sign'] = ({ daynight }) => {
  const on = daynight < 0.5 || daynight > 0.65;
  const c = on ? '#ff7ac6' : '#7a5a6a';
  return (
    <ExWallBare w={110} h={60}
    extra={on ? <div style={{ position: 'absolute', inset: -20, background: 'radial-gradient(circle, rgba(255,110,190,.35), transparent 65%)', pointerEvents: 'none' }} /> : null}>
      <path d="M14 44 Q14 16 30 16 Q46 16 46 44 M30 16 L30 44" stroke={c} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M60 44 L60 16 Q78 16 78 30 Q78 44 60 44" stroke={c} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M90 14 L96 26 L90 30" stroke={on ? '#7ce0d8' : '#5a6a70'} strokeWidth="4" fill="none" strokeLinecap="round" />
    </ExWallBare>);
};
EX2['pennant-flag'] = () => (
  <ExWallBare w={90} h={54}>
    <polygon points="4,6 86,24 4,44" fill="#8a3a3a" />
    <polygon points="4,10 14,10 14,40 4,40" fill="#e9e0c8" />
    <path d="M26 20 L60 27 M26 30 L52 35" stroke="#e9e0c8" strokeWidth="4" strokeLinecap="round" />
  </ExWallBare>);
EX2['record-wall'] = () => (
  <ExWallBare w={96} h={96}>
    {[[26, 26, '#c9743e'], [70, 30, '#3f6f7a'], [32, 70, '#8a5a8a'], [72, 72, '#d8b86a']].map((r, i) =>
    <g key={i}>
        <circle cx={r[0]} cy={r[1]} r="19" fill="#2c2c30" />
        <circle cx={r[0]} cy={r[1]} r="8" fill={r[2]} />
        <circle cx={r[0]} cy={r[1]} r="1.8" fill="#f0ead8" />
      </g>
    )}
  </ExWallBare>);
EX2['film-poster'] = () => (
  <ExWall w={70} h={100}>
    <rect width="70" height="100" fill="#26303c" />
    <circle cx="35" cy="34" r="16" fill="#e8c05a" />
    <path d="M0 74 L22 52 L44 74 Z" fill="#3f5464" />
    <path d="M28 78 L48 58 L70 78 L70 100 L0 100 L0 74 Z" fill="#2f4050" />
    <circle cx="56" cy="18" r="3" fill="#f0e6cf" />
    <circle cx="14" cy="22" r="2" fill="#f0e6cf" />
  </ExWall>);
EX2['map-vintage'] = () => (
  <ExWall w={110} h={80}>
    <rect width="110" height="80" fill="#e5d6b4" />
    <path d="M12 54 Q26 32 44 40 Q60 46 72 30 Q84 18 100 26 L100 62 Q80 70 58 64 Q34 58 12 66 Z" fill="#a9bd96" />
    <path d="M0 40 L110 40 M55 0 L55 80" stroke="#c0a97c" strokeWidth="1" opacity=".7" />
    <circle cx="72" cy="46" r="3" fill="#b04a3a" />
  </ExWall>);
EX2['clock-wall'] = () => (
  <ExWallBare w={60} h={60}>
    <circle cx="30" cy="30" r="27" fill="#8c6a44" />
    <circle cx="30" cy="30" r="22" fill="#f2ecdd" />
    <path d="M30 30 L30 16 M30 30 L40 34" stroke="#3a2e24" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="30" cy="30" r="2" fill="#3a2e24" />
    {[0, 3, 6, 9].map((n) => {
      const a = n / 12 * Math.PI * 2 - Math.PI / 2;
      return <circle key={n} cx={30 + Math.cos(a) * 17} cy={30 + Math.sin(a) * 17} r="1.4" fill="#8a7a62" />;
    })}
  </ExWallBare>);
EX2['guitar-wall'] = () => (
  <ExWallBare w={54} h={120}>
    <rect x="23" y="8" width="8" height="46" fill="#7a5230" />
    <rect x="21" y="2" width="12" height="10" rx="2" fill="#5e3f22" />
    <ellipse cx="27" cy="66" rx="16" ry="16" fill="#c98f52" />
    <ellipse cx="27" cy="90" rx="21" ry="24" fill="#c98f52" />
    <circle cx="27" cy="84" r="7" fill="#5e3f22" />
    <rect x="21" y="102" width="12" height="4" rx="1" fill="#5e3f22" />
  </ExWallBare>);
EX2['shelf-floating'] = () => (
  <ExWallBare w={110} h={54}>
    <rect x="0" y="36" width="110" height="7" rx="2" fill="#a8824e" />
    <rect x="0" y="43" width="110" height="4" fill="#8a6a3e" />
    {[[12, 16], [22, 12], [31, 18], [40, 14]].map((b, i) =>
    <rect key={i} x={b[0]} y={36 - b[1]} width="8" height={b[1]} rx="1"
    fill={['#b04a3a', '#3f6f7a', '#d8b86a', '#8a5a8a'][i]} />
    )}
    <ellipse cx="76" cy="30" rx="9" ry="6" fill="#6f9464" />
    <path d="M70 36 L82 36 L80 30 L72 30 Z" fill="#c08a68" />
  </ExWallBare>);

Object.assign(window.EXTRA_RENDERERS = window.EXTRA_RENDERERS || {}, EX2);
