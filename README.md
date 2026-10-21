# Mini ERP 95 — Wholesale / Distribution

A small distributor's ERP with a retro Windows 95 interface. It manages products, suppliers, purchases, sales and expenses.

**Core workflow:** Purchase adds stock → Sale reduces stock → Dashboard updates.

## Users
Small wholesale / distribution business owners and staff who need to track stock, buying, selling and costs.

## Features
- Login / sign up (Better Auth, email + password)
- Products, suppliers, expenses: create, edit, delete, search
- Purchases: receive stock from a supplier (stock increases, cost price updates)
- Sales: checkout blocked if stock is not enough (validated on client and server, atomic stock deduction with rollback)
- Dashboard calculated from stored records: revenue, purchases, expenses, profit, stock value, receivable / payable, 7-day sales chart, low-stock alerts, recent sales
- Loading, empty and error states, responsive layout

## Tech stack
Next.js (App Router, JavaScript) · React · Node.js + Express 5 · MongoDB + Mongoose · Better Auth · Stripe (planned)

## Setup
```bash
# 1. API
cd server
cp .env.example .env        # fill MONGODB_URI and BETTER_AUTH_SECRET
npm install
npm run seed                # creates demo user + realistic demo data
npm run dev                 # http://localhost:5000

# 2. Web app (new terminal)
cd client
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

## Demo credentials
`admin@minierp.dev` / `admin12345` (created by `npm run seed`)

## Demo script (2–3 min)
1. Dashboard: note stock value and revenue.
2. Purchases: receive 40 × Soybean Oil 5L → stock increases.
3. Sales: sell 10 × Soybean Oil 5L → try selling more than stock to see validation.
4. Dashboard: revenue, profit, stock value and chart have changed.

## Known limitations
- Stripe payments not wired yet
- Single business, no role-based permissions
- No PDF invoices yet
