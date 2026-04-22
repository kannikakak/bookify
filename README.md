# Bookify System

Bookify is a small inventory system for managing books in stock. This starter project includes:

- `frontend`: React + TypeScript app
- `backend`: Node + Express + TypeScript API
- `database/bookify.sql`: MySQL schema for XAMPP / phpMyAdmin

## Features

- Add books with images, title, category, buy price, sell price, page number, and stock
- Create sale orders using the saved sell price and optional discount
- Automatically reduce stock when a sale order is saved
- Track inventory status: in stock, low stock, out of stock
- Edit product records from the dashboard
- View stock value, projected revenue, and margin in the dashboard

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript
- Database: MySQL / MariaDB from XAMPP

## 1. Start XAMPP

Start these services inside XAMPP:

- Apache
- MySQL

## 2. Create the database

You have two options.

### Option A: use migrations

Create MySQL in XAMPP, then run:

```powershell
cd "d:\Bookify System\backend"
npm.cmd run migrate
```

This will:

- create database `bookify_db` if it does not exist
- create the `migrations` table
- create or upgrade the `books` table

### Option B: import SQL manually

Open phpMyAdmin and import [database/bookify.sql](/d:/Bookify%20System/database/bookify.sql).

That manual SQL file will create:

- database: `bookify_db`
- table: `books`

## 3. Backend environment

Copy [backend/.env.example](/d:/Bookify%20System/backend/.env.example) to `backend/.env`.

Default XAMPP values are already prepared:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=bookify_db
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=bookifystore@gmail.com
ADMIN_PASSWORD=bookify123
AUTH_SESSION_SECRET=change-this-bookify-session-secret
```

## 4. Install dependencies

Run in two terminals:

```powershell
cd "d:\Bookify System\backend"
npm install
```

```powershell
cd "d:\Bookify System\frontend"
npm install
```

## 5. Run the apps

Backend:

```powershell
cd "d:\Bookify System\backend"
npm run dev
```

Frontend:

```powershell
cd "d:\Bookify System\frontend"
npm run dev
```

If PowerShell blocks `npm`, use `npm.cmd` instead:

```powershell
cd "d:\Bookify System\backend"
npm.cmd run dev
```

```powershell
cd "d:\Bookify System\frontend"
npm.cmd run dev
```

## API Endpoints

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/books`
- `POST /api/books`
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/expenses`
- `POST /api/expenses`
- `GET /api/reports/summary`

## Product images

You can now upload product images from the product form.

- uploaded files are stored in `backend/uploads`
- uploaded files are served from `/uploads/...`
- you can still add external image URLs if needed

## Book payload example

```json
{
  "title": "Atomic Habits",
  "category": "Self Help",
  "buyPrice": 240,
  "sellPrice": 399,
  "pageCount": 320,
  "stock": 12,
  "lowStockThreshold": 5,
  "imageUrls": [
    "https://example.com/atomic-habits-front.jpg",
    "https://example.com/atomic-habits-back.jpg"
  ]
}
```

## Sale order payload example

```json
{
  "bookId": 1,
  "customerName": "Walk-in customer",
  "quantity": 2,
  "discount": 10
}
```

## Cloud deployment (Render + Vercel + Aiven MySQL)

This project is now prepared for:

- Backend API on Render
- Frontend on Render Static or Vercel
- MySQL on Aiven

### 1) Aiven MySQL

Create MySQL service in Aiven and collect:

- host, port, database
- username, password
- CA certificate (for SSL)

### 2) Deploy backend to Render

You can use [render.yaml](/d:/Bookify%20System/render.yaml) blueprint or create service manually.

Backend env (required):

```env
DB_HOST=...
DB_PORT=...
DB_USER=...
DB_PASSWORD=...
DB_NAME=...
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
DB_SSL_CA=-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----
FRONTEND_URL=https://your-render-frontend.onrender.com,https://your-vercel-app.vercel.app
ADMIN_EMAIL=bookifystore@gmail.com
ADMIN_PASSWORD=change-this-strong-password
AUTH_SESSION_SECRET=change-this-long-random-secret
AUTH_COOKIE_SAME_SITE=none
AUTH_COOKIE_SECURE=true
```

After first deploy, run migration once:

```bash
cd backend
npm run migrate
```

### 3) Deploy frontend

#### Option A: Render Static

Set:

```env
VITE_API_URL=https://your-backend.onrender.com/api
```

Build command:

```bash
npm ci && npm run build
```

Publish directory:

```text
dist
```

#### Option B: Vercel

Use `frontend` as project root.

- Build command: `npm run build`
- Output directory: `dist`
- Env: `VITE_API_URL=https://your-backend.onrender.com/api`

SPA rewrites are included in [frontend/vercel.json](/d:/Bookify%20System/frontend/vercel.json).

### 4) Cross-site auth cookies

For Vercel + Render (different domains), use:

- `AUTH_COOKIE_SAME_SITE=none`
- `AUTH_COOKIE_SECURE=true`

For local development:

- `AUTH_COOKIE_SAME_SITE=lax`
- `AUTH_COOKIE_SECURE=false`
