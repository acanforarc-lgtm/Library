---
name: isometric-furniture
description: Use when drawing, editing, or reviewing furniture sprites for the Library App's My Room — any SVG piece that sits in the isometric room (chairs, sofas, tables, shelves, decor, wall art). Enforces the room's projection, shading, and footprint contract so new pieces match the ones already in the scene.
---

# Isometric furniture for My Room

Every piece in this room is a fixed-size SVG sprite, bottom-anchored onto a floor
tile. Pieces are drawn independently but must look like they were photographed by
the same camera under the same light. Almost every "funky"-looking piece is one of
the four failures below, not a matter of taste.

## The projection contract

The room is **2:1 axonometric**. The scene maps a tile `(tx, ty)` to screen as:

```
screenX = (tx - ty) * TILE * 0.5
screenY = (tx + ty) * TILE * 0.25       // TILE = 56
```

Two consequences you must not violate:

**1. A footprint diamond is always twice as wide as it is tall.**
For a box drawn with half-width `a` and half-depth `b`:

```
b === a / 2        // ALWAYS. No exceptions, no "it looks better" fudging.
```

A diamond flatter than 2:1 reads as a different camera angle than everything
around it. This is the single most common cause of a piece looking wrong, and it
is invisible in isolation — it only shows up next to a correct piece.

**2. The footprint size comes from the catalog, not from taste.**
The piece's `w` and `d` in `CATALOG` (in tiles) determine its drawn size:

```
a = (w + d) * TILE / 4          // = (w + d) * 14  at TILE 56
b = a / 2
```

A `w:3, d:2` desk → `a = 70, b = 35`. If you draw it wider than that it will
overlap its neighbours on the floor grid, because the drop/collision logic uses
`w`/`d` while the eye uses your sprite.

**Square footprints only.** `ExBox` draws an *axis-aligned* diamond, which is the
true footprint only when `w === d`. When `w !== d` the real footprint is a
parallelogram, corners at (relative to the footprint centre):

```
( +(w+d)*T/4 , +(w-d)*T/8 )     ( +(w-d)*T/4 , +(w+d)*T/8 )
( -(w+d)*T/4 , -(w-d)*T/8 )     ( -(w-d)*T/4 , -(w+d)*T/8 )
```

Do not approximate an oblong footprint by squashing `b`. That is the bug this
skill exists to prevent.

## Required primitives

Build from these. Do not hand-type polygon point lists for box-shaped volumes —
that is how the projection drifts.

```jsx
function exShade(hex, pct) { /* per-channel lighten/darken */ }

// One light source for the whole room. Never invent per-piece values.
function exFaces(base) {
  return { top: exShade(base, 14), left: exShade(base, -26), right: exShade(base, -8) };
}

// (cx, cy) is the CENTRE OF THE FOOTPRINT DIAMOND ON THE FLOOR.
// a/b are its half-width/half-depth, hh the height in px.
function ExBox({ cx, cy, a, b, hh, base, c }) { /* top, left, right faces */ }

// Fixed-size sprite wrapper; bottom-anchors onto the tile.
function ExSprite({ w, h, cls, children, extra }) { /* … */ }
```

Register the piece by `styleId` in `window.EXTRA_RENDERERS`; the `Furniture`
router checks that map before its own switch, so no switch-case edit is needed.

## Lighting

One light, high and to the right. Top `+14`, right face `-8`, left face `-26`,
via `exFaces`. Details layered on a face are shaded relative to that face, not
re-derived from the base colour. Anything that emits light at night (lamp, TV,
fireplace, neon, arcade) adds a radial `exGlow` — it does not just get lighter.

## Ground contact

A piece that does not touch the floor looks like it is hovering, which reads as
"funky" even when the geometry is right.

- The sprite is bottom-anchored: the lowest drawn pixel is the floor line.
- **Legs must land on the footprint diamond's corners.** Four legs go at the
  diamond's four vertices, not at arbitrary x positions in a `<path>`. Three legs
  where four are expected reads as broken.
- Soft pieces (beanbag, cushion, rug) get an elliptical contact shadow that
  matches the 2:1 ratio. Hard pieces get their bottom face.

## Assembly

Real furniture is a small stack of boxes sharing one footprint, not a silhouette.
An armchair is: seat block, back slab rising from the *back two* edges of the seat
diamond, two arm blocks rising from the *left and right* edges. Each arm sits ON
the seat block — its `cy` is the seat's `cy - seatHeight`, not a hand-picked
number. Floating arm quads that are not anchored to the seat are the classic
tell of a hand-typed sprite.

## Self-check before finishing

Run these against every piece you draw or edit:

- [ ] Every `ExBox` has `b === a / 2`
- [ ] `a === (w + d) * 14` for the catalog's `w`/`d`
- [ ] `w !== d`? Then it is a parallelogram footprint, not `ExBox`
- [ ] All faces come from `exFaces` — no per-piece shading constants
- [ ] Lowest drawn pixel is the floor contact; legs sit on diamond corners
- [ ] Sub-volumes are positioned off their parent's height, not magic numbers
- [ ] Night-emitting pieces have `exGlow`
- [ ] Rendered next to `desk-writing` and `dresser-oak`, it reads as the same camera

## Reference: correct vs incorrect

**Correct** — `desk-writing` (`w:3, d:2` → `a=72≈70, b=36≈35`, one shading source):

```jsx
<ExSprite w={150} h={104}>
  <ExBox cx={75} cy={70} a={72} b={36} hh={44} base={wood} />
  <rect x="10" y="72" width="5" height="24" fill={exShade(wood, -30)} />
  …
</ExSprite>
```

**Incorrect** — `tv-stand` uses `a=70, b=22` where the contract requires `b=35`.
It is drawn at 63% of its correct depth, so it looks like it was photographed
from a lower camera than the desk beside it. Same fault in `gaming-desk` (30 vs
36), `fireplace-stone` (24 vs 31), `fish-tank` (20 vs 27), `cat-tower` (20 vs 22
and 15 vs 17), `chess-table` (21 vs 22), `desk-pc-tower` (12 vs 12.5).

**Incorrect** — the legacy `Armchair` and `Sofa` in `furniture.jsx` hand-type every
polygon and use their own shading ladder (`+8 / -10 / -20`, plus ad-hoc `-8`,
`-18`, `+14`). They predate `ExBox`, do not match the room's light, and their
armrests are free-floating quads at fixed coordinates rather than blocks resting
on the seat. Rebuild them on `ExBox` rather than nudging their points.
