# DhobiGhat

A dual-sided laundry marketplace platform connecting customers with local washermen (dhobis). Customers can discover washermen, place laundry orders, and track them in real time. Washermen manage their schedule, pricing, and earnings through a dedicated interface.

---

## Architecture Overview

| Layer | Technology |
|---|---|
| **Backend API** | Node.js + Express.js (TypeScript) |
| **Database** | Neon Serverless PostgreSQL via Knex.js |
| **Auth** | Phone OTP (Twilio Verify) + JWT access/refresh tokens |
| **Push Notifications** | Firebase Cloud Messaging (FCM) |
| **PDF Generation** | PDFKit (server-side) |
| **Validation** | Zod v4 (request payload schemas) |
| **Logging** | Winston (structured JSON in production) |
| **Mobile Apps** | React Native + Expo (Customer App & Washerman App) |

---

## Project Structure

```
DhobiGhat/
├── backend/                     # Express.js REST API
│   ├── src/
│   │   ├── config/              # DB connection, env validation, Knex config
│   │   ├── db/
│   │   │   └── migrations/      # 12 Knex migration files
│   │   ├── middleware/          # Auth, error handler, role guards
│   │   ├── modules/
│   │   │   ├── auth/            # OTP request/verify, JWT, refresh tokens
│   │   │   ├── washermen/       # Washerman registration & profile
│   │   │   ├── customers/       # Customer registration, favourites
│   │   │   ├── pricing/         # Wash types, price items, price grid
│   │   │   ├── orders/          # Full order lifecycle & status machine
│   │   │   ├── reviews/         # Post-delivery reviews
│   │   │   ├── notifications/   # In-app notification inbox + FCM dispatch
│   │   │   └── accounting/      # Earnings summary, PDF receipts & statements
│   │   ├── utils/               # Shared helpers (paise, order numbers, etc.)
│   │   └── __tests__/           # Jest test suites (one per module)
│   ├── .env.example             # Required environment variable template
│   ├── jest.config.js
│   ├── eslint.config.js
│   └── package.json
├── .husky/
│   └── pre-commit               # Runs lint + format check + tests before every commit
└── README.md
```

---

## Prerequisites

- Node.js >= 18
- npm >= 9
- A [Neon](https://neon.tech) PostgreSQL database
- A [Twilio](https://www.twilio.com) account with Verify service (optional in dev)
- A [Firebase](https://firebase.google.com) project with a service account key (optional in dev)

---

## Backend Setup

### 1. Install dependencies

```bash
# Root (installs Husky for git hooks)
npm install

# Backend
cd backend
npm install
```

### 2. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your values:

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Secret for signing 15-minute access tokens |
| `JWT_REFRESH_SECRET` | Secret for signing 30-day refresh tokens |
| `TWILIO_ACCOUNT_SID` | Twilio account SID (leave blank to use dev mode) |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_VERIFY_SID` | Twilio Verify service SID |
| `FIREBASE_PROJECT_ID` | Firebase project ID (FCM) |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email |
| `FIREBASE_PRIVATE_KEY` | Firebase service account private key |
| `NODE_ENV` | `development` or `production` |
| `PORT` | HTTP port (default `3000`) |

> **Dev mode shortcut**: When `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` are empty, the auth service accepts OTP `123456` for any phone number. This lets you develop without a Twilio account.

### 3. Run database migrations

```bash
cd backend
npm run migrate
```

### 4. Start the development server

```bash
cd backend
npm run dev
```

The API will be available at `http://localhost:3000`.

---

## Available Scripts (backend/)

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload (ts-node-dev) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled production build |
| `npm run migrate` | Apply all pending Knex migrations |
| `npm run migrate:rollback` | Roll back the last migration batch |
| `npm test` | Run all Jest tests |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint across `src/` |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format all TypeScript files with Prettier |
| `npm run format:check` | Check formatting without modifying files |

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require an `Authorization: Bearer <token>` header.

### Auth (`/api/auth`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/otp/request` | Public | Request OTP to phone |
| POST | `/otp/verify` | Public | Verify OTP, receive tokens |
| POST | `/refresh` | Public | Rotate refresh token |
| POST | `/logout` | Any | Invalidate refresh token |

### Washermen (`/api/washermen`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/register` | Public* | Register a new washerman |
| GET | `/search` | Customer | Search washermen by area |
| GET | `/me/profile` | Washerman | Get own profile |
| PATCH | `/me/profile` | Washerman | Update profile / availability |
| DELETE | `/me/account` | Washerman | Soft-delete account |
| GET | `/:id` | Any | Get public washerman profile |

*Registration requires a `temp_token` issued at OTP verify for unregistered phones.

### Customers (`/api/customers`)

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/register` | Public* | Register a new customer |
| GET | `/me/profile` | Customer | Get own profile |
| PATCH | `/me/profile` | Customer | Update name / address |
| DELETE | `/me/account` | Customer | Soft-delete account |
| POST | `/me/washerman` | Customer | Select preferred washerman |
| GET | `/me/favourites` | Customer | List favourite washermen |
| POST | `/me/favourites/:washermanId` | Customer | Add to favourites |
| DELETE | `/me/favourites/:washermanId` | Customer | Remove from favourites |

### Pricing (`/api/pricing`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/grid/:washermanId` | Any | Get public pricing grid |
| GET | `/wash-types` | Washerman | List own wash types |
| POST | `/wash-types` | Washerman | Create wash type |
| DELETE | `/wash-types/:id` | Washerman | Delete wash type |
| GET | `/items` | Washerman | List own price items |
| POST | `/items` | Washerman | Create price item |
| DELETE | `/items/:id` | Washerman | Delete price item |
| PUT | `/grid` | Washerman | Bulk upsert price grid entries |
| GET | `/grid` | Washerman | Get own full pricing grid |

### Orders (`/api/orders`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Any | List orders (filtered by role) |
| POST | `/` | Customer | Place a new order |
| GET | `/:id` | Any | Get order details |
| POST | `/:id/cancel` | Customer | Cancel a pending order |
| POST | `/:id/accept` | Washerman | Accept an order |
| POST | `/:id/decline` | Washerman | Decline with reason |
| POST | `/:id/start-collecting` | Washerman | Begin door-to-door pickup |
| POST | `/:id/confirm-collection` | Both | Confirm garments collected |
| POST | `/:id/in-progress` | Washerman | Mark as in-progress |
| POST | `/:id/ready` | Washerman | Mark as ready for delivery |
| POST | `/:id/deliver` | Washerman | Mark as delivered |
| POST | `/:id/pay` | Washerman | Record payment received |

**Order status machine:**
```
PENDING → ACCEPTED → COLLECTING* → COLLECTED → IN_PROGRESS → READY → DELIVERED
       ↘ DECLINED
PENDING / ACCEPTED → CANCELLED (customer)

* COLLECTING and COLLECTED are skipped for drop_off delivery mode.
* COLLECTING → COLLECTED requires BOTH washerman and customer to confirm independently.
```

### Reviews (`/api/reviews`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/washerman/:washermanId` | Any | List reviews for a washerman |
| GET | `/order/:orderId` | Any | Get review for an order |
| POST | `/` | Customer | Submit review (delivered orders only) |

### Notifications (`/api/notifications`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/` | Any | Get notification inbox |
| GET | `/?unread=true` | Any | Filter unread notifications |
| PATCH | `/:id/read` | Any | Mark notification as read |
| PATCH | `/read-all` | Any | Mark all notifications as read |

### Accounting (`/api/accounting`)

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/summary?start_date=&end_date=` | Washerman | Earnings summary for date range |
| GET | `/receipt/:orderId` | Any | Download order receipt as PDF |
| GET | `/statement?start_date=&end_date=` | Washerman | Download earnings statement as PDF |

---

## Database Schema

All monetary values are stored as **integers in paise** (1 INR = 100 paise). All tables use UUID primary keys.

### Tables

| Table | Description |
|---|---|
| `washermen` | Washerman profiles with unique 6-char code, ratings, soft delete |
| `customers` | Customer profiles with optional washerman selection, soft delete |
| `favourites` | Customer ↔ Washerman many-to-many |
| `wash_types` | Per-washerman service types (e.g. "Dry Clean", "Steam Press") |
| `price_items` | Per-washerman clothing items (e.g. "Shirt", "Trouser") |
| `price_grid` | item × wash_type → price_paise (per washerman) |
| `orders` | Full order record with status enum, delivery mode, timestamps |
| `order_items` | Line items with price snapshot at order time |
| `reviews` | One review per delivered order; triggers avg_rating update |
| `notifications` | In-app inbox for both roles |
| `refresh_tokens` | Hashed refresh tokens with rotation and family invalidation |

---

## Pre-commit Hooks (Husky)

Every git commit automatically runs:

1. **ESLint** — zero warnings allowed (`--max-warnings 0`)
2. **Prettier** — format check (fails if any file needs formatting)
3. **Jest** — full test suite must pass

To set up hooks after cloning:

```bash
npm install          # installs Husky at root
cd backend && npm install
```

Husky hooks are initialised automatically via the `prepare` lifecycle script.

---

## Testing

Tests are co-located in `backend/src/__tests__/` and cover:

- **Unit tests**: utility functions (paise formatting, order number generation, unique code generation)
- **Schema validation**: Zod schema acceptance/rejection for all modules
- **Integration tests**: HTTP route tests using Supertest with mocked services (orders, reviews, notifications, accounting)
- **Auth service**: Dev-mode OTP acceptance in isolation

```bash
cd backend
npm test                  # run all tests
npm run test:coverage     # with coverage report
```

---

## Deployment

The backend is designed to deploy on **Render** (or any Node.js host):

1. Set all environment variables from `.env.example` in the Render dashboard
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Run migrations as a pre-deploy step or one-off job: `npm run migrate`

The collection reminder cron job (`node-cron`) runs inside the same process and checks every 30 minutes for orders stuck in the `COLLECTING` state for more than 2 hours, sending reminder notifications to both parties.
