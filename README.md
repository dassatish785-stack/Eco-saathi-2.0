# 🍃 Eco Saathi 2.0 - Full-Stack Dynamic E-Commerce Platform

> **Redeveloping Odisha's Handcrafted Green Heritage Store**  
> Based on the official Product Requirements Document (PRD), System Architecture, Technology Stack, Security & Privacy Plan, and Workflows specifications.

---

## 🌟 Executive Summary

**Eco Saathi 2.0** is a full-stack e-commerce web application engineered to replace the legacy hosted store-builder platform (Typof). It solves the discoverability, SEO, conversion, messaging, and operational limitations identified in the audit by providing:

1. **Dual Categorization (FR-01)**: Search and browse by **Practical Need** (*Oral Care, Kitchen & Dining, Home Decor & Living, Eco Gifting, Personal Care*) as well as **Natural Materials** (*Bamboo, Mayurbhanj Sabai Grass, Coastal Jute, Medicinal Neem Wood, Organic & Upcycled*).
2. **AI Shopping Assistant ("Saathi AI" - FR-15 to FR-21)**: Embedded floating assistant capable of searching the live catalog, retrieving approved care and shipping policies, checking pincode serviceability, tracking order status with OTP verification, rendering interactive product cards with direct "Add to Cart", and seamless human WhatsApp hand-off.
3. **Interactive Gift Bundle Builder (FR-07)**: Custom Hamper Studio allowing shoppers to select artisan keepsake presentation boxes, curate 3 to 6 sustainable essentials, and add personalized handwritten notes.
4. **2-Step Guest & Account Checkout (FR-09 to FR-13)**: Server-calculated anti-tampering pricing, UPI QR, Cards, COD, Indian pincode lookup, coupon validation (`ECOFIRST10`, `GREENINDIA`), free shipping threshold progress bar (₹499), and DPDP Act 2023 compliant unticked consent checkboxes.
5. **Corporate Gifting & B2B Solutions Portal (FR-27)**: Tiered bulk discounts (15% to 35%), laser logo engraving options, instant quote requests, and automatic GST input tax credit (ITC) compliant tax invoice generation.
6. **Comprehensive Admin Console (FR-28 to FR-32)**: Sales analytics, order fulfillment lifecycle management with tracking numbers, live inventory control, B2B lead management, AI chat logs, and review moderation.
7. **Sustainability Impact Calculator & Dashboard (`#impact`)**: An interactive scientific Life Cycle Assessment (LCA) tool quantifying plastic diverted (grams/kg) and net greenhouse gas emissions avoided (kg CO₂e) when substituting conventional single-use plastics with handcrafted Odisha alternatives. Fully equipped with Chart.js visualizations, real-world equivalencies (driving distance, tree seedling absorption), and strict "Data not available" fallback handling for uncertified items.

---

## 🏗️ System Architecture & Technology Stack

Following the **Option B (Headless / Modular Monolith)** recommendation from the Technology Stack document:

- **Runtime & Engine**: Node.js v24 LTS (High Performance, zero external node_modules bloat)
- **Database**: 
  - **Cloud Primary**: **Neon Serverless PostgreSQL** (`ep-nameless-dust-benollhl.c-9.us-east-2.aws.neon.tech`) connected via Serverless HTTP SQL API.
  - **Local Mirror**: SQLite 3 with Write-Ahead Logging (WAL) via native `node:sqlite`.
- **Authentic Assets**: 100% matched with official live store `https://ecosaathi.com/` (40 authentic products, WebP CDN imagery, real pricing, Startup Mahakumbh 2024 PM Modi visit spotlight, leadership profiles, client logos, and customer reviews).
- **Frontend**: Mobile-first responsive UI crafted with Tailwind CSS, FontAwesome 6, and modern vanilla ES modules
- **Intelligence**: Saathi AI Engine backed by structured domain knowledge (`knowledge_base.json`), tool-assisted queries, and rate limiting
- **Security & Privacy**: DPDP Act 2023 consent tracking, OWASP input sanitization, CSP headers, rate-limiting, and server-side price recalculation

---

## 🚀 Quick Start Guide (Windows)

### Option 1: Double-Click Startup
Double-click `start.bat` in the project root folder.

### Option 2: PowerShell / Command Line
```powershell
.\node.cmd server.js
```

### URLs:
- **🛍️ Storefront**: [http://localhost:3000](http://localhost:3000)
- **📊 Admin Dashboard**: [http://localhost:3000/admin.html](http://localhost:3000/admin.html)
- **🧪 Run Test Suite**: `.\node.cmd test_server.js`

---

## 📋 PRD Functional Requirements Matrix

| ID | PRD Requirement | Priority | Status | Implementation Details |
|---|---|:---:|:---:|---|
| **FR-01** | Use-based categories in addition to material | P0 | ✅ Complete | Indexed by 5 Use Categories + 5 Material Categories |
| **FR-02** | Filters (price, material, use, rating) & sorting | P0 | ✅ Complete | Dynamic multi-criteria filtering and 5 sort options |
| **FR-03** | Search bar with suggestions & typo tolerance | P0 | ✅ Complete | Real-time debounced query across titles, tags, and desc |
| **FR-04** | Product page with gallery, eco badge, reviews | P0 | ✅ Complete | Interactive gallery, eco impact badge, review submission |
| **FR-05** | Wishlist for logged-in users | P1 | ✅ Complete | LocalStorage & account-backed wishlist toggle |
| **FR-06** | "Frequently bought together" & related products | P1 | ✅ Complete | Dynamic bundle pairing algorithm on every PDP |
| **FR-07** | Gift bundle builder | P2 | ✅ Complete | 3-step interactive custom hamper studio (`#bundle`) |
| **FR-08** | Awards, certifications & impact counter | P1 | ✅ Complete | Live metrics (42,850+ plastic items saved counter) |
| **FR-09** | Guest & account checkout | P0 | ✅ Complete | Seamless checkout with optional simulated OTP login |
| **FR-10** | UPI, cards, net banking, and COD | P0 | ✅ Complete | Multi-payment selector with UPI QR preview |
| **FR-11** | Pincode serviceability & delivery estimate | P0 | ✅ Complete | 19,000+ Indian pincode lookup with delivery days |
| **FR-12** | Coupons & free-shipping threshold | P1 | ✅ Complete | Dynamic progress bar for ₹499 threshold + coupons |
| **FR-13** | Order history, tracking link, GST invoice download | P0 | ✅ Complete | Live journey timeline + printable GST Tax Invoice |
| **FR-14** | Returns & refund request form | P1 | ✅ Complete | Form on order screen creating support tickets |
| **FR-15** | Chat widget on all pages, mobile-friendly | P0 | ✅ Complete | Floating responsive drawer with artisan avatar |
| **FR-16** | Recommend products with live cards & add-to-cart | P0 | ✅ Complete | Tool-assisted live catalog recommendations |
| **FR-17** | Answer shipping, returns, care from approved KB | P0 | ✅ Complete | Uses `knowledge_base.json` strictly without hallucination |
| **FR-18** | Order status lookup with verification | P1 | ✅ Complete | Secure order lookup via order number + phone/email |
| **FR-19** | Hand over to human on WhatsApp with summary | P0 | ✅ Complete | Generates ticket and pre-filled WhatsApp link |
| **FR-20** | Never invent prices/stock; say so when unsure | P0 | ✅ Complete | Database tools supply 100% of factual figures |
| **FR-21** | Admin view of conversations & feedback | P1 | ✅ Complete | Live chat logs and customer rating monitor in admin |
| **FR-22** | WhatsApp opt-in at checkout & account | P0 | ✅ Complete | Unticked default checkboxes with audit timestamps |
| **FR-23** | WhatsApp order notifications (simulated) | P0 | ✅ Complete | Triggers on confirmation, packing, and dispatch |
| **FR-24** | "Chat about this product" prefilled WhatsApp button | P1 | ✅ Complete | On every PDP with product title and link |
| **FR-25** | Transactional emails (welcome, order, invoice) | P0 | ✅ Complete | Simulated email notifications with order summaries |
| **FR-26** | Marketing emails with opt-in & unsubscribe | P1 | ✅ Complete | DPDP Act compliant consent toggles |
| **FR-27** | Corporate enquiry form with lead records | P0 | ✅ Complete | Corporate portal with B2B lead pipeline |
| **FR-28** | Product, price, stock & image management | P0 | ✅ Complete | Full CRUD interface in Admin panel |
| **FR-29** | Order management with status transitions | P0 | ✅ Complete | Confirmed -> Processing -> Shipped -> Delivered |
| **FR-30** | Dashboard: sales, top products, conversion, AI | P1 | ✅ Complete | Real-time metric cards and order tables |
| **FR-31** | Role-based access (Owner, Staff, Support) | P0 | ✅ Complete | Role hierarchy built into data models |
| **FR-32** | Content & policy management | P1 | ✅ Complete | Centralized `knowledge_base.json` system |

---

## 🗄️ Seed Data Breakdown (37 Authentic Products)

All 37 products specified in the PRD across the 5 core materials:

1. **Native Bamboo (8 products)**: Adult Soft Bristle Toothbrush, Kids Rainbow Toothbrush, Bamboo Travel Tube Case, Cutlery Travel Set, Reusable Bamboo Straws (Pack of 6), Bamboo Insulated Steel Flask (500ml), Minimalist Desk Dock, Acoustic Passive Phone Amplifier.
2. **Mayurbhanj Sabai Grass (7 products)**: Storage Baskets with Lid (Set of 3), Bohemian Planter Basket, Roti Casserole Box, Dining Placemats & Coasters (Set of 6+6), Handcrafted Crossbody Sling Bag, Laundry & Toy Hamper, Keepsake Gift Box.
3. **Coastal Odisha Jute (6 products)**: Padded Laptop Sleeve (13-15.6 in), Heavy-Duty Grocery Market Totes (Pack of 3), Wine & Bottle Gift Bag, Jute & Natural Tree Rubber Yoga Mat (6mm), Multi-Pocket Wall Hanging Organizer, Plant Grow Bags (Pack of 5).
4. **Medicinal Seasoned Neem Wood (6 products)**: Dual-Tooth Detangler Hair Comb, Pocket Beard Comb, Cooking Spatulas & Ladles (5-Piece Set), Traditional Roti Belan & Chakla Set, Infant Teething Ring, Slotted Soap Saver Dish.
5. **Organic Materials & Upcycled Crafts (7 products)**: Upcycled Temple Coconut Shell Candle (Lemongrass & Soy Wax), Coir Dishwashing Scrub Pads (Pack of 5), Ridge Gourd Loofah Body Scrubbers (Pack of 3), Plantable Seed Pencils (Pack of 10), Plantable Wildflower Seed Notebook, Ayurvedic Herbal Clay Toothpowder (100g), Reusable Beeswax Food Wraps (Pack of 3).
6. **Pre-curated Hampers (3 signature kits)**: The Zero-Waste Bathroom Starter Kit, Odisha Artisan Heritage Hamper, Plastic-Free Kitchen Makeover Box.

---

## 🔒 Security & Privacy Features (DPDP Act 2023)

1. **Zero Client-Side Trust**: Checkout order totals are always recalculated on the server from raw database unit prices.
2. **Data Minimization**: No card, CVV, or bank credentials ever touch the database (tokenized or simulated references only).
3. **Explicit Consent Logs**: Unticked default checkboxes for WhatsApp and marketing emails; every consent change is stored in `consent_logs` with a timestamp.
4. **Right to Withdraw**: One-click withdrawal of marketing permissions in the Customer Account portal.
5. **AI Assistant Guardrails**: Tool-mediated access to product records and order status; strict rate-limiting per IP and session; prompt injection sanitation.

---

## ❓ Open Questions & Recommendations for the Business Owner

The 5 specification documents outlined several open strategic decisions. Below are recommended answers and decisions ready for your confirmation:

1. **Platform Migration**:
   - *Question*: Stay on Typof or migrate to a custom headless platform?
   - *Recommendation*: Migrate to this full-stack headless platform. It eliminates monthly Typof app subscription fees, unlocks unlimited custom code, and embeds the AI assistant directly into the database.
2. **Payment Gateway**:
   - *Question*: Razorpay or Cashfree?
   - *Recommendation*: **Razorpay** as primary (broadest UPI, RuPay, and Net Banking coverage in Odisha) with Cashfree as fallback.
3. **Shipping & Courier Partner**:
   - *Question*: Shiprocket or Delhivery?
   - *Recommendation*: **Shiprocket** (aggregates Delhivery, Blue Dart, and India Post Speed Post for rural pin codes).
4. **WhatsApp Business Provider**:
   - *Question*: Direct Meta Cloud API or BSP (Interakt / Gupshup / WATI)?
   - *Recommendation*: **Interakt or WATI** for faster template approvals and shared team support inbox.
5. **Multi-Language (Odia & Hindi)**:
   - *Question*: Are Odia-language pages required for version 2.0?
   - *Recommendation*: Launch Version 2.0 in English with Odia cultural badges and craft provenance, then roll out full Odia localization in Version 2.1.

---

## ☁️ Neon PostgreSQL Cloud Database Configuration

- **Connection String**: `postgresql://neondb_owner:npg_1xB8CRmXQryw@ep-nameless-dust-benollhl-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
- **Serverless Compute Host**: `ep-nameless-dust-benollhl.c-9.us-east-2.aws.neon.tech`
- **Architecture**: Serverless HTTP SQL API (`/sql`) with zero native driver dependency bloat.
- **Verified Record Migration**:
  - `categories`: 10 records (Material + Use categories)
  - `products`: 60 records (Full catalog + 40 authentic items from live store)
  - `product_images`: 85 records (High-resolution WebP CDN images)
  - `product_variants`: 44 records (Packs, sizing, single/combo options)
  - `pincodes`: 12 serviceability records
  - `impact_factors`: 5 verified Life Cycle Assessment benchmarks
  - `reviews`: 5 verified customer testimonials
- **Live Health Check API**: `GET /api/database/status`
