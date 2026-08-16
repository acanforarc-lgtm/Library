// data.jsx — Mock data shaped to sync with the real Library App
// =============================================================
// This is what your backend would provide. Field names intentionally stable
// so integration is just a matter of swapping these constants for fetch().

// ── User account (source of truth: your auth system) ─────────────────────
const MOCK_ACCOUNT = {
  id: "user_4821",
  displayName: "Eliza",
  privacy: "friends", // "public" | "friends" | "private"
  location: { lat: 40.7128, lng: -74.006, tz: "America/New_York" }, // drives day/night
  readingStreak: 47, // days
};

// ── User's library (source of truth: your books table) ───────────────────
// These books sync with the 2D app. Changes in either view propagate.
const MOCK_BOOKS = [
  { id: "b1",  title: "The Seven Husbands of Evelyn Hugo", author: "Taylor Jenkins Reid", spine: "#8b3a3a", height: 0.92, width: 0.14, status: "read",     rating: 5, pagesRead: 400, pages: 400, notes: "Obsessed.", genre: "Fiction" },
  { id: "b2",  title: "Circe",                              author: "Madeline Miller",     spine: "#c98a5a", height: 0.95, width: 0.16, status: "read",     rating: 5, pagesRead: 400, pages: 400, notes: "",           genre: "Mythology" },
  { id: "b3",  title: "The Midnight Library",               author: "Matt Haig",           spine: "#2f4a3a", height: 0.88, width: 0.12, status: "read",     rating: 4, pagesRead: 300, pages: 300, notes: "",           genre: "Fiction" },
  { id: "b4",  title: "Tomorrow, and Tomorrow, and Tomorrow", author: "Gabrielle Zevin",  spine: "#d9b06a", height: 0.94, width: 0.18, status: "reading",  rating: 0, pagesRead: 120, pages: 416, notes: "",           genre: "Fiction" },
  { id: "b5",  title: "A Little Life",                      author: "Hanya Yanagihara",    spine: "#2a2a3a", height: 0.98, width: 0.26, status: "tbr",      rating: 0, pagesRead: 0,   pages: 720, notes: "",           genre: "Fiction" },
  { id: "b6",  title: "Normal People",                      author: "Sally Rooney",        spine: "#b8c4a8", height: 0.86, width: 0.11, status: "read",     rating: 4, pagesRead: 266, pages: 266, notes: "",           genre: "Fiction" },
  { id: "b7",  title: "The Song of Achilles",               author: "Madeline Miller",     spine: "#7a4a7a", height: 0.90, width: 0.13, status: "read",     rating: 5, pagesRead: 378, pages: 378, notes: "Cried.",     genre: "Mythology" },
  { id: "b8",  title: "Pachinko",                           author: "Min Jin Lee",         spine: "#3a3a5a", height: 0.95, width: 0.20, status: "read",     rating: 5, pagesRead: 490, pages: 490, notes: "",           genre: "Fiction" },
  { id: "b9",  title: "Educated",                           author: "Tara Westover",       spine: "#e8d4a0", height: 0.92, width: 0.16, status: "read",     rating: 4, pagesRead: 334, pages: 334, notes: "",           genre: "Memoir" },
  { id: "b10", title: "Klara and the Sun",                  author: "Kazuo Ishiguro",      spine: "#c8b898", height: 0.88, width: 0.14, status: "read",     rating: 4, pagesRead: 303, pages: 303, notes: "",           genre: "Fiction" },
  { id: "b11", title: "The Invisible Life of Addie LaRue",  author: "V.E. Schwab",         spine: "#4a3a6a", height: 0.94, width: 0.19, status: "read",     rating: 5, pagesRead: 560, pages: 560, notes: "",           genre: "Fantasy" },
  { id: "b12", title: "Daisy Jones & The Six",              author: "Taylor Jenkins Reid", spine: "#d97a5a", height: 0.91, width: 0.14, status: "read",     rating: 5, pagesRead: 368, pages: 368, notes: "",           genre: "Fiction" },
  { id: "b13", title: "Beach Read",                         author: "Emily Henry",         spine: "#f0c8c0", height: 0.87, width: 0.12, status: "read",     rating: 4, pagesRead: 370, pages: 370, notes: "",           genre: "Romance" },
  { id: "b14", title: "The Nightingale",                    author: "Kristin Hannah",      spine: "#5a4a3a", height: 0.95, width: 0.20, status: "read",     rating: 5, pagesRead: 440, pages: 440, notes: "",           genre: "Historical" },
  { id: "b15", title: "Lessons in Chemistry",               author: "Bonnie Garmus",       spine: "#a8b4c4", height: 0.92, width: 0.15, status: "reading",  rating: 0, pagesRead: 180, pages: 390, notes: "",           genre: "Fiction" },
  { id: "b16", title: "The Secret History",                 author: "Donna Tartt",         spine: "#3a4a2a", height: 0.96, width: 0.22, status: "tbr",      rating: 0, pagesRead: 0,   pages: 559, notes: "",           genre: "Fiction" },
  { id: "b17", title: "Mexican Gothic",                     author: "Silvia Moreno-Garcia",spine: "#6a2a2a", height: 0.89, width: 0.13, status: "read",     rating: 4, pagesRead: 301, pages: 301, notes: "",           genre: "Horror" },
  { id: "b18", title: "The House in the Cerulean Sea",      author: "TJ Klune",            spine: "#5ab4c4", height: 0.88, width: 0.14, status: "read",     rating: 5, pagesRead: 394, pages: 394, notes: "Comfort.",   genre: "Fantasy" },
  { id: "b19", title: "Piranesi",                           author: "Susanna Clarke",      spine: "#d4c8b0", height: 0.86, width: 0.10, status: "read",     rating: 5, pagesRead: 245, pages: 245, notes: "",           genre: "Fantasy" },
  { id: "b20", title: "Convenience Store Woman",            author: "Sayaka Murata",       spine: "#e8e0d0", height: 0.82, width: 0.08, status: "read",     rating: 4, pagesRead: 176, pages: 176, notes: "",           genre: "Fiction" },
  { id: "b21", title: "The Priory of the Orange Tree",      author: "Samantha Shannon",    spine: "#d97a3a", height: 0.98, width: 0.30, status: "tbr",      rating: 0, pagesRead: 0,   pages: 848, notes: "",           genre: "Fantasy" },
  { id: "b22", title: "Emma",                               author: "Jane Austen",         spine: "#a04a5a", height: 0.90, width: 0.13, status: "read",     rating: 5, pagesRead: 474, pages: 474, notes: "Annual reread.", genre: "Classic" },
  { id: "b23", title: "Pride and Prejudice",                author: "Jane Austen",         spine: "#5a7a8a", height: 0.88, width: 0.12, status: "read",     rating: 5, pagesRead: 432, pages: 432, notes: "",           genre: "Classic" },
  { id: "b24", title: "Jane Eyre",                          author: "Charlotte Brontë",    spine: "#3a2a1a", height: 0.92, width: 0.17, status: "read",     rating: 4, pagesRead: 500, pages: 500, notes: "",           genre: "Classic" },
];

// ── Shelves (source of truth: your shelves/collections table) ────────────
// Each shelf has a 2D identity (name, sort rules) AND a 3D identity
// (a placed instance in the room). The 3D position is what's new.
const MOCK_SHELVES = [
  { id: "s1", name: "Favorites",   sortBy: "color",  bookIds: ["b1","b2","b7","b11","b12","b18","b14","b22"], styleId: "shelf-tall-oak" },
  { id: "s2", name: "Read in 2025", sortBy: "recent", bookIds: ["b3","b6","b8","b9","b10","b13","b17","b19","b20","b23","b24"], styleId: "shelf-wide-walnut" },
  { id: "s3", name: "Currently Reading", sortBy: "manual", bookIds: ["b4","b15"], styleId: "shelf-short-oak" },
  { id: "s4", name: "To Be Read",  sortBy: "height", bookIds: ["b5","b16","b21"], styleId: "shelf-tall-oak" },
];

// ── Room state (source of truth: new — would live in a rooms table) ──────
// This is the NEW data the 3D feature introduces. Your dev should persist this.
// Coordinates: (x, y) on floor in tile units; tileSize is cosmetic only.
// rotation: 0 | 90 | 180 | 270  (degrees, clockwise from north wall)
const DEFAULT_ROOM = {
  size: { w: 12, d: 10 }, // tiles (resizable, min 8×6, max 16×14)
  tileSize: 56, // px
  wallColor: "#e8dcc8",
  floorStyle: "oak-plank",
  windowWall: "north", // "north" | "east" | "south" | "west"
  items: [
    // Bookshelves are intentionally NOT placed here — they sync in from the
    // user's existing 2D shelves via integration. User drops them from a
    // "My Shelves" tab in the catalog once connected.
    // Other furniture
    { id: "chair1",   type: "chair",    styleId: "armchair-rose",    x: 4, y: 5, rotation: 45 },
    { id: "sidetable1", type: "table",  styleId: "sidetable-oak",    x: 6, y: 5, rotation: 0 },
    { id: "rug1",     type: "rug",      styleId: "rug-persian-warm", x: 3, y: 4 },
    { id: "lamp1",    type: "lamp",     styleId: "floor-lamp-brass", x: 3, y: 5, rotation: 0 },
    { id: "plant1",   type: "plant",    styleId: "monstera",         x: 0, y: 8, rotation: 0 },
    { id: "plant2",   type: "plant",    styleId: "fern-hanging",     x: 11,y: 8, rotation: 0 },
    { id: "art1",     type: "art",      styleId: "frame-botanical",  x: 8, y: 0, rotation: 0, onWall: "north" },
    { id: "cat1",     type: "pet",      styleId: "cat-orange",       x: 5, y: 6, rotation: 0 },
    { id: "mug1",     type: "trinket",  styleId: "mug-ceramic",      x: 6, y: 4.7, rotation: 0, onTopOf: "sidetable1" },
    { id: "candle1",  type: "trinket",  styleId: "candle-amber",     x: 6.4, y: 4.7, rotation: 0, onTopOf: "sidetable1" },
  ],
  audio: { enabled: true, track: "rain-fireplace", volume: 0.4 },
  gridVisible: false,
};

// ── Furniture catalog (source of truth: static, shipped with app) ────────
const CATALOG = [
  { category: "My Shelves", items: [
    // Populated via sync from user's 2D library. Shown as a helpful empty
    // state in the catalog until integration is wired.
  ]},
  { category: "Seating", items: [
    { styleId: "armchair-rose",     name: "Rose Armchair",   type: "chair", w: 2, d: 2, h: 2 },
    { styleId: "armchair-cream",    name: "Cream Armchair",  type: "chair", w: 2, d: 2, h: 2 },
    { styleId: "sofa-sage",         name: "Sage Sofa",       type: "chair", w: 4, d: 2, h: 2 },
    { styleId: "beanbag-terracotta",name: "Bean Bag",        type: "chair", w: 2, d: 2, h: 1 },
    { styleId: "pouf-knit",        name: "Knit Pouf",       type: "chair", w: 1, d: 1, h: 1 },
    { styleId: "floor-cushion",    name: "Floor Cushion",   type: "chair", w: 2, d: 2, h: 1 },
    { styleId: "desk-chair-wood",  name: "Wooden Desk Chair", type: "chair", w: 1, d: 1, h: 2 },
    { styleId: "rocking-chair",    name: "Rocking Chair",   type: "chair", w: 2, d: 2, h: 2 },
    { styleId: "stool-wood",       name: "Oak Stool",       type: "chair", w: 1, d: 1, h: 1 },
    { styleId: "chaise-velvet",     name: "Velvet Chaise",   type: "chair", w: 4, d: 2, h: 2, locked: true },
  ]},
  { category: "Lighting", items: [
    { styleId: "floor-lamp-brass",  name: "Brass Floor Lamp",   type: "lamp", w: 1, d: 1, h: 4 },
    { styleId: "table-lamp-linen",  name: "Linen Table Lamp",   type: "lamp", w: 1, d: 1, h: 1 },
    { styleId: "string-lights",     name: "String Lights",      type: "lamp", w: 4, d: 0, h: 0 },
    { styleId: "candle-cluster",    name: "Candle Cluster",     type: "lamp", w: 1, d: 1, h: 0 },
    { styleId: "lantern-paper",     name: "Paper Lantern",      type: "lamp", w: 1, d: 1, h: 2 },
    { styleId: "salt-lamp",         name: "Salt Lamp",          type: "lamp", w: 1, d: 1, h: 1 },
    { styleId: "arc-lamp-modern",   name: "Arc Lamp",           type: "lamp", w: 2, d: 1, h: 5 },
  ]},
  { category: "Surfaces", items: [
    { styleId: "sidetable-oak",      name: "Oak Side Table",   type: "table", w: 1, d: 1, h: 1 },
    { styleId: "desk-writing",       name: "Writing Desk",     type: "table", w: 3, d: 2, h: 2 },
    { styleId: "coffee-table-round", name: "Round Coffee Table", type: "table", w: 2, d: 2, h: 1 },
    { styleId: "trunk-storage",      name: "Storage Trunk",    type: "table", w: 2, d: 1, h: 1 },
    { styleId: "dresser-oak",        name: "Oak Dresser",      type: "table", w: 2, d: 1, h: 2 },
  ]},
  { category: "Plants", items: [
    { styleId: "monstera",          name: "Monstera",      type: "plant", w: 1, d: 1, h: 3 },
    { styleId: "fern-hanging",      name: "Hanging Fern",  type: "plant", w: 1, d: 1, h: 2 },
    { styleId: "succulent-set",     name: "Succulent Trio",type: "plant", w: 1, d: 1, h: 1 },
    { styleId: "olive-tree",        name: "Olive Tree",    type: "plant", w: 2, d: 2, h: 5, locked: true },
    { styleId: "cactus-tall",       name: "Tall Cactus",   type: "plant", w: 1, d: 1, h: 3 },
    { styleId: "bonsai-tree",       name: "Bonsai",        type: "plant", w: 1, d: 1, h: 1 },
    { styleId: "palm-potted",       name: "Potted Palm",   type: "plant", w: 2, d: 2, h: 4 },
    { styleId: "pampas-vase",       name: "Pampas Vase",   type: "plant", w: 1, d: 1, h: 3 },
  ]},
  { category: "Art & Decor", items: [
    { styleId: "frame-botanical",   name: "Botanical Print", type: "art", w: 2, d: 0, h: 2 },
    { styleId: "frame-vintage",     name: "Vintage Portrait",type: "art", w: 1, d: 0, h: 2 },
    { styleId: "mirror-oval",       name: "Oval Mirror",     type: "art", w: 1, d: 0, h: 2 },
    { styleId: "tapestry-woven",    name: "Woven Tapestry",  type: "art", w: 3, d: 0, h: 3 },
    { styleId: "film-poster",       name: "Film Poster",     type: "art", w: 2, d: 0, h: 3 },
    { styleId: "map-vintage",       name: "Vintage Map",     type: "art", w: 3, d: 0, h: 2 },
    { styleId: "clock-wall",        name: "Wall Clock",      type: "art", w: 1, d: 0, h: 1 },
    { styleId: "shelf-floating",    name: "Floating Shelf",  type: "art", w: 3, d: 0, h: 1 },
    { styleId: "pennant-flag",      name: "Felt Pennant",    type: "art", w: 2, d: 0, h: 1 },
  ]},
  { category: "Rugs", items: [
    { styleId: "rug-persian-warm",  name: "Persian Warm",  type: "rug", w: 4, d: 3 },
    { styleId: "rug-sheepskin",     name: "Sheepskin",     type: "rug", w: 3, d: 2 },
    { styleId: "rug-jute",          name: "Jute",          type: "rug", w: 5, d: 4 },
  ]},
  { category: "Pets", items: [
    { styleId: "cat-orange",  name: "Marmalade Cat", type: "pet", w: 1, d: 1, h: 1 },
    { styleId: "cat-tuxedo",  name: "Tuxedo Cat",    type: "pet", w: 1, d: 1, h: 1 },
    { styleId: "dog-corgi",   name: "Corgi",         type: "pet", w: 1, d: 1, h: 1, locked: true },
    { styleId: "dog-bed",     name: "Pet Bed",       type: "decor", w: 2, d: 2, h: 1 },
    { styleId: "cat-tower",   name: "Cat Tower",     type: "decor", w: 2, d: 2, h: 5 },
    { styleId: "fish-tank",   name: "Fish Tank",     type: "decor", w: 2, d: 1, h: 3 },
    { styleId: "bird-cage",   name: "Bird Cage",     type: "decor", w: 1, d: 1, h: 4 },
  ]},
  { category: "Windows", items: [
    { styleId: "window-rain",    name: "Rainy Evening", type: "window", w: 3, d: 0, h: 4 },
    { styleId: "window-sunny",   name: "Sunny Morning", type: "window", w: 3, d: 0, h: 4 },
    { styleId: "window-snow",    name: "Snowy Day",     type: "window", w: 3, d: 0, h: 4, locked: true },
  ]},
  { category: "Trinkets", items: [
    { styleId: "mug-ceramic",   name: "Ceramic Mug", type: "trinket", w: 0, d: 0, h: 1 },
    { styleId: "candle-amber",  name: "Amber Candle",type: "trinket", w: 0, d: 0, h: 1 },
    { styleId: "globe-vintage", name: "Vintage Globe",type: "trinket", w: 1, d: 1, h: 1 },
    { styleId: "clock-mantel",  name: "Mantel Clock",type: "trinket", w: 1, d: 0, h: 1 },
    { styleId: "stack-books",   name: "Stacked Books",type: "trinket", w: 0, d: 0, h: 1 },
    { styleId: "tea-set",       name: "Tea Set",      type: "trinket", w: 1, d: 1, h: 1 },
  ]},
  { category: "Music", items: [
    { styleId: "guitar-acoustic", name: "Acoustic Guitar", type: "decor", w: 1, d: 1, h: 4 },
    { styleId: "guitar-wall",     name: "Guitar on Wall",  type: "art",   w: 2, d: 0, h: 3 },
    { styleId: "record-player",   name: "Record Player",   type: "decor", w: 2, d: 1, h: 1 },
    { styleId: "vinyl-crate",     name: "Vinyl Crate",     type: "decor", w: 1, d: 1, h: 1 },
    { styleId: "speaker-vintage", name: "Vintage Speaker", type: "decor", w: 1, d: 1, h: 3 },
    { styleId: "piano-upright",   name: "Upright Piano",   type: "decor", w: 3, d: 2, h: 3 },
    { styleId: "record-wall",     name: "Record Wall",     type: "art",   w: 2, d: 0, h: 2 },
  ]},
  { category: "Gaming & Tech", items: [
    { styleId: "tv-stand",       name: "TV & Stand",     type: "decor", w: 3, d: 1, h: 3 },
    { styleId: "gaming-desk",    name: "Gaming Desk",    type: "decor", w: 3, d: 2, h: 3 },
    { styleId: "desk-pc-tower",  name: "PC Tower",       type: "decor", w: 1, d: 1, h: 2 },
    { styleId: "arcade-cabinet", name: "Arcade Cabinet", type: "decor", w: 1, d: 1, h: 5 },
    { styleId: "neon-sign",      name: "Neon Sign",      type: "art",   w: 2, d: 0, h: 1 },
  ]},
  { category: "Wellness", items: [
    { styleId: "yoga-mat",            name: "Yoga Mat",           type: "decor", w: 3, d: 2, h: 0 },
    { styleId: "meditation-cushion",  name: "Meditation Cushion", type: "decor", w: 1, d: 1, h: 1 },
    { styleId: "fireplace-stone",     name: "Stone Fireplace",    type: "decor", w: 3, d: 1, h: 4 },
    { styleId: "floor-mirror",        name: "Floor Mirror",       type: "decor", w: 1, d: 1, h: 5 },
  ]},
  { category: "Hobbies", items: [
    { styleId: "easel-painting", name: "Painting Easel", type: "decor", w: 2, d: 2, h: 4 },
    { styleId: "telescope",      name: "Telescope",      type: "decor", w: 1, d: 1, h: 4 },
    { styleId: "chess-table",    name: "Chess Table",    type: "decor", w: 2, d: 2, h: 1 },
    { styleId: "camera-tripod",  name: "Camera & Tripod",type: "decor", w: 1, d: 1, h: 4 },
  ]},
  { category: "Sports", items: [
    { styleId: "surfboard-leaning", name: "Surfboard",   type: "decor", w: 1, d: 1, h: 5 },
    { styleId: "skateboard-deck",   name: "Skateboard",  type: "decor", w: 1, d: 1, h: 4 },
    { styleId: "bicycle",           name: "Bicycle",     type: "decor", w: 3, d: 1, h: 2 },
  ]},
  { category: "Kids & Whimsy", items: [
    { styleId: "teddy-bear",    name: "Teddy Bear",    type: "decor", w: 1, d: 1, h: 1 },
    { styleId: "rocking-horse", name: "Rocking Horse", type: "decor", w: 2, d: 1, h: 2 },
    { styleId: "toy-blocks",    name: "Toy Blocks",    type: "decor", w: 1, d: 1, h: 1 },
  ]},
];

Object.assign(window, { MOCK_ACCOUNT, MOCK_BOOKS, MOCK_SHELVES, DEFAULT_ROOM, CATALOG });
