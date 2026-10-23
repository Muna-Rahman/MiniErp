# Mini ERP 95 

A small distributor's ERP with a retro Windows 95 interface. It manages products, suppliers, purchases, sales and expenses, and turns them into a live dashboard.

**Live demo:** https://mini-erp-web-two.vercel.app
**API:** https://mini-erp-api-chi.vercel.app (`/api/health`)

**Demo login:** `admin@minierp.dev` / `admin12345`

**Core workflow:** Purchase adds stock → Sale reduces stock → Dashboard updates.

## Who it's for
Small wholesale and distribution business owners and staff who need to track stock, buying, selling and costs without a heavy ERP.

## Features
- **Auth:** sign up / sign in with email + password (Better Auth); every API route except health requires a session
- **Products, suppliers, expenses:** create, edit, delete, search
- **Purchases:** receive stock from a supplier. Stock increases and cost price updates
- **Sales:** checkout is blocked when stock is insufficient (validated on client and server; atomic stock deduction with rollback)
- **Dashboard** computed from stored records: revenue, purchases, expenses, profit, stock value, receivable / payable, 7-day sales chart, low-stock alerts, recent sales
- Loading, empty and error states; responsive layout

## Tech stack
| Layer | Tools |
|---|---|
| Frontend | Next.js 15 (App Router, JavaScript), React 19 |
| Backend | Node.js, Express 5 |
| Database | MongoDB + Mongoose |
| Auth | Better Auth (email + password, MongoDB adapter) |
| Hosting | Vercel (two projects: `client` and `server`) |

## Project structure
```
mini-erp/
├── client/                 Next.js app
│   ├── app/                pages: login, dashboard, products, suppliers, purchases, sales, expenses
│   ├── components/         retro UI kit, ResourcePage, TransactionPage
│   ├── lib/                api helper, Better Auth client, formatters
│   └── next.config.mjs     proxies /api/* to the Express server
└── server/                 Express API
    ├── src/index.js        app entry (exported for Vercel, listens locally)
    ├── src/lib/auth.js     Better Auth + MongoDB setup
    ├── src/middleware/     requireAuth
    ├── src/models/         Product, Supplier, Purchase, Sale, Expense
    ├── src/routes/         one router per resource + dashboard
    ├── src/seed.js         demo user and demo data
    └── vercel.json         Vercel build config
```

## How it fits together
The browser only talks to the Next.js app. `next.config.mjs` rewrites `/api/*` to the Express server (`API_URL`), so auth cookies stay same-origin and no CORS or cross-site cookie setup is needed in the browser.

## Local setup
Requires Node.js 18+ and a MongoDB instance (local or Atlas).

```bash
# 1. API
cd server
cp .env.example .env        # fill MONGODB_URI and BETTER_AUTH_SECRET
npm install
npm run seed                # creates the demo user + realistic demo data
npm run dev                 # http://localhost:5000

# 2. Web app (new terminal)
cd client
cp .env.example .env.local
npm install
npm run dev                 # http://localhost:3000
```

### Environment variables

**server/.env**
| Variable | Description | Example |
|---|---|---|
| `PORT` | Local API port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/mini_erp` |
| `BETTER_AUTH_SECRET` | Long random string (e.g. `openssl rand -base64 32`) | |
| `BETTER_AUTH_URL` | Public URL of the **web app** | `http://localhost:3000` |
| `CLIENT_URL` | Same as above; used for trusted origins / CORS | `http://localhost:3000` |

**client/.env.local**
| Variable | Description | Example |
|---|---|---|
| `API_URL` | Where the Express API lives (used by the rewrite proxy) | `http://localhost:5000` |

> URLs must include the protocol (`https://...`) and have no trailing slash.

## Deploying to Vercel
Create **two** Vercel projects from the same GitHub repo:

| Project | Root Directory | Environment variables |
|---|---|---|
| API | `server` | `MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `CLIENT_URL` |
| Web | `client` | `API_URL` |

- Set `BETTER_AUTH_URL` and `CLIENT_URL` to the **web** project's URL, e.g. `https://mini-erp-web-two.vercel.app`.
- Set `API_URL` to the **API** project's URL, e.g. `https://mini-erp-api-chi.vercel.app`.
- Deploy by pushing to `main`. `API_URL` is baked in at build time, so redeploy the web project after changing it.
- Seed the production database once: put the production `MONGODB_URI` in `server/.env` and run `npm run seed`.

### Troubleshooting
| Symptom | Cause / fix |
|---|---|
| `ERR_TOO_MANY_REDIRECTS` on `/api/auth/...` | `API_URL` points at the web app itself or uses `http://`. Set it to the API's `https://` URL and rebuild |
| 500 on `/api/auth/*`, log says `Invalid base URL` | `BETTER_AUTH_URL` is missing `https://` |
| Build fails with `Root Directory "server" does not exist` | Deploy through GitHub, or run the CLI from the repo root, not from inside `server/` |
| "Invalid email or password" with the demo login | Production database not seeded; run `npm run seed` |

## Demo script (2–3 min)
1. Dashboard: note stock value and revenue.
2. Purchases: receive 40 × Soybean Oil 5L → stock increases.
3. Sales: sell 10 × Soybean Oil 5L → try selling more than stock to see validation.
4. Dashboard: revenue, profit, stock value and chart have changed.

## Known limitations
- Stripe payments are not wired yet
- Single business, no role-based permissions
- No PDF invoices yet
