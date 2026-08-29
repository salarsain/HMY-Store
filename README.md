# HMY Store — Luxury Eastern Fashion & Royal Fragrances

> A premium, multi-page e-commerce storefront built with pure HTML, CSS, and JavaScript. Features WhatsApp-based checkout, Supabase-powered order management, and a full admin dashboard.

🌐 **Live Site**: [https://salarsain.github.io/HMY-Store/](https://salarsain.github.io/HMY-Store/)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [File Structure](#file-structure)
- [Pages](#pages)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [Supabase Database Setup](#supabase-database-setup)
- [Admin Panel](#admin-panel)
- [Order Flow](#order-flow)
- [Deployment](#deployment)
- [Customization Guide](#customization-guide)
- [Troubleshooting](#troubleshooting)

---

## Overview

HMY Store is a client-ready luxury e-commerce demo designed for Eastern fashion brands. It features a cinematic full-screen video hero, horizontal product carousels, a responsive product catalog, and a complete WhatsApp-based checkout system with order persistence via Supabase.

The site is fully static (no backend server required) and can be hosted for free on GitHub Pages, Netlify, or Vercel.

---

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| **HTML5** | Semantic page structure |
| **CSS3** | Custom design system with CSS variables, glassmorphism, animations |
| **Vanilla JavaScript** | All interactivity — no frameworks |
| **Supabase** | Cloud database for order storage + admin authentication |
| **Font Awesome 6** | Icon library |
| **Google Fonts** | Playfair Display, Inter, Cinzel typography |
| **GitHub Pages** | Free static hosting |

---

## Features

### Storefront
- 🎬 **Full-screen video hero** with scroll-snap panels and navigation dots
- 🛍️ **14-product catalog** with sizes, colors, image galleries, and discount badges
- 🔍 **Shop page** with category filtering, search, and sorting
- 📱 **Fully responsive** design (desktop, tablet, mobile)
- 🛒 **Slide-out cart drawer** accessible from every page
- 💬 **WhatsApp checkout** — auto-generates order message and opens WhatsApp
- 📦 **Order persistence** — orders saved to Supabase before WhatsApp redirect
- ✨ **Scroll-reveal animations** using Intersection Observer
- 🎨 **Luxury dark theme** with gold, cream, and burgundy accents

### Admin Dashboard
- 🔐 **Secure login** via Supabase Authentication
- 📊 **Stats overview** — Total orders, today's orders, revenue, pending count
- 📋 **Orders table** — View, filter, search, and manage all orders
- 🔄 **Status management** — Update order status (Pending → Confirmed → Shipped → Delivered)
- 🗑️ **Delete orders** with confirmation modal
- 📥 **CSV export** — Download all orders as spreadsheet
- 📈 **Activity feed** — Recent order timeline
- 📊 **Order breakdown** — Visual status distribution bars
- 💬 **WhatsApp customer** — Direct message link from order detail
- 🖨️ **Print order** — One-click print from order detail modal

---

## File Structure

```
HMY-Store/
├── index.html                 # Landing page (hero videos + featured products)
├── shop.html                  # Shop / category page (all products)
├── product.html               # Product detail page (size/color selectors)
├── cart.html                  # Full cart page with checkout form
│
├── css/
│   ├── base.css               # Design system tokens (colors, typography, spacing)
│   ├── components.css         # Reusable components (buttons, cards, forms, modals)
│   ├── animations.css         # Scroll-reveal, transitions, keyframe animations
│   ├── layout.css             # Header, footer, navigation, cart drawer, grids
│   └── pages.css              # Page-specific styles (hero, shop, product, cart)
│
├── js/
│   ├── config.js              # Supabase credentials, WhatsApp number, store settings
│   ├── products.js            # Product catalog data (14 products with variants)
│   ├── cart.js                # Cart logic, WhatsApp message builder, Supabase order save
│   ├── app.js                 # Landing page logic (hero scroll, featured grid, reveals)
│   ├── shop.js                # Shop page logic (filtering, sorting, rendering)
│   └── product-detail.js      # Product detail logic (gallery, size/color, add to cart)
│
├── admin/
│   ├── index.html             # Admin login page
│   ├── dashboard.html         # Admin orders dashboard
│   └── admin.css              # Admin-specific styles
│
├── videos/
│   ├── hero-1.mp4             # Hero panel 1 — Brand introduction
│   ├── hero-2.mp4             # Hero panel 2 — Men's collection
│   └── hero-3.mp4             # Hero panel 3 — Women's collection
│
├── images/                    # Product images directory
├── supabase/                  # Supabase configuration files
├── .gitignore
├── LICENSE
└── README.md
```

---

## Pages

### 1. Landing Page (`index.html`)
- Announcement ticker bar with marquee animation
- Full-screen video hero with 3 scroll-snap panels
- Mega menu navigation with 4 category columns (Men, Women, Fragrances, Accessories)
- Featured products horizontal carousel
- Category showcase grid
- Brand story section
- Newsletter signup
- Full footer with links

### 2. Shop Page (`shop.html`)
- Breadcrumb navigation
- Category filter pills (Men Stitched, Women Stitched, etc.)
- Search bar
- Sort dropdown (Featured, Price Low-High, Price High-Low, Newest)
- Responsive 4-column product grid
- Product cards with hover effects, badges, and quick-add buttons
- URL-based category filtering (`shop.html?cat=men-stitched`)

### 3. Product Detail Page (`product.html`)
- Image gallery with thumbnail navigation
- Product title, price, discount badge
- Color swatches (visual selection)
- Size selector buttons
- Quantity controls
- ADD TO BAG button
- BUY NOW VIA WHATSAPP button (direct checkout)
- Accordion sections (Description, Fabric Details, Shipping Info)
- Related products section

### 4. Cart Page (`cart.html`)
- Cart items table with quantity controls
- Remove item functionality
- Order summary (subtotal, shipping, total)
- Customer information form (name, phone, email, address)
- ORDER VIA WHATSAPP button
- Order saved to Supabase before WhatsApp redirect

### 5. Admin Login (`admin/index.html`)
- Email/password login form
- Supabase Authentication integration
- Auto-redirect to dashboard on successful login

### 6. Admin Dashboard (`admin/dashboard.html`)
- Protected route (redirects to login if not authenticated)
- Stats cards, orders table, tabs, search, filters, CSV export

---

## Setup & Installation

### Prerequisites
- A [Supabase](https://supabase.com) account (free tier works)
- A [GitHub](https://github.com) account
- Git installed on your machine

### Local Development

```bash
# Clone the repository
git clone https://github.com/salarsain/HMY-Store.git
cd HMY-Store

# Serve locally (any static server works)
npx serve -l 3000 .

# Open in browser
# http://localhost:3000
```

---

## Configuration

All configuration is centralized in [`js/config.js`](js/config.js):

```javascript
const CONFIG = {
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
  },
  whatsapp: {
    number: '923128464742',    // International format without +
    businessName: 'HMY Store'
  },
  store: {
    name: 'HMY',
    tagline: 'Luxury Eastern Fashion & Royal Fragrances',
    currency: 'Rs.',
    freeShippingThreshold: 5000,  // Free shipping above this amount
    shippingCost: 250              // Flat rate shipping cost
  }
};
```

---

## Supabase Database Setup

### 1. Create the Orders Table

Go to your Supabase Dashboard → **SQL Editor** → Run:

```sql
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  order_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  shipping_address TEXT,
  payment_method TEXT DEFAULT 'Cash on Delivery',
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(10,2) DEFAULT 0,
  shipping_cost NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can view orders" ON orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orders" ON orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete orders" ON orders
  FOR DELETE USING (auth.role() = 'authenticated');
```

### 2. Create Admin User

Supabase Dashboard → **Authentication** → **Users** → **Add User**:
- Email: `admin@hmystore.com`
- Password: Your secure password
- Auto-confirm: ON

### 3. Get API Credentials

Supabase Dashboard → **Settings** → **API**:
- Copy **Project URL** → paste in `config.js` → `supabase.url`
- Copy **anon/public key** → paste in `config.js` → `supabase.anonKey`

---

## Admin Panel

### Accessing the Admin Panel
- **URL**: `/admin/` or `/admin/index.html`
- **Login**: Use the email/password created in Supabase Authentication

### Dashboard Features

| Feature | Description |
|---------|-------------|
| **Stats Cards** | Total orders, today's orders, total revenue, pending count |
| **Orders Tab** | Full table with search, status filters, and inline status updates |
| **Activity Tab** | Recent order timeline + status breakdown chart |
| **Order Detail** | Click any order ID to view full details (items, address, payment) |
| **Status Update** | Change status via dropdown: Pending → Confirmed → Shipped → Delivered → Cancelled |
| **Delete Order** | Delete with confirmation modal |
| **CSV Export** | Download all orders as CSV spreadsheet |
| **WhatsApp Link** | Direct message customer from order detail |
| **Print** | Print individual order from detail modal |
| **Refresh** | Manual data refresh button |

---

## Order Flow

```
Customer Journey:
┌─────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Browse Shop │───▶│ Product Page  │───▶│   Cart Page   │───▶│  WhatsApp    │
│  (shop.html) │    │ Select Size/  │    │ Fill Details   │    │  Order Msg   │
│              │    │ Color / Qty   │    │ Name, Phone    │    │  Auto-sent   │
└─────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │  Supabase DB      │
                                    │  Order Saved      │
                                    │  (status: pending) │
                                    └──────────────────┘
                                              │
                                              ▼
                                    ┌──────────────────┐
                                    │  Admin Dashboard  │
                                    │  View & Manage    │
                                    │  Update Status    │
                                    └──────────────────┘
```

---

## Deployment

### GitHub Pages (Current)

The site is deployed via GitHub Pages from the `main` branch.

- **Repository**: [github.com/salarsain/HMY-Store](https://github.com/salarsain/HMY-Store)
- **Live URL**: [https://salarsain.github.io/HMY-Store/](https://salarsain.github.io/HMY-Store/)

To update the live site:

```bash
git add .
git commit -m "Your changes description"
git push origin main
# Auto-deploys in 2-3 minutes
```

### Alternative Hosting

| Platform | Deploy Method |
|----------|--------------|
| **Netlify** | Connect GitHub repo → auto-deploy |
| **Vercel** | Import from GitHub → instant deploy |
| **Custom Domain** | Add CNAME record in GitHub Pages settings |

---

## Customization Guide

### Adding New Products

Edit [`js/products.js`](js/products.js) and add a new product object:

```javascript
{
  id: 15,
  title: 'Your Product Name',
  price: 5000,
  originalPrice: 7000,    // Optional: shows discount badge
  category: 'men-stitched',
  badge: 'NEW',
  image: 'https://your-image-url.jpg',
  gallery: ['img1.jpg', 'img2.jpg'],
  sizes: ['S', 'M', 'L', 'XL'],
  colors: [
    { name: 'Black', hex: '#1a1a1a' },
    { name: 'Navy', hex: '#1e3a5f' }
  ],
  description: 'Product description here.',
  fabric: 'Fabric details here.',
  features: ['Feature 1', 'Feature 2']
}
```

### Changing Colors/Theme

Edit CSS variables in [`css/base.css`](css/base.css):

```css
:root {
  --color-gold: #C9A96E;       /* Primary accent */
  --color-cream: #F5F0E8;      /* Text color */
  --color-black: #0A0A0A;      /* Background */
  --color-burgundy: #8B1A2B;   /* Secondary accent */
}
```

### Changing WhatsApp Number

Edit [`js/config.js`](js/config.js) line 15:

```javascript
whatsapp: {
  number: '92XXXXXXXXXX',  // Your number in international format
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Admin login fails | Verify Supabase credentials in `config.js`. Check user exists in Supabase Auth. |
| Orders not saving | Run the SQL schema in Supabase SQL Editor. Check RLS policies are created. |
| WhatsApp not opening | Verify the phone number format (international, no `+` sign). |
| Videos not playing | Ensure video files are in `videos/` folder named `hero-1.mp4`, etc. |
| Site not updating after push | Wait 2-3 minutes for GitHub Pages to rebuild. Clear browser cache. |
| Images broken | Check image URLs in `products.js`. Use absolute URLs for external images. |

---

## License

MIT License — See [LICENSE](LICENSE) file.

---

**Built with ❤️ for HMY Store**
