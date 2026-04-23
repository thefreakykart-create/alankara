# Alankara Codebase Overview

## Purpose

Alankara is a Next.js ecommerce storefront for Indian home decor with a strong focus on wall art. In addition to standard browse, cart, and checkout flows, the app includes:

- configurable wall-art variants by frame type and size
- a gallery wall planner that lets users arrange multiple pieces on a virtual wall
- a "try on my wall" experience using either a live camera or an uploaded room photo
- Supabase-backed authentication, catalog data, order storage, and file uploads
- PhonePe payment initiation and callback handling

## Stack

- Framework: Next.js 16 App Router
- Language: TypeScript
- Styling: Tailwind CSS v4 with CSS variables in `src/app/globals.css`
- UI animation: Framer Motion, GSAP, Lenis
- State: Zustand
- Backend/data/auth/storage: Supabase
- Payments: PhonePe

## High-Level Architecture

This repository is a single web application. There is no separate backend service in the repo.

- Server Components fetch catalog and account data directly from Supabase.
- Client Components handle interactive UX such as cart, wall planning, auth forms, and checkout forms.
- Route Handlers under `src/app/api` act as the backend for payment-related mutations.
- Supabase Middleware keeps sessions fresh and enforces authentication for protected route groups.

## Main Directories

- `src/app`
  App Router pages, layouts, route handlers, and route-level metadata.
- `src/components`
  UI and feature components grouped by domain: `home`, `product`, `planner`, `cart`, `account`, `layout`, `ui`.
- `src/lib`
  Shared utilities, constants, type definitions, Supabase helpers, and PhonePe config.
- `src/stores`
  Zustand stores for the cart and cart drawer.

## Key Routes

- `/`
  Home page. Fetches featured products and categories from Supabase.
- `/products`
  Product listing page with category and sort filtering.
- `/products/[slug]`
  Product detail page. Renders either a general product layout or a wall-art layout depending on `product_type`.
- `/planner`
  Gallery wall planner for wall-art products only.
- `/cart`
  Cart page backed by persisted Zustand state.
- `/checkout`
  Checkout form and payment initiation.
- `/checkout/success`
  Post-checkout confirmation page.
- `/account`
  Authenticated customer account page with profile and order history.
- `/admin`
  Admin dashboard.
- `/admin/products`
  Product listing for admins.
- `/admin/products/new`
  Client-side general product creation flow.
- `/admin/products/publish`
  Client-side wall-art publishing flow with variant generation.
- `/api/phonepe/initiate`
  Creates orders and payments, then initiates PhonePe.
- `/api/phonepe/callback`
  Verifies the callback and updates payment and order state.

## Data Model

The app expects these primary Supabase tables:

- `categories`
- `products`
- `product_variants`
- `profiles`
- `orders`
- `order_items`
- `payments`
- `order_tracking`

### Product Model

Defined in `src/lib/types/product.ts`.

- `general` products use `products.price`, `products.compare_at_price`, and `products.stock_quantity`
- `wall_art` products use `product_variants` for frame-specific pricing, imagery, and stock

Wall-art variants are keyed by:

- `frame_type`: `canvas`, `acrylic`, `wooden`
- `size`: `8x12`, `12x18`, `18x24`, `24x36`

## Core Application Flows

### 1. Catalog And Product Discovery

- Home page uses `createClient()` from `src/lib/supabase/server.ts`
- Featured products come from `products`
- Category tiles come from `categories`
- Product listing page builds Supabase queries dynamically based on URL search params

### 2. Product Detail Rendering

`src/app/products/[slug]/page.tsx` branches on `product.product_type`.

- General products render a classic gallery + details + add-to-cart layout
- Wall-art products load active variants and render `WallArtProduct`

Wall-art detail pages include:

- frame type selection
- size selection
- variant-specific pricing
- variant-specific imagery
- try-on-wall modal

### 3. Cart

The cart is stored entirely in persisted Zustand state:

- store: `src/stores/cart-store.ts`
- persistence key: `alankara-cart`

The store intentionally supports both:

- general items keyed by `productId`
- wall-art items keyed by `variantId ?? productId`

Cart UI surfaces:

- header drawer
- `/cart`
- checkout summary

### 4. Gallery Wall Planner

Planner entry point:

- page: `src/app/planner/page.tsx`
- orchestrator: `src/components/planner/gallery-wall-planner.tsx`

The planner:

- fetches all active `wall_art` products and their active variants
- allows drag-and-drop placement onto a wall canvas
- supports arrangement presets
- supports frame type and size reconfiguration per placed item
- can export a screenshot using `html2canvas`
- adds the full wall composition to cart in one action

Planner state is local to the component tree and not persisted between sessions.

### 5. Try-On-Wall Flow

Main component:

- `src/components/product/try-on-wall-modal.tsx`

Modes:

- choice screen
- live camera mode using `getUserMedia`
- uploaded room photo mode

Capabilities:

- drag, scale, and rotate the artwork
- approximate real-world size based on frame dimensions
- export a composite screenshot

### 6. Authentication And Account

Supabase auth helpers:

- browser client: `src/lib/supabase/client.ts`
- server client: `src/lib/supabase/server.ts`
- middleware session refresh: `src/lib/supabase/middleware.ts`

Auth routes:

- `/account/login`
- `/account/register`
- `/auth/callback`
- `/auth/confirm`

Protected customer routes currently include:

- `/checkout`
- `/account`

Account page responsibilities:

- load current user
- load `profiles` row
- load user orders

### 7. Admin Flows

Admin pages are rendered under `/admin`.

Server-rendered admin pages check `profiles.role === "admin"`:

- `/admin`
- `/admin/orders`
- `/admin/products`

Admin write flows are client-side:

- `/admin/products/new`
- `/admin/products/publish`

These pages write directly to Supabase from the browser, including storage uploads.

### 8. Checkout And Payments

Checkout page:

- `src/app/checkout/page.tsx`

Flow:

1. Read cart contents from Zustand
2. Collect shipping address
3. Confirm current user via Supabase auth
4. POST order payload to `/api/phonepe/initiate`
5. Redirect to PhonePe if configured
6. Otherwise complete in demo mode

PhonePe route behavior:

- creates the `orders` row
- creates `order_items`
- creates a `payments` row
- inserts initial `order_tracking` in demo mode or on successful callback

## Environment Variables

The app expects these runtime variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PHONEPE_MERCHANT_ID`
- `PHONEPE_SALT_KEY`
- `PHONEPE_SALT_INDEX`
- `PHONEPE_ENV`
- `PHONEPE_BASE_URL`

If the PhonePe credentials are missing, `/api/phonepe/initiate` falls back to a demo-success mode and marks the payment as successful.

## Visual System

The design system is defined mostly through CSS variables in `src/app/globals.css`.

Notable characteristics:

- luxury/heritage color palette with cream, terracotta, gold, emerald, burgundy, and charcoal
- serif + sans font pairing via Playfair Display and DM Sans
- motion-heavy home page and polished micro-interactions
- grain overlay and custom scrollbar styling

## Build And Quality Status

As of the latest code review:

- `npm run build` passes
- `npm run lint` fails with a small set of React/ESLint issues

The current lint errors are concentrated in:

- `src/app/cart/page.tsx`
- `src/components/planner/planner-wall.tsx`
- `src/components/product/try-on-wall-modal.tsx`
- `src/components/ui/magnetic-cursor.tsx`

Most warnings are minor cleanup items. The lint errors are worth fixing because they indicate React patterns that are brittle under newer rules.

## Highest-Priority Risks

### 1. Variant Cart Identity Bug

Severity: high

The cart store treats wall-art items as variant-aware, but the cart UI still updates and removes items using `item.productId` in several places.

Affected files:

- `src/app/cart/page.tsx`
- `src/components/cart/cart-drawer.tsx`

Impact:

- quantity updates can target the wrong item
- remove actions can behave incorrectly for wall-art variants
- duplicate variants may collide visually because list keys also use `productId`

Recommended direction:

- introduce a consistent cart line identifier such as `variantId ?? productId`
- use that identifier for React keys, remove calls, and quantity updates everywhere

### 2. Checkout Trusts Client-Supplied Pricing

Severity: high

`/api/phonepe/initiate` accepts `items`, `subtotal`, `shippingCost`, and `total` from the browser and uses them directly to create order records.

Impact:

- totals can be tampered with client-side
- stale prices can be stored in orders
- stock is not revalidated server-side before order creation

Recommended direction:

- re-fetch product or variant pricing on the server
- compute subtotal and total on the server
- validate stock before creating the order

### 3. Admin Write Protection Depends Heavily On Supabase Policy

Severity: medium to high

The admin creation pages write directly to Supabase from the client. They do not independently verify admin role in-page before attempting writes.

Impact:

- if RLS/storage policies are loose, non-admin users could create products or upload files

Recommended direction:

- ensure strict RLS and storage policies
- optionally move admin mutations into server actions or route handlers with explicit role checks

### 4. Real PhonePe Completion Does Not Clear The Cart

Severity: medium

In demo mode, the cart is cleared before redirecting to the success page. In the real redirect flow, the user is sent to PhonePe and then back to `/checkout/success`, but the client-side cart is not clearly cleared afterward.

Impact:

- cart may still show purchased items after successful payment

Recommended direction:

- clear cart after confirmed success return
- ideally confirm the order or payment state before clearing

### 5. Generic README Does Not Reflect The Real Project

Severity: low

The root `README.md` is still the default create-next-app template and does not document the actual product, architecture, or setup expectations.

Impact:

- slower onboarding
- important service dependencies are hidden

Recommended direction:

- replace the root README with project-specific setup and usage notes
- link to this overview document

## Suggested Next Steps

Recommended order of work:

1. fix cart line identity so wall-art variants behave correctly
2. harden checkout by recalculating pricing server-side
3. verify or tighten Supabase RLS and storage policies for admin writes
4. fix current lint errors to align with React 19 and Next.js 16 expectations
5. replace the default root README with app-specific setup docs

## Useful Entry Points For Future Work

- app shell: `src/app/layout.tsx`
- home page data loading: `src/app/page.tsx`
- product listing: `src/app/products/page.tsx`
- product detail branching: `src/app/products/[slug]/page.tsx`
- planner orchestration: `src/components/planner/gallery-wall-planner.tsx`
- cart state: `src/stores/cart-store.ts`
- checkout flow: `src/app/checkout/page.tsx`
- payment initiation: `src/app/api/phonepe/initiate/route.ts`
- auth middleware: `src/lib/supabase/middleware.ts`
