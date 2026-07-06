// scene.jsx — Isometric room: floor, walls, grid, item rendering, drag, zoom.
// Wall convention: back-left wall (north, behind scene) + back-right wall (west).
// Floor diamond opens toward the camera (south).

function Scene({ room, setRoom, account, daynight, gridVisible, snapToGrid,
  onClickShelf, selectedItemId, setSelectedItemId,
  onDropCatalogItem, catalog, theme, zoom, onZoom }) {
  const sceneRef = React.useRef(null);
  const stageRef = React.useRef(null);
  const [dragItemId, setDragItemId] = React.useState(null);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });

  const TILE = room.tileSize;
  const W = room.size.w,D = room.size.d;
  const isoW = (W + D) * TILE * 0.5;
  const isoH = (W + D) * TILE * 0.25;
  const wallH = 380;

  // World origin: we place tile (0,0) at the back of the floor diamond.
  // Screen mapping: screenX = (x - y) * TILE/2 + D*TILE/2 (so back tile = D*TILE/2)
  //                 screenY = (x + y) * TILE/4
  // Floor diamond corners:
  //   back  (x=0, y=0)       → (D*T/2, 0)
  //   right (x=W, y=0)       → ((W+D)*T/2, W*T/4)
  //   front (x=W, y=D)       → (W*T/2 ... wait. Let me re-do.
  // For an iso diamond opening "down", origin at top, we want:
  //   topCorner    = (x=0, y=0)     [back]
  //   rightCorner  = (x=W-1, y=0)
  //   bottomCorner = (x=W-1, y=D-1) [front]
  //   leftCorner   = (x=0, y=D-1)

  // ── coordinate helpers ─────────────────────────────────
  const tileCenterToScreen = (tx, ty) => {
    // center of tile in isometric space
    const sx = (tx - ty) * TILE * 0.5;
    const sy = (tx + ty) * TILE * 0.25;
    return { x: sx, y: sy };
  };

  const pxToTile = (clientX, clientY) => {
    const rect = stageRef.current.getBoundingClientRect();
    // stage pixel → scene-local pixel.
    // The scene element has CSS transform: translate(..., calc(-50% + pan.y + 40px)) scale(zoom).
    // The fixed +40px Y shift must be subtracted in display-pixel units BEFORE dividing
    // by zoom, otherwise drops land off by 40 display px.
    const cx = (clientX - rect.left - rect.width / 2) / zoom - pan.x;
    const cy = (clientY - rect.top - rect.height / 2 - 40) / zoom - pan.y;
    const tx = (cx / (TILE * 0.5) + cy / (TILE * 0.25)) / 2;
    const ty = (cy / (TILE * 0.25) - cx / (TILE * 0.5)) / 2;
    return { x: tx, y: ty };
  };

  // ── item drag (move) — only in edit mode ───────────────
  const onItemPointerDown = (e, item) => {
    e.stopPropagation();
    if (item.onWall) return;
    if (!document.body.classList.contains('edit-on')) return;
    setDragItemId(item.id);
    setSelectedItemId(item.id);
    const isHanging = item.styleId === 'fern-hanging' || item.styleId === 'string-lights';
    const startMouse = { x: e.clientX, y: e.clientY };
    // Hanging items move in pixel space; floor items in tile space.
    if (isHanging && item.pxX != null) {
      const startPx = { x: item.pxX, y: item.pxY };
      const move = (ev) => {
        const dx = (ev.clientX - startMouse.x) / zoom;
        const dy = (ev.clientY - startMouse.y) / zoom;
        const npx = startPx.x + dx;
        const npy = startPx.y + dy;
        setRoom((r) => ({ ...r, items: r.items.map((it) => it.id === item.id ? { ...it, pxX: npx, pxY: npy } : it) }));
      };
      const up = () => {
        setDragItemId(null);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      return;
    }
    const startTile = { x: item.x, y: item.y };
    const move = (ev) => {
      const dx = (ev.clientX - startMouse.x) / zoom;
      const dy = (ev.clientY - startMouse.y) / zoom;
      const tileDx = (dx / (TILE * 0.5) + dy / (TILE * 0.25)) / 2;
      const tileDy = (dy / (TILE * 0.25) - dx / (TILE * 0.5)) / 2;
      let nx = startTile.x + tileDx;
      let ny = startTile.y + tileDy;
      if (snapToGrid) { nx = Math.round(nx); ny = Math.round(ny); }
      nx = Math.max(0, Math.min(W, nx));
      ny = Math.max(0, Math.min(D, ny));
      setRoom((r) => ({ ...r, items: r.items.map((it) => it.id === item.id ? { ...it, x: nx, y: ny } : it) }));
    };
    const up = () => {
      setDragItemId(null);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // ── WALL item drag — slides along AND up/down the wall;
  // crosses to the adjacent wall when the cursor passes the corner.
  const onWallItemPointerDown = (e, item) => {
    e.stopPropagation();
    if (!document.body.classList.contains('edit-on')) return;
    setDragItemId(item.id);
    setSelectedItemId(item.id);

    // Capture initial offset between cursor and item's anchor so the item
    // doesn't snap to the cursor on pick-up.
    const rect = stageRef.current.getBoundingClientRect();
    const cursorScene = (cx, cy) => ({
      x: (cx - rect.left - rect.width / 2) / zoom - pan.x,
      y: (cy - rect.top - rect.height / 2 - 40) / zoom - pan.y,
    });
    const itemAnchorScene = (it) => {
      if (it.onWall === 'north') {
        const t = (it.x + 0.5) / W;
        const sx = cBack.x + (cRight.x - cBack.x) * t;
        const sy = cBack.y + (cRight.y - cBack.y) * t;
        return { x: sx, y: sy - (it.wallY != null ? it.wallY : wallH * 0.35) };
      } else {
        const t = (it.x + 0.5) / D;
        const sx = cBack.x + (cLeft.x - cBack.x) * t;
        const sy = cBack.y + (cLeft.y - cBack.y) * t;
        return { x: sx, y: sy - (it.wallY != null ? it.wallY : wallH * 0.35) };
      }
    };
    const start = cursorScene(e.clientX, e.clientY);
    const anchor0 = itemAnchorScene(item);
    const grabOffset = { x: anchor0.x - start.x, y: anchor0.y - start.y };

    const move = (ev) => {
      // Target anchor = cursor + grabOffset (in scene-local pixels)
      const c = cursorScene(ev.clientX, ev.clientY);
      const target = { x: c.x + grabOffset.x, y: c.y + grabOffset.y };
      // Pick wall by horizontal side of the back corner. Right of corner = north
      // (back-RIGHT) wall; left of corner = west (back-LEFT) wall.
      const wall = target.x >= cBack.x ? 'north' : 'west';
      const wallLen = wall === 'north' ? W : D;
      const endC = wall === 'north' ? cRight : cLeft;
      // Along-the-wall fraction from cBack to endC, using x-component
      // (avoids the y-component making the projection wonky when cursor is
      // high up on the wall).
      const denom = endC.x - cBack.x;
      const t = denom !== 0 ? (target.x - cBack.x) / denom : 0;
      let along = t * wallLen - 0.5;
      if (snapToGrid) along = Math.round(along);
      along = Math.max(0, Math.min(wallLen - 1, along));
      // Wall floor edge Y at this along position.
      const ts = (along + 0.5) / wallLen;
      const sy = cBack.y + (endC.y - cBack.y) * ts;
      let nWallY = sy - target.y;
      nWallY = Math.max(0, Math.min(wallH, nWallY));
      setRoom((r) => ({ ...r, items: r.items.map((it) => it.id === item.id ? { ...it, onWall: wall, x: along, wallY: nWallY } : it) }));
    };
    const up = () => {
      setDragItemId(null);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // ── drop from catalog ──────────────────────────────────
  const onDrop = (e) => {
    e.preventDefault();
    const data = e.dataTransfer.getData('application/x-catalog-item');
    if (!data) return;
    const cat = JSON.parse(data);
    const pos = pxToTile(e.clientX, e.clientY);
    const WALL_TYPES_HERE = new Set(['art', 'window']);
    if (WALL_TYPES_HERE.has(cat.type)) {
      // Wall drop: figure out which wall + along + wallY (height up the wall)
      // from cursor's scene-local pixel position.
      const rect = stageRef.current.getBoundingClientRect();
      const cx = (e.clientX - rect.left - rect.width / 2) / zoom - pan.x;
      const cy = (e.clientY - rect.top - rect.height / 2 - 40) / zoom - pan.y;
      // Decide wall by tile coords (same as before): nearer to y=0 (north) or x=0 (west)
      const wall = pos.y < pos.x ? 'north' : 'west';
      const cBackP = tileCenterToScreen(0, 0);
      const cLeftP = tileCenterToScreen(0, D);
      const cRightP = tileCenterToScreen(W, 0);
      // Along-wall position from cursor's cx
      let along;
      let wallY;
      if (wall === 'north') {
        const t = (cx - cBackP.x) / (cRightP.x - cBackP.x);
        along = t * W - 0.5;
        const floorY = cBackP.y + (cRightP.y - cBackP.y) * t;
        wallY = floorY - cy;
      } else {
        const t = (cx - cBackP.x) / (cLeftP.x - cBackP.x);
        along = t * D - 0.5;
        const floorY = cBackP.y + (cLeftP.y - cBackP.y) * t;
        wallY = floorY - cy;
      }
      if (snapToGrid) along = Math.round(along);
      const wallLen = wall === 'north' ? W : D;
      const itemW = cat.w || 2;
      along = Math.max(itemW / 2, Math.min(wallLen - itemW / 2, along));
      wallY = Math.max(0, Math.min(wallH, wallY));
      onDropCatalogItem(cat, along, 0, { onWall: wall, wallY });
    } else {
      // Floor drop. Storage uses tile corners; render adds +0.5. Subtract here.
      const isHanging = cat.styleId === 'fern-hanging' || cat.styleId === 'string-lights';
      if (isHanging) {
        // Hanging items can be placed ABOVE the floor diamond (near ceiling).
        // Store scene-local pixel coords (not tile coords) to avoid the
        // iso back-projection shooting the item to the far right.
        const rect = stageRef.current.getBoundingClientRect();
        const sx = (e.clientX - rect.left - rect.width / 2) / zoom - pan.x;
        const sy = (e.clientY - rect.top - rect.height / 2 - 40) / zoom - pan.y;
        onDropCatalogItem(cat, 0, 0, null, { pxX: sx, pxY: sy });
      } else {
        let x = pos.x - 0.5;
        let y = pos.y - 0.5;
        if (snapToGrid) { x = Math.round(x); y = Math.round(y); }
        x = Math.max(0, Math.min(W - 1, x));
        y = Math.max(0, Math.min(D - 1, y));
        onDropCatalogItem(cat, x, y);
      }
    }
  };

  // ── stage pan (left-click drag on empty floor, or anywhere with space/right-click) ──
  const onStageDown = (e) => {
    // Ignore clicks that originated on an item (they stop propagation)
    if (e.target.closest('.item-wrap') || e.target.closest('.wall-item')) return;
    // Ignore clicks on controls inside the stage
    if (e.target.closest('.zoom-controls')) return;
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
    let moved = false;
    const move = (ev) => {
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      setPan({ x: start.px + dx / zoom, y: start.py + dy / zoom });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (!moved) setSelectedItemId(null);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  // ── zoom (wheel / pinch) ───────────────────────────────
  React.useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const onWheel = (e) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      const nz = Math.max(0.3, Math.min(2.5, zoom + delta * zoom));
      onZoom(nz);
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [zoom, onZoom]);

  // ── Live catalog placement: cursor moves the item in real time ──
  // Owned by Scene so it can use pxToTile / coord helpers.
  const WALL_TYPES = new Set(['art', 'window']);

  const getStyle = (item) => {
    for (const c of catalog) for (const s of c.items) if (s.styleId === item.styleId) return s;
    return { styleId: item.styleId, type: item.type, w: 2, d: 2, h: 2 };
  };

  // ── lighting tint ──────────────────────────────────────
  const lightFilter = React.useMemo(() => {
    const t = daynight;
    if (t < 0.2) return 'brightness(.55) saturate(.7) hue-rotate(210deg)';
    if (t < 0.3) return 'brightness(.72) saturate(.85) hue-rotate(30deg)';
    if (t < 0.7) return 'brightness(1)';
    if (t < 0.85) return 'brightness(.88) saturate(1.1) hue-rotate(-10deg)';
    return 'brightness(.62) saturate(.75) hue-rotate(220deg)';
  }, [daynight]);

  // Sort items back-to-front for proper overlap.
  const sortedItems = [...room.items].sort((a, b) => {
    const aw = a.type === 'rug' ? -1 : 0;
    const bw = b.type === 'rug' ? -1 : 0;
    if (aw !== bw) return aw - bw;
    return a.y + a.x - (b.y + b.x);
  });
  const wallItems = sortedItems.filter((i) => i.onWall);
  const floorItems = sortedItems.filter((i) => !i.onWall);

  // Floor corners (in scene coords, scene origin at tile(0,0) center)
  const cBack = tileCenterToScreen(0, 0); // top
  const cRight = tileCenterToScreen(W, 0); // right
  const cFront = tileCenterToScreen(W, D); // bottom
  const cLeft = tileCenterToScreen(0, D); // left

  // Scene is a big absolute div that we translate & scale inside a stage.
  // We anchor tile (0,0) at scene (0,0).
  return (
    <div
      ref={stageRef}
      className={'room-stage-inner' + (gridVisible ? ' show-grid' : '')}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={onStageDown}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      style={{ filter: lightFilter, cursor: 'grab' }}>
      
      <div
        ref={sceneRef}
        className="scene"
        style={{
          position: 'absolute',
          left: '50%', top: '50%',
          transform: `translate(calc(-50% + ${pan.x}px), calc(-50% + ${pan.y}px + 40px)) scale(${zoom})`,
          transformOrigin: 'center center'
        }}>
        
        {/* ── BACK-LEFT WALL (north) ───────────────────────
                          Runs from cBack (top) to cLeft (bottom-left).
                          Height goes UP from the floor, so visual top is at (cBack.x, cBack.y - wallH)
                          This wall stretches along the y-axis (increasing y = west/front-left).
                          We implement via a 4-sided SVG polygon so orientation is always right. */}
        <svg className="walls-svg" width={isoW + 100} height={isoH + wallH + 100}
        style={{ position: 'absolute', left: -isoW / 2 - 50, top: -wallH - 50, pointerEvents: 'none' }}>
          <defs>
            <linearGradient id="wallNorth" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={theme.wallColor} />
              <stop offset="1" stopColor={shade(theme.wallColor, -14)} />
            </linearGradient>
            <linearGradient id="wallWest" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={shade(theme.wallColor, -10)} />
              <stop offset="1" stopColor={shade(theme.wallColor, -22)} />
            </linearGradient>
            <linearGradient id="floorGrad" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor={theme.floorBase} />
              <stop offset="1" stopColor={shade(theme.floorBase, -10)} />
            </linearGradient>
          </defs>
          <g transform={`translate(${isoW / 2 + 50} ${wallH + 50})`}>
            {/* North wall (back-left): from back corner going down-left */}
            <polygon
              points={`
                ${cBack.x},${cBack.y - wallH}
                ${cLeft.x},${cLeft.y - wallH}
                ${cLeft.x},${cLeft.y}
                ${cBack.x},${cBack.y}
              `}
              fill="url(#wallNorth)" />
            
            {/* West wall (back-right): from back corner going down-right */}
            <polygon
              points={`
                ${cBack.x},${cBack.y - wallH}
                ${cRight.x},${cRight.y - wallH}
                ${cRight.x},${cRight.y}
                ${cBack.x},${cBack.y}
              `}
              fill="url(#wallWest)" />
            
            {/* Corner seam */}
            <line x1={cBack.x} y1={cBack.y - wallH} x2={cBack.x} y2={cBack.y}
            stroke="rgba(0,0,0,.15)" strokeWidth="1" />
            {/* Baseboards */}
            <polygon points={`${cBack.x},${cBack.y - 8} ${cLeft.x},${cLeft.y - 8} ${cLeft.x},${cLeft.y} ${cBack.x},${cBack.y}`}
            fill={shade(theme.wallColor, -28)} opacity=".85" />
            <polygon points={`${cBack.x},${cBack.y - 8} ${cRight.x},${cRight.y - 8} ${cRight.x},${cRight.y} ${cBack.x},${cBack.y}`}
            fill={shade(theme.wallColor, -34)} opacity=".85" />

            {/* Floor diamond */}
            <polygon
              points={`${cBack.x},${cBack.y} ${cRight.x},${cRight.y} ${cFront.x},${cFront.y} ${cLeft.x},${cLeft.y}`}
              fill="url(#floorGrad)" />
            
            {/* Plank lines (running along x-axis, spaced along y) */}
            {Array.from({ length: D + 1 }).map((_, yi) => {
              const a = tileCenterToScreen(0, yi);
              const b = tileCenterToScreen(W, yi);
              return <line key={'p' + yi} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={theme.floorLine} strokeWidth=".6" opacity=".35" />;
            })}
            {Array.from({ length: W + 1 }).map((_, xi) => {
              const a = tileCenterToScreen(xi, 0);
              const b = tileCenterToScreen(xi, D);
              return <line key={'q' + xi} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={theme.floorLine} strokeWidth=".3" opacity=".2" />;
            })}

            {/* Grid overlay */}
            {gridVisible && Array.from({ length: W }).map((_, xi) =>
            Array.from({ length: D }).map((_, yi) => {
              const a = tileCenterToScreen(xi, yi);
              const b = tileCenterToScreen(xi + 1, yi);
              const c = tileCenterToScreen(xi + 1, yi + 1);
              const d = tileCenterToScreen(xi, yi + 1);
              return (
                <polygon key={`g${xi}-${yi}`}
                points={`${a.x},${a.y} ${b.x},${b.y} ${c.x},${c.y} ${d.x},${d.y}`}
                fill="rgba(201,138,90,.06)" stroke="rgba(201,138,90,.5)"
                strokeDasharray="2 2" strokeWidth=".7" />);

            })
            )}

            {/* Window glow on floor */}
            {daynight >= 0.25 && daynight <= 0.85 &&
            <ellipse cx={cBack.x} cy={cBack.y + 80} rx="160" ry="50"
            fill="rgba(255,210,140,.25)" />
            }
          </g>
        </svg>

        {/* ── WALL ITEMS (art, windows) ─────────────────── */}
        {/* In 2:1 isometric:
                         - North wall (back-left): along-wall direction goes UP-RIGHT toward back corner (slope -0.5)
                           → skewY(-26.565°) tilts the sprite's top edge up to the right.
                         - West wall (back-right): along-wall direction goes DOWN-RIGHT (slope +0.5)
                           → skewY(+26.565°). */}
        <div className="wall-items">
          {wallItems.map((item) => {
            const st = getStyle(item);
            let anchor;
            const wallYpx = item.wallY != null ? item.wallY : wallH * 0.35;
            if (item.onWall === 'north') {
              // north = back-RIGHT wall (along x-axis, length = W tiles)
              const t = (item.x + 0.5) / W;
              const sx = cBack.x + (cRight.x - cBack.x) * t;
              const sy = cBack.y + (cRight.y - cBack.y) * t;
              anchor = { x: sx, y: sy - wallYpx, skew: 'skewY(26.565deg)' };
            } else {
              // west = back-LEFT wall (along y-axis, length = D tiles)
              const t = (item.x + 0.5) / D;
              const sx = cBack.x + (cLeft.x - cBack.x) * t;
              const sy = cBack.y + (cLeft.y - cBack.y) * t;
              anchor = { x: sx, y: sy - wallYpx, skew: 'skewY(-26.565deg)' };
            }
            return (
              <div key={item.id} className={'wall-item' + (selectedItemId === item.id ? ' selected' : '')}
              style={{
                left: anchor.x, top: anchor.y,
                transform: `translate(-50%, -100%) ${anchor.skew}`,
                transformOrigin: '50% 100%',
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                if (!document.body.classList.contains('edit-on')) {setSelectedItemId(item.id);return;}
                onWallItemPointerDown(e, item);
              }}>
                <Furniture item={item} style={st} daynight={daynight} />
              </div>);

          })}
        </div>

        {/* ── FLOOR ITEMS ─────────────────────────────── */}
        <div className="items-layer">
          {floorItems.map((item) => {
            const st = getStyle(item);
            const isHanging = item.styleId === 'fern-hanging' || item.styleId === 'string-lights';
            // Hanging items use scene-local pixel coords (pxX/pxY) instead of tile coords
            // so they can be placed anywhere on screen including above the floor diamond.
            const p = (isHanging && item.pxX != null)
              ? { x: item.pxX, y: item.pxY }
              : tileCenterToScreen(item.x + 0.5, item.y + 0.5);
            const shelf = item.type === 'shelf' ?
            window.MOCK_SHELVES.find((s) => s.id === item.id) :
            null;
            // Hanging items grab by their TOP (the rope/hook). Other items
            // sit on the floor (bottom-anchored). Rugs lie flat (center).
            const wrapTransform = isHanging
              ? 'translate(-50%, 0)'
              : (item.type === 'rug' ? 'translate(-50%, -50%)' : 'translate(-50%, -100%)');
            const wrapTop = p.y;
            return (
              <div key={item.id}
              className={'item-wrap' + (selectedItemId === item.id ? ' selected' : '') + (item.type === 'rug' ? ' rug-item' : '') + (isHanging ? ' hanging-item' : '')}
              style={{
                left: p.x, top: wrapTop,
                transform: wrapTransform,
                zIndex: Math.round((item.x + item.y) * 10),
                ['--rot']: (item.rotation || 0) % 360 + 'deg'
              }}
              onPointerDown={(e) => onItemPointerDown(e, item)}>
                
                <div className="item-rotor" style={{ transform: `rotate(${item.rotation || 0}deg)`, transformOrigin: 'center bottom' }}>
                <Furniture
                    item={item} style={st} shelf={shelf}
                    books={window.MOCK_BOOKS} daynight={daynight}
                    onClickShelf={onClickShelf}
                    selected={selectedItemId === item.id}
                    dragging={dragItemId === item.id} />
                  
                </div>
              </div>);

          })}
        </div>

        {/* Night overlay */}
        {(daynight < 0.25 || daynight > 0.8) &&
        <div className="night-overlay" style={{
          opacity: daynight < 0.2 || daynight > 0.88 ? 0.42 : 0.22,
          left: -isoW / 2 - 50, top: -wallH - 50,
          width: isoW + 100, height: isoH + wallH + 100
        }} />
        }

        {/* Selection toolbar (rotate / delete) */}
        {(() => {
          if (!selectedItemId) return null;
          if (!document.body.classList.contains('edit-on')) return null;
          const sel = room.items.find((i) => i.id === selectedItemId);
          if (!sel) return null;
          let pos;
          if (sel.onWall) {
            const t = (sel.x + 0.5) / W;
            if (sel.onWall === 'north') {
              pos = { x: cBack.x + (cRight.x - cBack.x) * t, y: cBack.y + (cRight.y - cBack.y) * t - wallH + 40 };
            } else {
              pos = { x: cBack.x + (cLeft.x - cBack.x) * t, y: cBack.y + (cLeft.y - cBack.y) * t - wallH + 40 };
            }
          } else {
            const p = tileCenterToScreen(sel.x + 0.5, sel.y + 0.5);
            pos = { x: p.x, y: p.y - 110 };
          }
          const rotateBy = (delta) => {
            setRoom((r) => ({
              ...r,
              items: r.items.map((i) => i.id === sel.id ? { ...i, rotation: (((i.rotation || 0) + delta) % 360 + 360) % 360 } : i)
            }));
          };
          const del = () => {
            setRoom((r) => ({ ...r, items: r.items.filter((i) => i.id !== sel.id) }));
            setSelectedItemId(null);
          };
          return (
            <div className="sel-toolbar" style={{ left: pos.x, top: pos.y }} onPointerDown={(e) => e.stopPropagation()}>
              <button className="st-btn" title="Rotate left" onClick={() => rotateBy(-15)}>↺</button>
              <button className="st-btn" title="Rotate right" onClick={() => rotateBy(15)}>↻</button>
              <div className="st-sep" />
              <button className="st-btn danger" title="Delete" onClick={del}>🗑</button>
            </div>);

        })()}
      </div>

      {/* Zoom controls */}
      <div className="zoom-controls">
        <button onClick={() => onZoom(Math.min(2.5, zoom * 1.15))}>＋</button>
        <div className="zoom-level">{Math.round(zoom * 100)}%</div>
        <button onClick={() => onZoom(Math.max(0.3, zoom / 1.15))}>−</button>
        <button className="zoom-reset" onClick={() => {onZoom(1);setPan({ x: 0, y: 0 });}} title="Reset view">⟲</button>
      </div>
    </div>);

}

Object.assign(window, { Scene });