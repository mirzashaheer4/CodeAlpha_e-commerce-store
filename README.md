# Aether Premium E-Store

A complete, production-ready, full-stack e-commerce web application built from scratch. It features a modern, high-end dark Single Page Application (SPA) frontend with glassmorphism aesthetics and an Express/Node.js REST API backend connected to a MongoDB database.

---

## Features

- **User Authentication**: Secure registration and login using JWT tokens stored inside secure, HTTP-only cookies. Passwords are encrypted using `bcryptjs`.
- **Product Catalog**: A fluid, responsive grid display of items populated from MongoDB. Features query support for categories and instant search.
- **Product Details**: Dynamic details page displaying high-res product images, complete specifications, active stock tracking status, and quantity selections.
- **Responsive Shopping Cart**: 
  - **Guests**: Stored locally in `localStorage`.
  - **Members**: Automatically synced and persisted in MongoDB.
  - **Merge Logic**: On login, guest cart items are sequentially merged into the user's database cart (combining quantities with stock checks).
  - Includes a DELETE route to remove specific items completely.
- **Order Processing**: Checkout flow capturing shipping addresses, checking and decrementing inventory levels, clearing the user's cart, and providing full invoice receipt confirmations.
- **Admin Management Route**: Restricted product creation, updates, and deletions protected by `adminOnly` middleware.
- **Backend Protections**: Input validations returning HTTP 422, global error handlers returning structured JSON error schemas, and security headers applied using `helmet`.

---

## Directory Structure

```text
E-commerce-Store/
├── client/                      # Frontend SPA
│   ├── css/
│   │   └── styles.css           # Modern, responsive stylesheet
│   ├── js/
│   │   ├── api.js               # API Fetch wrapper with credentials
│   │   ├── app.js               # SPA Hash router and view controllers
│   │   ├── cart.js              # Cart manager (localStorage + API sync)
│   │   └── ui.js                # Toast notification system module
│   └── index.html               # SPA Entry HTML shell
│
├── server/                      # Backend REST API
│   ├── config/
│   │   └── db.js                # Mongoose MongoDB connection
│   ├── middleware/
│   │   ├── auth.js              # JWT protector and adminOnly middleware
│   │   ├── error.js             # Structured JSON error middleware
│   │   └── validation.js        # Request body validators (HTTP 422)
│   ├── models/
│   │   ├── Cart.js              # Mongoose Cart Schema
│   │   ├── Order.js             # Mongoose Order Schema (with pricing snapshot)
│   │   ├── Product.js           # Mongoose Product Schema
│   │   └── User.js              # Mongoose User Schema (with bcrypt hashing)
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints (/api/auth)
│   │   ├── cart.js              # Cart endpoints (/api/cart)
│   │   ├── order.js             # Order endpoints (/api/orders)
│   │   └── product.js           # Product endpoints (/api/products)
│   ├── .env                     # Local configuration parameters (ignored)
│   ├── .env.example             # Environment variable template
│   ├── package.json             # Backend server dependency mappings
│   ├── seed.js                  # Database seeder script
│   └── server.js                # Express Server startup script
│
├── .gitignore                   # Global file ignores
└── README.md                    # Instructions manual (This file)
```

---

## Tech Stack

- **Frontend**: Vanilla HTML5, CSS3 Custom Properties (Dark Theme / Glassmorphism), Vanilla JavaScript ES Modules.
- **Backend**: Node.js, Express.js web framework.
- **Database**: MongoDB with Mongoose ODM.
- **Security**: Password hashing (`bcryptjs`), Session tokens (`jsonwebtoken`), Cookie parsers (`cookie-parser`), HTTP Header hardening (`helmet`), and CORS origins configurations.

---

## Installation & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.
- [MongoDB](https://www.mongodb.com/try/download/community) server running locally, or a remote MongoDB Atlas connection string.

### 2. Configure Environment Variables
Inside the `/server` directory, create a `.env` file based on `.env.example`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ecommerce
JWT_SECRET=supersecretjwtkey12345!
NODE_ENV=development
CLIENT_URL=http://localhost:5000
```
*(Make sure MongoDB is running on your system at `mongodb://127.0.0.1:27017/`)*

### 3. Install Dependencies
Install all backend and project dependencies at once by running the standard install command in the root directory:
```bash
npm install
```
*(This automatically installs dependencies inside the `/server` workspace using NPM Workspaces)*

### 4. Seed the Database
Populate the database with 10 high-quality products and test accounts (standard and administrator) by running the seeder from the root:
```bash
npm run seed
```

### 5. Start the Application (Frontend & Server)
To run the server and serve the frontend client together, execute:
```bash
npm run dev
```
The Express server will launch and host the static SPA client at the same port, displaying:
```text
Server running in development mode on port 5000
MongoDB Connected: 127.0.0.1
```
Open your browser and navigate to **`http://localhost:5000`** to experience the Aether Store.

---

## Seeded Test Accounts

The seeder automatically inserts two accounts for evaluation:

1. **Standard Member Account**:
   - **Email**: `user@ecommerce.com`
   - **Password**: `userpassword123`
   - Use this to test normal shopping flows, persistent database cart synchronization, and viewing order history.

2. **Administrator Account**:
   - **Email**: `admin@ecommerce.com`
   - **Password**: `adminpassword123`
   - Use this to evaluate admin-protected routes, product inventory creation, updating, or deleting operations.

---

## REST API Documentation

### Authentication Routes (`/api/auth`)
- `POST /register` - Register a new account. Body: `{ name, email, password }`
- `POST /login` - Login to account. Body: `{ email, password }`
- `POST /logout` - Logout (clears session cookie).
- `GET /me` - Get logged-in user profile info (Protected).

### Product Routes (`/api/products`)
- `GET /` - Retrieve all products (Public). Supports optional query filters: `?category=Electronics&search=Keyboard`
- `GET /:id` - Retrieve product details (Public).
- `POST /` - Create a product (Protected, Admin-only). Body: `{ name, description, price, stock, imageUrl, category }`
- `PUT /:id` - Update a product (Protected, Admin-only). Body: `{ name, description, price, stock, imageUrl, category }`
- `DELETE /:id` - Delete a product (Protected, Admin-only).

### Cart Routes (`/api/cart`)
- `GET /` - Retrieve current user's cart items (Protected).
- `POST /` - Add / Merge cart item (Protected, Stock-validated). Body: `{ productId, quantity }`
- `PUT /` - Set item quantity (Protected, Stock-validated). Body: `{ productId, quantity }`
- `DELETE /:productId` - Remove item from cart entirely (Protected).

### Order Routes (`/api/orders`)
- `POST /` - Process cart checkout and create Order (Protected). Body: `{ shippingAddress: { street, city, zip, country } }`
- `GET /` - Retrieve logged-in user's order history sorted descending (Protected).
- `GET /:id` - Fetch order details by ID (Protected, Owner or Admin only).
