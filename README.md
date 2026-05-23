<div align="center">

# ◈ AETHER E-STORE

### *Premium Cybernetic Commerce — Built for the Synthetic Age*

[![Live Demo](https://img.shields.io/badge/LIVE%20DEMO-%E2%96%B6%20Visit%20Store-81ecff?style=for-the-badge&logo=vercel&logoColor=black)](https://code-alpha-e-commerce-store-server.vercel.app)
[![Backend API](https://img.shields.io/badge/BACKEND%20API-Render-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://codealpha-e-commerce-store-guhc.onrender.com)
[![Database](https://img.shields.io/badge/DATABASE-MongoDB%20Atlas-00ED64?style=for-the-badge&logo=mongodb&logoColor=black)](https://cloud.mongodb.com)

![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%208-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Vanilla JS](https://img.shields.io/badge/Frontend-Vanilla%20JS%20SPA-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

</div>

---

## ◈ Overview

**Aether E-Store** is a production-ready, full-stack e-commerce web application engineered from the ground up. It features a blazing-fast **Single Page Application (SPA)** frontend styled with a premium dark "Void Aesthetic" design, powered by a robust **Node.js + Express REST API** backend, and persisted with **MongoDB Atlas** on the cloud.

The project is deployed across a split-architecture:
- **Frontend** → Hosted statically on **Vercel** (global CDN)
- **Backend API** → Hosted on **Render** (persistent Node.js process)
- **Database** → **MongoDB Atlas** (managed cloud cluster)

---

## ◈ Features

| Category | Feature |
|---|---|
| 🔐 **Authentication** | JWT stored in secure `httpOnly` cookies, bcrypt password hashing |
| 🛍️ **Product Catalog** | Responsive grid, category & text search filtering |
| 📦 **Product Details** | High-res imagery, live stock tracking, quantity selector |
| 🛒 **Smart Cart** | Guests use `localStorage`, members sync to MongoDB; merge on login |
| 💳 **Order Checkout** | Address capture, stock decrement, cart clear, invoice confirmation |
| 📋 **Order History** | Full order history with status tracking per user |
| 🛡️ **Admin Panel** | Protected product CRUD — create, update, and delete products |
| 🔒 **Security** | `helmet` CSP headers, CORS origin restriction, input validation (HTTP 422) |
| 🌱 **Database Seeding** | One-command seed script — 10 products + test accounts |

---

## ◈ Tech Stack

```
Frontend                    Backend                     Infrastructure
──────────────────────      ──────────────────────      ──────────────────────
HTML5 (Semantic)            Node.js v20+                Vercel (Static CDN)
Vanilla CSS3                Express.js 4.x              Render (Web Service)
Vanilla JS (ES Modules)     Mongoose 8.x ODM            MongoDB Atlas
Hash-based SPA Router       bcryptjs                    Git + GitHub CI/CD
FontAwesome 6 Icons         jsonwebtoken
Google Fonts (Inter,        cookie-parser
  Space Grotesk)            helmet (CSP Headers)
                            cors
```

---

## ◈ Directory Structure

```
E-commerce-Store/
│
├── client/                          # Frontend SPA (served statically via Vercel)
│   ├── css/
│   │   └── styles.css               # Design system — Void dark theme, 0px radius
│   ├── js/
│   │   ├── api.js                   # Fetch wrapper with httpOnly cookie credentials
│   │   ├── app.js                   # SPA hash router — all views & controllers
│   │   ├── cart.js                  # Cart manager (localStorage ↔ MongoDB sync)
│   │   └── ui.js                    # Toast notification system
│   └── index.html                   # Shell HTML — custom cursor, navbar, footer
│
├── server/                          # Backend REST API (hosted on Render)
│   ├── config/
│   │   └── db.js                    # Mongoose connection + error handling
│   ├── middleware/
│   │   ├── auth.js                  # protect() + adminOnly() JWT middleware
│   │   ├── error.js                 # Global JSON error response formatter
│   │   └── validation.js            # Input validators (HTTP 422 responses)
│   ├── models/
│   │   ├── Cart.js                  # Cart schema (userId → [productId, qty])
│   │   ├── Order.js                 # Order schema with pricing & status snapshot
│   │   ├── Product.js               # Product schema with stock tracking
│   │   └── User.js                  # User schema with bcrypt pre-save hook
│   ├── routes/
│   │   ├── auth.js                  # /api/auth — register, login, logout, me
│   │   ├── cart.js                  # /api/cart — CRUD with stock validation
│   │   ├── order.js                 # /api/orders — checkout + history
│   │   └── product.js               # /api/products — public + admin routes
│   ├── .env.example                 # Environment variable template
│   ├── package.json                 # Server dependencies
│   ├── seed.js                      # Database seeder script
│   └── server.js                    # Express app entry point
│
├── .gitignore                       # Ignores node_modules/, .env, dist/
├── package.json                     # Root workspace orchestrator
└── README.md                        # This file
```

---

## ◈ Quick Start — Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or local MongoDB)

### 1. Clone the Repository
```bash
git clone https://github.com/mirzashaheer4/CodeAlpha_e-commerce-store.git
cd CodeAlpha_e-commerce-store
```

### 2. Configure Environment Variables
Create a `.env` file inside the `/server` directory, using the provided template:
```bash
cp server/.env.example server/.env
```

Then open `server/.env` and fill in your values:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=development
CLIENT_URL=http://localhost:5000
```

### 3. Install All Dependencies
Run a single install from the **root** directory. NPM Workspaces handles the server packages automatically:
```bash
npm install
```

### 4. Seed the Database
Populate MongoDB with 10 high-quality products and two pre-built test accounts:
```bash
npm run seed
```

Expected output:
```
Connecting to database...
Collections cleared.
Successfully seeded 10 products.
Created Admin User: admin@ecommerce.com / adminpassword123
Created Standard User: user@ecommerce.com / userpassword123
Database seeding completed successfully!
```

### 5. Start the Development Server
```bash
npm run dev
```

The server will start at **`http://localhost:5000`** and serve the SPA frontend directly.

---

## ◈ Test Accounts

> After running `npm run seed`, the following accounts are ready for immediate use:

| Role | Email | Password | Access |
|---|---|---|---|
| 👤 **Standard User** | `user@ecommerce.com` | `userpassword123` | Shopping, cart sync, order history |
| 🛡️ **Administrator** | `admin@ecommerce.com` | `adminpassword123` | All above + product CRUD management |

---

## ◈ REST API Reference

### Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new account |
| `POST` | `/api/auth/login` | Public | Login and receive JWT cookie |
| `POST` | `/api/auth/logout` | Public | Clear session cookie |
| `GET` | `/api/auth/me` | 🔐 Protected | Get current logged-in user profile |

**Register / Login Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "yourpassword"
}
```

---

### Products — `/api/products`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/products` | Public | Get all products. Supports `?category=` and `?search=` |
| `GET` | `/api/products/:id` | Public | Get single product by ID |
| `POST` | `/api/products` | 🛡️ Admin | Create a new product |
| `PUT` | `/api/products/:id` | 🛡️ Admin | Update a product |
| `DELETE` | `/api/products/:id` | 🛡️ Admin | Delete a product |

**Product Body (Admin):**
```json
{
  "name": "Mechanical Keyboard Pro",
  "description": "Full description of product",
  "price": 149.99,
  "stock": 50,
  "imageUrl": "https://images.unsplash.com/...",
  "category": "Electronics"
}
```

---

### Cart — `/api/cart`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/cart` | 🔐 Protected | Get current user's cart |
| `POST` | `/api/cart` | 🔐 Protected | Add item or merge quantity |
| `PUT` | `/api/cart` | 🔐 Protected | Set exact item quantity |
| `DELETE` | `/api/cart/:productId` | 🔐 Protected | Remove item from cart |

---

### Orders — `/api/orders`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/orders` | 🔐 Protected | Checkout — creates order, decrements stock, clears cart |
| `GET` | `/api/orders` | 🔐 Protected | Get full order history for the logged-in user |
| `GET` | `/api/orders/:id` | 🔐 Protected | Get specific order details (owner or admin) |

**Checkout Body:**
```json
{
  "shippingAddress": {
    "street": "123 Cyber Lane",
    "city": "Neo Tokyo",
    "zip": "90210",
    "country": "US"
  }
}
```

**Error Response Schema (all endpoints):**
```json
{
  "error": {
    "message": "Human-readable error description",
    "code": "ERROR_CODE"
  }
}
```

---

## ◈ Deployment

This project uses a **split-hosting architecture** for production:

```
User's Browser
      │
      ├──── Static Assets (HTML/CSS/JS) ────► Vercel CDN
      │
      └──── API Requests (/api/*) ─────────► Render Web Service
                                                    │
                                                    └── MongoDB Atlas Cluster
```

### Deploy Backend → Render

1. Create a **Web Service** on [render.com](https://render.com) from your GitHub repo.
2. Set the following configuration:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add these **Environment Variables**:

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `MONGO_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | A strong random secret phrase |
| `CLIENT_URL` | Your Vercel frontend URL (no trailing slash) |

### Deploy Frontend → Vercel

1. Import your GitHub repo at [vercel.com](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Set **Framework Preset** to `Other`.
4. Leave **Build Command** and **Install Command** empty.
5. Click **Deploy**.

> ⚠️ **Important**: After getting your Render URL, update `BACKEND_URL` in `client/js/api.js` and push the change. Vercel will redeploy automatically.

---

## ◈ Environment Variables Reference

```env
# server/.env

PORT=5000                          # Port the Express server listens on
MONGO_URI=mongodb+srv://...        # MongoDB Atlas connection string
JWT_SECRET=your_secret_here        # Secret key for signing JWT tokens
NODE_ENV=development               # 'development' or 'production'
CLIENT_URL=http://localhost:5000   # Frontend origin (for CORS & cookie policy)
```

---

## ◈ Security Architecture

| Layer | Implementation |
|---|---|
| **Password Storage** | `bcryptjs` with 12 salt rounds — no plaintext ever stored |
| **Session Tokens** | JWT signed with `jsonwebtoken`, stored in `httpOnly` + `Secure` cookies |
| **Cross-Origin** | `cors` restricts API to the whitelisted `CLIENT_URL` origin only |
| **HTTP Headers** | `helmet` enforces Content Security Policy, XSS protection, HSTS |
| **Cookie Policy** | `SameSite=Lax` in development; `SameSite=None; Secure` in production |
| **Input Validation** | All body inputs validated — returns structured HTTP `422` on failure |
| **Admin Routes** | `adminOnly` middleware gate — non-admin requests receive HTTP `403` |

---

## ◈ Design System

The frontend follows the **"Cyanide Flux" Void Aesthetic**:

- **Background**: `#0e0e0e` (absolute void)
- **Surface**: `#161616` / `#1c1c1c` (tonal shifts — no borders)
- **Accent**: `#81ecff` (synthetic cyan)
- **Border Radius**: `0px` (strictly sharp edges — no rounding)
- **Typography**: `Space Grotesk` (headings) + `Inter` (body)
- **Cursor**: Custom reactive "Data-Scrub" animated cursor
- **Animations**: Smooth fade-in, hover glow pulses, toast slide-ins

---

<div align="center">

Made with ☕ and a lot of `console.log()` debugging.

**[◈ Visit Live Store](https://code-alpha-e-commerce-store-server.vercel.app)** &nbsp;|&nbsp; **[◈ API Base URL](https://codealpha-e-commerce-store-guhc.onrender.com/api/products)**

</div>
