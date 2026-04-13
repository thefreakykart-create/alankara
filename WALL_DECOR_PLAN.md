# Alankara — Wall Art Frames: Product System Plan

## Overview

Alankara is a broad premium home decor brand. Wall art frames are **one category** within it — alongside other categories like textiles, lighting, serveware, etc.

Within the Wall Art Frames category, a single design can be sold in **1, 2, or all 3 frame types** depending on what the seller chooses to list. Each frame type can be available in **1 to 4 sizes**.

---

## Frame Types
| Type | Finish | Character |
|---|---|---|
| Canvas | Matte, painterly, warm | Traditional, cosy homes |
| Acrylic | Glossy, vibrant, sharp | Modern, minimal apartments |
| Wooden (Black Border) | Natural, clean, contrast | Contemporary, versatile |

## Sizes
`8×12` · `12×18` · `18×24` · `24×36` (inches)

---

## Product Model

A **Wall Art product** = 1 design + however many variants the seller chooses to publish.

Examples:
- "Lord Ganesh" → Canvas (8×12, 12×18) + Acrylic (12×18) → 3 variants
- "Monsoon Forest" → Canvas only (all 4 sizes) → 4 variants
- "Gold Mandala" → All 3 frame types × all 4 sizes → 12 variants

### Variant Structure
Each variant stores:
- Frame type (canvas / acrylic / wooden)
- Size (8×12 / 12×18 / 18×24 / 24×36)
- Price
- SKU
- Stock
- Its own gallery images (room scenes for that frame type)

---

## Top 10 Categories for Alankara (India Market)

| # | Category | Examples |
|---|---|---|
| 1 | **Wall Art Frames** | Canvas, Acrylic, Wooden frames |
| 2 | **Devotional** | Brass diyas, idols, puja accessories |
| 3 | **Lighting** | Pendant lamps, lanterns, fairy lights |
| 4 | **Textiles** | Cushion covers, throws, rugs, table runners |
| 5 | **Serveware & Kitchen** | Copper bottles, ceramic plates, wooden boards |
| 6 | **Planters & Botanicals** | Terracotta pots, macrame plant hangers |
| 7 | **Mirrors & Wall Decor** | Brass mirrors, wall hangings, shelves |
| 8 | **Festive & Gifting** | Hampers, diwali decor, combo sets |
| 9 | **Bedroom Accents** | Lamps, trays, candles, organizers |
| 10 | **Abstract & Modern Art** | Prints, sculptures, decorative objects |

---

## Wall Art Sub-Categories (Designs)
1. Devotional — Ganesh, Lakshmi, Krishna, Hanuman, Sai Baba, Ram Darbar
2. Motivational Quotes — English + Hindi
3. Nature & Landscapes — Mountains, waterfalls, forests, sunsets
4. Abstract Art — Geometric, fluid, modern
5. Botanical & Floral — Tropical leaves, flowers, minimal plants
6. Family & Home — Home Sweet Home, family tree, blessings
7. Couple & Love — Anniversary, romantic art
8. Kids Room — Animals, alphabets, cartoon-style
9. Heritage & Architecture — Taj Mahal, Rajasthani palaces, Indian art forms
10. Combo Sets — 2/3/4 piece matching sets

---

## Product Page Layout (Agreed Design)

```
┌─────────────────────────────────────────────┐
│  [Main room scene image — large]            │
│  [Thumbnail 1] [Thumb 2] [Thumb 3]          │
│                                             │
│  ← Drag divider to compare frame types →   │
│                                             │
│  Lord Ganesh — Wall Art                     │
│  Devotional · Canvas                        │
│                                             │
│  [Canvas ←drag→ Acrylic ←drag→ Wooden]     │
│  (only shows available frame types)         │
│                                             │
│  Size  [8×12] [12×18] [18×24] [24×36]      │
│        👤 human scale silhouette            │
│                                             │
│  ₹1,299  ~~₹1,599~~                        │
│  [        Add to Cart        ]              │
│  [ Try On My Wall 📷 ]                      │
│                                             │
│  ── Material Feel ──                        │
│  [Canvas texture] [Acrylic gloss] [Wood]    │
│  Close-up zoom per material + 1-line copy   │
│                                             │
│  ── The Story ──                            │
│  Inspiration · Craft · Best suited for      │
└─────────────────────────────────────────────┘
```

### Key UX Decisions
- ❌ No full-screen art entrance (customers don't wait)
- ❌ No sticky bottom add-to-cart bar
- ✅ Hero = room scene image (art on a real styled wall, not white bg)
- ✅ Frame type = drag-to-reveal divider (not tabs/dropdowns)
- ✅ Size = human scale silhouette (feel the real size)
- ✅ Add to Cart = below images, full width, prominent
- ✅ "Try On My Wall" AR button below Add to Cart
- ✅ Material close-up section with zoomed textures
- ✅ Story section — inspiration, craft, room suggestions

---

## Signature Features (What Makes Alankara Different)

### Feature 1: Frame Comparison — Drag to Reveal
- A vertical divider on the product image
- Drag left/right to reveal Canvas vs Acrylic vs Wooden room scene
- Same art, different frame, same wall — side by side
- Only shows frame types available for that specific design
- Gallery thumbnails below switch the main image per frame type

### Feature 2: "See It On Your Wall" — Browser AR
- Zero app download — works in browser
- User clicks "Try On My Wall" → camera opens
- Frame appears on their actual wall at real-world scale
- Switch frame type and size live in AR
- Screenshot + share
- Fallback: upload a photo of your wall → frame placed on it

**Tech:** WebXR API + Three.js / A-Frame
**Fallback:** Photo upload + canvas compositing

### Feature 3: Gallery Wall Planner (`/planner`)
- Interactive blank wall canvas
- Drag & drop designs onto the wall
- Configure each frame (type + size) individually
- Smart arrangement presets (grid, salon, asymmetric)
- Wall color/texture picker
- Total price shown live
- "Add All to Cart" — entire wall arrangement in one click
- Save arrangement (logged-in users)
- Share as image / WhatsApp

**Tech:** `@dnd-kit` + `Konva.js` + `html2canvas`

---

## Admin: Bulk Product Publisher (`/admin/products/publish`)

### Workflow
1. Enter design name + pick sub-category (e.g. "Lord Ganesh", Devotional)
2. Select which frame types to publish (Canvas / Acrylic / Wooden — pick any)
3. For each selected frame type: upload gallery images
4. For each frame type: select available sizes + pricing (pre-filled, editable)
5. Description auto-generated from template (editable)
6. Preview all variants
7. Click **"Publish"** → all variants go live

### Auto-Description Template
```
[Design Name] — [Frame Type] Frame

[1-line description based on sub-category]
[Frame type benefit sentence]
Available in [sizes]. [Material + care note].

Perfect for: [room suggestions]
```

### Bulk Import (Phase 2)
- CSV upload for 50+ designs
- Auto-creates all selected variants

---

## Database Changes Needed

### New Table: `product_variants`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| product_id | uuid | FK → products |
| frame_type | text | 'canvas' / 'acrylic' / 'wooden' |
| size | text | '8x12' / '12x18' / '18x24' / '24x36' |
| price | integer | paise |
| compare_at_price | integer | paise, nullable |
| sku | text | ALK-[CODE]-[FRAME]-[SIZE] |
| stock_quantity | integer | |
| images | text[] | gallery images for this frame type |
| is_active | boolean | |
| created_at | timestamptz | |

### `products` table updates
- `images` becomes optional (variants hold frame-specific images)
- Add `product_type` field: 'wall_art' / 'general' — wall art uses variant model, general uses existing model
- Both types coexist on the same site

---

## Pricing Table (To Be Filled)
| Size | Canvas | Acrylic | Wooden |
|---|---|---|---|
| 8×12 | ₹ | ₹ | ₹ |
| 12×18 | ₹ | ₹ | ₹ |
| 18×24 | ₹ | ₹ | ₹ |
| 24×36 | ₹ | ₹ | ₹ |

---

## Implementation Phases

### Phase 1 — Wall Art Product System
- [ ] Add `product_variants` table to Supabase
- [ ] Update product model to support variant-based products
- [ ] Redesign product page — Frame Comparison Experience
- [ ] Build Admin Bulk Publisher
- [ ] Update cart to hold variant info (frame type + size)

### Phase 2 — "See It On Your Wall" AR
- [ ] WebXR camera integration
- [ ] Frame overlay at real-world scale
- [ ] Live frame type + size switching
- [ ] Photo upload fallback
- [ ] Screenshot + share

### Phase 3 — Gallery Wall Planner
- [ ] `/planner` drag-and-drop canvas
- [ ] Design browser panel
- [ ] Per-frame configuration
- [ ] Smart arrangement presets
- [ ] "Add All to Cart"
- [ ] Save + share

### Phase 4 — Scale
- [ ] CSV bulk import
- [ ] Auto-SEO per variant page
- [ ] Sitemap auto-update
- [ ] ISR for performance

---

## Notes
- Prices in paise (integer) throughout
- SKU format: `ALK-[DESIGN_CODE]-[FRAME_ABBR]-[SIZE]` e.g. `ALK-GNS-CV-812`
- Images in Supabase Storage: `/products/[product_id]/[frame_type]/`
- User supplies all design files and gallery images — no AI image generation
- Wall art frames are one category; other home decor products use the existing simple product model
