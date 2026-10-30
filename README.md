# MESM — Jewellery E-Commerce & WhatsApp Order Web Application

> **"Personalized Accoutrements for Ladies"**
> *A carefully selected collection of modern and traditional jewellery, with styles for everyday wear and special occasions.*

---

## 🌸 Overview

**MESM** is a complete, production-oriented jewellery e-commerce and WhatsApp order-taking web application for a Pakistan-based retailer offering carefully selected modern and traditional jewellery. It combines an editorial storefront with a mobile-first WhatsApp checkout, persistent inventory management, QR codes for every product, and an admin console designed for non-technical business owners.

---

## ✨ Key Features

### 1. Brand Identity & Design System
- **Official Brand Logo**: Uses the MESM wordmark at `public/images/meems-gems-logo.png`.
- **Editorial Palette**: Warm ivory, ruby-burgundy, velvet-black, and antique-gold accents.
- **Tasteful Glassmorphism**: Frosted glass panels, subtle blur overlays, and soft rounded cards (`rounded-3xl`).
- **Mobile-First UX**: Responsive across smartphones, tablets, laptops, and large desktop screens.

### 2. Customer Storefront
- **Announcement Bar**: Customizable promo banner with free delivery alerts.
- **Hero Showcase**: Tagline, value propositions, and direct collection entry points.
- **Shop by Category**: Curated categories for modern and traditional jewellery, accessories, gifts, and new arrivals.
- **Popular Products / Customer Favourites**: Automatically ranked from **real database order records** (excluding cancelled orders), clearly distinguishing bestsellers from manually featured items.
- **Catalogue & Search**: Search by name, SKU, or tags; filter by category, price, and in-stock status; sort by newest, price, or order popularity.
- **Product Detail**: Multi-image zoom gallery, video support, variation swatches (color, chain length, ring size), quantity selectors, and stock availability alerts.
- **Persistent Cart & Wishlist**: Guest storage in `localStorage` that persists across refreshes.
- **Social Sharing**: WhatsApp, Facebook, Pinterest, native mobile Web Share API, and Copy Link.
- **Dynamic QR Codes**: Generated automatically for each product pointing to its public URL with instant PNG and SVG downloads and printable label sheets.

### 3. WhatsApp Checkout & Order Processing
- **Streamlined Ordering**: Like ordering food from a restaurant.
- **Order Flow**: Browse → Add to Bag → Enter Customer Details (Name, Phone, City, Address) → Select Payment Method → Submit Order.
- **Database-First Persistence**: The order and line-item snapshot are persistently saved in the database **before** WhatsApp opens. If a popup is blocked or WhatsApp is unavailable, the order is never lost.
- **Authoritative Stock Checks**: Inventory is verified and decremented upon order placement. If cancelled in admin, stock is automatically restored.
- **Prefilled WhatsApp Message**: Generates a formatted message ready for the customer to tap "Send":
  ```text
  Hello MESM! I would like to confirm my jewellery order.

  Order No: MG-XXXXXX
  Customer Name: Ayesha Malik
  Phone: 03001234567
  City: Lahore
  Delivery Address: House 42, Street 7, Phase 5 DHA

  Order Items:
  - Botanical Wildflower Pendant x 1
    - Selected Variation: Chain Length: 18 inches
    - Unit Price: PKR 1,850
    - Line Total: PKR 1,850

  Subtotal: PKR 1,850
  Delivery: PKR 250
  Discount: PKR 0
  Total: PKR 2,100
  Payment Method: EASYPAISA

  Please confirm availability and delivery details. Thank you!
  ```
- **Order Confirmation Page**: Shows order number, payment instructions, copy button, and alternative WhatsApp contact.

### 4. Admin Management Console (`/admin`)
- **Protected Access**: Role and session cookie verification (`/admin/login`).
- **Dashboard Metrics**: Confirmed sales (paid), pending order value, gross order value, total units sold, low-stock warnings, out-of-stock items, and 7-day order volume trends.
- **Dedicated Add Product Workflow (`/admin/products/new`)**:
  - **Section A**: Title, auto/manual SKU, category, search tags, draft/published status, featured toggle.
  - **Section B**: Multiple image upload & preview, cover image picker, and video URL.
  - **Section C**: Selling price, compare-at price, cost price (private).
  - **Section D**: Stock tracking, low-stock thresholds, backorders, dynamic variations builder (e.g. Colors, Sizes).
  - **Section E**: Technical attributes (Material, Dimensions, Weight, Care Instructions).
  - **Section F**: Save Draft, Preview, and Publish.
- **Product Operations**: Edit, duplicate, archive, delete, and view product QR code.
- **Category CRUD**: Create, edit, set slugs, upload banners, reorder, and hide/publish.
- **Order Management**: Search by order number, customer name, or phone. Filter by order status and payment status. Update fulfillment status (`pending`, `confirmed`, `preparing`, `ready`, `shipped`, `delivered`, `cancelled`) with automatic stock restoration on cancellation.
- **Customer WhatsApp Chat**: One-click deep link to chat with the customer about their specific order number.
- **Configurable Store Settings**:
  - Change business WhatsApp phone number without editing code or redeploying.
  - Change EasyPaisa & JazzCash account numbers and account titles.
  - Bank transfer details (Meezan Bank).
  - Delivery fees & Free Delivery threshold (PKR 3,000).
  - Announcement bar text and toggles.
  - One-click demo seed data reset.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **Icons** | Lucide React |
| **QR Code Engine** | `qrcode` (PNG data URLs & SVG strings) |
| **Database & Auth** | Supabase (PostgreSQL) + Persistent local repository fallback engine |
| **Validation** | Zod & TypeScript domain models |
| **Testing** | Node.js native test runner (`node --test`) |
| **Deployment Target** | Vercel |

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js `v18.17+` or `v20+`
- npm `v9+` or `v10+`

### 1. Clone & Install
```bash
cd meems-gems
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure private administrator credentials in `.env.local`; never commit that file:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_USERNAME=your-private-admin-username
ADMIN_PASSWORD=use-a-unique-password-at-least-15-characters
ADMIN_SESSION_SECRET=generate-a-random-secret-at-least-32-characters
```

Generate a random session secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

For local development without Supabase, the app uses development seed content stored in the ignored `data/store.json` file. Replace its sample catalogue and configure store contact/payment details before launch. Supabase credentials are required for a shared, persistent production store; never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Administrator Setup

The admin login has no built-in credentials. Set `ADMIN_USERNAME`, a private `ADMIN_PASSWORD` with at least 15 characters, and a random `ADMIN_SESSION_SECRET` with at least 32 characters in the server environment (for local work, `.env.local`; for deployment, the hosting provider's secret settings). Existing deployments may continue using `ADMIN_EMAIL` as the login identifier. If any value is missing or too short, sign-in remains disabled. The login page never displays credentials.

Admin access currently uses the project's server-side environment-backed login; Google sign-in and database-managed user roles have not yet been configured.

---

## 🧪 Running Automated Unit Tests

Run the built-in critical logic test suite:
```bash
npm test
```
Verifies:
1. Cart subtotal calculations and free delivery thresholds (PKR 3,000 threshold).
2. Pakistani phone number formatting (`+92`, `03xx`) and WhatsApp deep links.
3. WhatsApp prefilled order message structure.
4. Inventory reservation policy and stock restoration upon cancellation.
5. Stock rejection when requested quantity exceeds inventory.

---

## 🗄️ Supabase Database Setup & Schema

When connecting to Supabase:
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Open `supabase/schema.sql` in this project, copy its entire contents, and click **Run**. For an existing database, run the applicable SQL files in `supabase/migrations/`, including the review moderation and store brand copy migrations.
4. The script creates:
   - `store_settings`
   - `categories`
   - `products`
   - `orders`
   - `reviews`
   - Indexes and Row-Level Security (RLS) policies.
5. In your project settings, copy your **Project URL**, **Anon Key**, and **Service Role Key**, and add them to your Vercel Environment Variables or `.env.local`.

---

## ☁️ Deploying to Vercel

1. Push the code to a GitHub repository.
2. In [Vercel](https://vercel.com), click **Add New Project** and select your GitHub repository.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_APP_URL`: Your production domain (e.g. `https://meemsgems.vercel.app`)
   - `ADMIN_USERNAME`: your administrator username
   - `ADMIN_PASSWORD`: Your private admin password
   - `ADMIN_SESSION_SECRET`: A long random secret string
   - *(Optional)* `NEXT_PUBLIC_SUPABASE_URL`
   - *(Optional)* `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - *(Optional)* `SUPABASE_SERVICE_ROLE_KEY`
4. Click **Deploy** and review the build output before directing customers to the store.

---

## 📋 Practical Manual Testing Checklist

| Step | Action | Expected Result | Status |
|---|---|---|---|
| 1 | Visit Homepage `/` | Official logo, hero, and published category cards render. | Not re-verified |
| 2 | Browse Catalogue `/shop` | Filters, sorting, and quick add work for configured products. | Not re-verified |
| 3 | Open a product detail page | Gallery, variations, QR, and sharing work for configured products. | Not re-verified |
| 4 | Add to Cart & Drawer | Cart and quantity changes recalculate totals. | Not re-verified |
| 5 | Checkout `/checkout` | Submit customer details; order is saved before WhatsApp opens when configured. | Not re-verified |
| 6 | Order Persistence | Order is saved and a confirmation page is shown. | Not re-verified |
| 7 | Admin Login `/admin/login` | Sign in with private server environment credentials. | Not re-verified |
| 8 | Add Product `/admin/products/new` | Create a product and verify it appears after publishing. | Not re-verified |
| 9 | Order Management `/admin/orders` | Update order status and verify the resulting inventory. | Not re-verified |
| 10 | Settings `/admin/settings` | Saved store details appear on the storefront. | Not re-verified |

---

## 📄 License & Attribution

Designed and developed for **MESM**. All original brand imagery and marks belong to MESM.
