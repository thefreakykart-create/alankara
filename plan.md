# Alankara — Home Decor E-Commerce Website

## Context
Building a full e-commerce website for "Alankara", an India-focused home decor brand. The project is a clean slate (empty `index.html`). Goal: a production-ready online store with product catalog, cart, checkout, PhonePe payments, user accounts, order tracking, and an admin panel. The brand identity is **Contemporary Indian luxury** — blending heritage craft with modern aesthetics, targeting young urban Indian buyers who appreciate tradition, trendiness, and Instagram-worthy design.

## Tech Stack
- **Framework:** Next.js (App Router, TypeScript)
- **Database/Auth:** Supabase (Postgres DB + Supabase Auth) — DB only, no Supabase hosting
- **Payments:** PhonePe Payment Gateway (REST API)
- **Styling:** Tailwind CSS
- **Animations:** GSAP + ScrollTrigger (scroll effects, parallax, timelines) + Framer Motion (component animations, page transitions, gestures)
- **State:** Zustand (cart with localStorage persistence)
- **Icons:** Lucide React
- **Deployment:** Vercel via Git push

## Design Direction — "Contemporary Indian Luxury"

### Visual Language
- **Color palette:** Deep jewel tones (emerald, burgundy, gold) + warm neutrals (cream, terracotta, warm white) + black for contrast
- **Typography:** Elegant serif for headings (e.g., Playfair Display), clean sans-serif for body (e.g., Inter/DM Sans)
- **Textures:** Subtle Indian-inspired patterns (paisley, mandala fragments) as background accents, not overwhelming
- **Photography style:** Lifestyle-driven, warm lighting, styled spaces (placeholder with curated stock images)

### Signature Interactive Elements (Home Page)
1. **Cinematic Hero** — Full-screen video/image hero with text reveal animation (GSAP SplitText-style character-by-character reveal), parallax depth layers, subtle grain texture overlay
2. **Magnetic Cursor** — Custom cursor that transforms near interactive elements (grows, changes shape, shows "View" on product cards)
3. **Horizontal Scroll Showcase** — Featured collection section that scrolls horizontally while the user scrolls vertically (GSAP ScrollTrigger pin + horizontal translate)
4. **Parallax Category Cards** — Categories displayed as overlapping cards with depth parallax on scroll, each card tilts slightly on mouse move (3D transform)
5. **Marquee Text Banner** — Infinite scrolling text strip ("Handcrafted • Heritage • Home") with smooth CSS animation
6. **Staggered Grid Reveal** — Products/testimonials fade-in with staggered timing as they enter viewport
7. **Brand Story Timeline** — Scroll-driven storytelling section with sticky text + parallax images transitioning as you scroll
8. **Smooth Page Transitions** — Framer Motion AnimatePresence for route changes (fade + slide)

### Signature Interactive Elements (Product Page)
1. **Image Zoom on Hover** — Product images with smooth lens-style zoom on mouse position
2. **3D Product Tilt** — Main product image subtly tilts toward cursor position (perspective transform)
3. **Sticky Add-to-Cart** — Floating bar that appears when the main CTA scrolls out of view
4. **Expandable Accordion** — Product details (description, materials, care, shipping) in animated accordions
5. **Image Gallery with Gesture Support** — Swipeable on mobile (Framer Motion drag), keyboard-accessible
6. **Add-to-Cart Micro-animation** — Product thumbnail flies toward cart icon with scale/position tween
7. **Related Products Carousel** — Smooth draggable carousel with momentum scrolling

### General UI Polish
- **Smooth scroll** (Lenis for buttery smooth scrolling)
- **Skeleton loaders** with shimmer effect during data fetch
- **Toast notifications** with slide-in animation
- **Hover effects** on all interactive elements (scale, color shift, underline animations)
- **Mobile-first** with thoughtful touch interactions

---

## Key Technical Decisions
| Decision | Choice | Why |
|----------|--------|-----|
| Prices | Stored as integers in paise | Avoids floating-point errors; PhonePe expects paise |
| Cart state | Zustand with `persist` | Survives reloads, minimal re-renders vs Context |
| Images | Supabase Storage + custom Next.js loader | Built-in transforms, no separate CDN needed |
| Auth | Supabase SSR (PKCE + cookies) | Secure, works with Server Components |
| PhonePe | Direct REST API from Route Handlers | No SDK needed, salt key stays server-side |
| Animations | GSAP + Framer Motion | GSAP for scroll-driven/complex timelines, Framer Motion for component/page transitions |
| Smooth scroll | Lenis | Buttery smooth scrolling, integrates with GSAP ScrollTrigger |
| Deployment | Vercel via Git | Push to Git → auto-deploy on Vercel |

---

## Database Schema (Supabase — DB only)

**Tables:** `categories`, `products`, `profiles`, `addresses`, `orders`, `order_items`, `payments`, `order_tracking`

### Table: categories
| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK, default gen_random_uuid() |
| name | text | NOT NULL |
| slug | text | NOT NULL, UNIQUE |
| description | text | |
| image_url | text | |
| display_order | integer | default 0 |
| created_at | timestamptz | default now() |

### Table: products
| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK, default gen_random_uuid() |
| name | text | NOT NULL |
| slug | text | NOT NULL, UNIQUE |
| description | text | |
| price | integer | NOT NULL (stored in paise) |
| compare_at_price | integer | nullable (original price for discount display) |
| category_id | uuid | FK -> categories(id) ON DELETE SET NULL |
| images | text[] | array of Supabase Storage paths |
| sku | text | UNIQUE |
| stock_quantity | integer | NOT NULL, default 0 |
| is_active | boolean | default true |
| is_featured | boolean | default false |
| weight_grams | integer | for shipping calculation |
| dimensions_cm | jsonb | {"length", "width", "height"} |
| metadata | jsonb | flexible key-value (material, color, etc.) |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### Table: profiles
| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK, FK -> auth.users(id) ON DELETE CASCADE |
| full_name | text | |
| phone | text | |
| role | text | default 'customer', CHECK in ('customer', 'admin') |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### Table: addresses
| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK -> auth.users(id) ON DELETE CASCADE |
| full_name | text | NOT NULL |
| phone | text | NOT NULL |
| address_line1 | text | NOT NULL |
| address_line2 | text | |
| city | text | NOT NULL |
| state | text | NOT NULL |
| pincode | text | NOT NULL, CHECK length = 6 |
| landmark | text | |
| is_default | boolean | default false |
| created_at | timestamptz | default now() |

### Table: orders
| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK, default gen_random_uuid() |
| order_number | text | NOT NULL, UNIQUE (ALK-YYYYMMDD-XXXX) |
| user_id | uuid | FK -> auth.users(id) |
| status | text | NOT NULL, default 'pending' |
| subtotal | integer | in paise |
| shipping_cost | integer | in paise |
| total | integer | in paise |
| shipping_address | jsonb | snapshot of address at order time |
| notes | text | |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### Table: order_items
| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK, default gen_random_uuid() |
| order_id | uuid | FK -> orders(id) ON DELETE CASCADE |
| product_id | uuid | FK -> products(id) |
| product_name | text | NOT NULL (snapshot) |
| product_image | text | (snapshot) |
| quantity | integer | NOT NULL, CHECK > 0 |
| unit_price | integer | in paise (snapshot) |
| total_price | integer | in paise |

### Table: payments
| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK, default gen_random_uuid() |
| order_id | uuid | FK -> orders(id), UNIQUE |
| phonepe_merchant_transaction_id | text | NOT NULL, UNIQUE |
| phonepe_transaction_id | text | |
| amount | integer | in paise |
| status | text | default 'initiated' |
| payment_method | text | |
| raw_response | jsonb | full PhonePe callback for audit |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

### Table: order_tracking
| Column | Type | Constraints |
|--------|------|------------|
| id | uuid | PK, default gen_random_uuid() |
| order_id | uuid | FK -> orders(id) ON DELETE CASCADE |
| status | text | NOT NULL |
| description | text | |
| tracking_number | text | |
| courier_name | text | |
| created_at | timestamptz | default now() |

### RLS Policies
- **categories, products:** Public SELECT. Admin-only INSERT/UPDATE/DELETE
- **profiles:** Users SELECT/UPDATE own. Admins SELECT all
- **addresses:** Users full CRUD own rows
- **orders, order_items:** Users SELECT own. Admins SELECT/UPDATE all. INSERT server-side only
- **payments:** SELECT own orders. INSERT/UPDATE server-side only
- **order_tracking:** SELECT where order belongs to user. INSERT/UPDATE admin only

### Database Trigger
Auto-create profiles row on auth.users insert.

---

## Project Structure
```
app/
├── layout.tsx, page.tsx (home)
├── products/page.tsx, [slug]/page.tsx
├── cart/page.tsx
├── checkout/page.tsx (protected)
├── account/ (login, register, profile, orders)
├── admin/ (dashboard, products CRUD, orders management)
├── auth/callback/route.ts, confirm/route.ts
└── api/phonepe/ (initiate + callback routes)

lib/
├── supabase/ (client.ts, server.ts, middleware.ts)
├── phonepe/ (config.ts, initiate-payment.ts, verify-payment.ts)
├── animations/ (gsap-setup.ts, scroll-triggers.ts, magnetic-cursor.ts)
├── types/ (database.ts, product.ts, order.ts, cart.ts)
└── utils.ts, constants.ts

components/
├── ui/ (Button, Input, Card, Modal, Skeleton, MagneticCursor, Marquee)
├── layout/ (header, footer, mobile-nav, smooth-scroll-provider)
├── product/ (card, gallery, filters, sort, add-to-cart, product-tilt)
├── cart/ (drawer, item, summary)
├── checkout/ (address-form, order-summary, phonepe-button)
├── home/ (hero, featured-scroll, category-cards, brand-story, testimonials, marquee-banner)
└── account/ (auth-form, profile-form, order-history)

stores/cart-store.ts
middleware.ts (auth session refresh + route protection)
```

---

## PhonePe Payment Flow
1. User clicks "Pay" → Frontend calls `POST /api/phonepe/initiate`
2. Server creates order + payment rows, builds PhonePe payload, generates SHA256 checksum
3. Server calls PhonePe `/pg/v1/pay`, returns redirect URL
4. User completes payment on PhonePe page
5. PhonePe server callback hits `POST /api/phonepe/callback` → verify checksum → update order/payment status
6. User redirected to confirmation page → safety status check via PhonePe status API

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

PHONEPE_MERCHANT_ID=
PHONEPE_SALT_KEY=
PHONEPE_SALT_INDEX=1
PHONEPE_ENV=UAT
PHONEPE_BASE_URL=https://api-preprod.phonepe.com/apis/pg-sandbox
```

---

## Implementation Phases

### Phase 1: Foundation + Home Page
- [x] Delete index.html, init Next.js with TypeScript + Tailwind
- [x] Install deps
- [ ] Set up Supabase clients (browser + server + middleware)
- [ ] Run Supabase migrations: all 8 tables + RLS + trigger + storage buckets
- [ ] Set up Lenis smooth scrolling + GSAP ScrollTrigger
- [ ] Build animated layout: header, footer, mobile nav
- [ ] Build Home Page with all signature elements
- [ ] Seed DB with sample products/categories

### Phase 2: Product Catalog & Detail Page
- [ ] Product listing with filters, sort, search
- [ ] Animated product cards
- [ ] Product detail page with premium interactions
- [ ] Page transitions, SEO metadata

### Phase 3: Cart & Authentication
- [ ] Zustand cart store + cart drawer + cart page
- [ ] Add-to-cart fly animation
- [ ] Supabase Auth (register, login, PKCE)
- [ ] Profile page, address management
- [ ] Route protection

### Phase 4: Checkout & Payments
- [ ] Checkout page with address + order summary
- [ ] PhonePe initiate + callback API routes
- [ ] Order confirmation, history, tracking

### Phase 5: Admin Panel
- [ ] Admin layout + role check
- [ ] Product CRUD with image upload
- [ ] Order management

### Phase 6: Polish & Deploy
- [ ] Loading states, error boundaries, toasts
- [ ] SEO, performance optimization
- [ ] Vercel deployment

---

## Dependencies
```
next, react, react-dom, typescript
@supabase/supabase-js, @supabase/ssr
gsap, @gsap/react, framer-motion, lenis
zustand
tailwindcss, clsx, tailwind-merge, lucide-react
```
