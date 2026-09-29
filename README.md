# School Stationery Manager

A learning application for running a school stationery store. Next.js handles the pages and the server-side logic. PostgreSQL is the only source of truth.

Stage 1 does not include a separate Express API. Business rules live in `src/lib/services` so they can move to another backend later without changing the database design.

## Technologies

- Next.js 16 (App Router) and TypeScript
- Tailwind CSS
- PostgreSQL and Prisma ORM 7
- Auth.js (Credentials provider, JWT session cookie)
- Zod and React Hook Form
- Recharts

## Requirements

- Node.js 20 or newer
- npm
- PostgreSQL 16

Docker is optional. This repository includes `docker-compose.yml` for PostgreSQL. If Docker is not installed, `npm run db:up` starts an embedded PostgreSQL on port 5432 and keeps it running until you stop that process.

## Installation

```bash
npm install
cp .env.example .env
```

Generate `AUTH_SECRET` and put it in `.env`:

```bash
openssl rand -base64 32
```

`.env` is gitignored. Commit only `.env.example`.

```env
DATABASE_URL="postgresql://stationery:stationery@localhost:5432/stationery"
AUTH_SECRET="replace-me"
AUTH_URL="http://localhost:3000"
```

## PostgreSQL

With Docker:

```bash
docker compose up -d
```

Without Docker:

```bash
npm run db:up
```

Leave that terminal open. The data directory is `.pgdata` and is gitignored.

## Prisma

```bash
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

`npm install` also runs `prisma generate`.

## Development server

```bash
npm run dev
```

Open http://localhost:3000. Signed-out visitors are sent to `/login`.

## Test credentials

These accounts are created by the seed and are for local development only. Do not deploy them to a public server. Change or remove them before any real deployment.

| Email | Password | Role |
| --- | --- | --- |
| admin@example.com | DevPassword123! | Admin |
| manager@example.com | DevPassword123! | Manager |

## Project structure

```text
src/app            pages, proxy, and route handlers
src/components     reusable UI
src/lib/auth       Auth.js session and permission checks
src/lib/db         Prisma client
src/lib/services   business logic (orders, stock, CSV)
src/lib/validations
src/actions        server actions
prisma             schema, migrations, seed
```

The browser never receives `DATABASE_URL`, `AUTH_SECRET`, or password hashes.

## Authentication

Staff sign in with email and password. Passwords are bcrypt hashes in PostgreSQL. Auth.js stores a signed JWT cookie. On each session read, the server loads the user's current role and status from the database, so a role change or deactivation applies on the next request. Inactive users cannot sign in.

`src/proxy.ts` sends anonymous visitors to `/login`. Every server action checks the signed-in user again before it changes data.

## Role permissions

Admin and manager can view the dashboard, products, stock, orders, customers, and reports, and they can export CSV.

Only an admin can create or edit products and categories, cancel orders, manage users, and import products. A manager who opens `/users` sees an access denied message. Hiding a button is not the permission check.

The last active admin cannot be deactivated or changed to manager.

## Database

Models: User, Category, Product, Customer, Order, OrderItem, StockTransaction.

Creating an order runs in one PostgreSQL transaction: validate the customer and products, lock the product rows, create the order and items, reduce stock, and write `OUT` stock transactions. If any step fails, the transaction rolls back. An order cannot reduce stock below zero.

Cancelling an order restores stock and writes `IN` transactions in the same kind of transaction.

Stock status is calculated: quantity `0` is Out of Stock, quantity at or below the minimum is Low Stock, otherwise In Stock. Product status (`ACTIVE` or `INACTIVE`) is separate and controls whether the product can be sold.

Orders are shown as `ORD-1001` and similar numbers. Database UUIDs stay out of the main tables.

## CSV import and export

Export downloads products, orders, customers, stock, or stock transactions from PostgreSQL.

Product import reads a CSV, checks the columns and values, shows a preview, and writes to PostgreSQL only after you confirm. A file with invalid rows is rejected. An existing SKU is updated. A repeated SKU inside the same file is an error. Unknown categories are errors.

Example:

```csv
sku,name,description,price,stockQuantity,minimumStock,category
PEN001,Blue Pen,Standard blue pen,10,100,20,Pens
```

Do not put live application data in `public/*.csv`.

## Printing

Order details, the sales report, and the stock report use the browser print dialog. The sidebar and filters are hidden while printing.

## Production deployment

A small deployment is a Next.js host (for example Vercel) plus a hosted PostgreSQL database (for example Neon or Supabase on a free tier). Free tiers have limits on database size, connections, and function time.

1. Create a PostgreSQL database and copy its connection string into `DATABASE_URL`.
2. Set `AUTH_SECRET` to a new random value and `AUTH_URL` to the public site URL.
3. Run `npx prisma migrate deploy` against that database.
4. Do not run the development seed on a public database. Create a real admin user with a private password instead.
5. Build with `npm run build` and start with `npm start`, or connect the repository to the host's Next.js integration.

`next build` needs the environment variables available at build and runtime because pages read the database on the server.
