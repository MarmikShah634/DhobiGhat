# DhobiGhat — Web Deployment Guide

This guide covers everything you need to deploy the **customer web app** (`customer-web/`) and the **washerman portal** (`washerman-web/`) to production.

---

## What You Need to Provide

### 1. A Running Backend

Both web apps talk to the same backend API. You must deploy the backend first and have its public URL ready (e.g. `https://api.yourdomain.com`).

See `backend/SETUP.md` for backend deployment steps.

### 2. Environment Variables

Each web app reads exactly **one environment variable** at build time:

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Full URL of your deployed backend — **no trailing slash** | `https://api.yourdomain.com` |

Create a `.env` file in each app folder before building:

```bash
# customer-web/.env
VITE_API_URL=https://api.yourdomain.com

# washerman-web/.env
VITE_API_URL=https://api.yourdomain.com
```

> **Important:** `VITE_API_URL` is baked into the JS bundle at build time. If it is missing, the build will throw an error. Do not commit `.env` to git.

### 3. A Static Hosting Provider

The build output (`dist/`) is a plain static site — HTML, CSS, and JS. You can host it anywhere that serves static files:

| Provider | Free tier | Notes |
|---|---|---|
| **Vercel** | Yes | Easiest — auto-detects Vite |
| **Netlify** | Yes | Works out of the box |
| **Cloudflare Pages** | Yes | Fastest global CDN |
| **AWS S3 + CloudFront** | Pay-as-you-go | Most control |
| **Firebase Hosting** | Yes | Good if already using Firebase |
| Any NGINX/Apache VPS | — | See SPA config below |

---

## Building for Production

```bash
# customer web app
cd customer-web
cp .env.example .env        # then edit VITE_API_URL
npm install
npm run build               # output → customer-web/dist/

# washerman portal
cd washerman-web
cp .env.example .env        # then edit VITE_API_URL
npm install
npm run build               # output → washerman-web/dist/
```

The `dist/` folder is everything you need to deploy. Upload its contents to your hosting provider.

---

## Deploying to Vercel (Recommended)

1. Push your repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New Project**.
3. Import the repo. Vercel will ask which folder — set **Root Directory** to `customer-web` (do the same separately for `washerman-web`).
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://api.yourdomain.com`
5. Leave **Build Command** as `npm run build` and **Output Directory** as `dist`.
6. Click **Deploy**.

Repeat for the washerman portal (separate Vercel project, different root directory).

---

## Deploying to Netlify

1. Go to [netlify.com](https://netlify.com) → **Add New Site → Import from Git**.
2. Choose your repo. Set **Base directory** to `customer-web`.
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Under **Site Settings → Environment Variables**, add `VITE_API_URL`.
6. Add a `_redirects` file inside `customer-web/public/`:
   ```
   /*  /index.html  200
   ```
   This is required for React Router's client-side routing to work.
7. Deploy.

---

## Deploying to Cloudflare Pages

1. Go to Cloudflare Dashboard → **Pages → Create a project**.
2. Connect your GitHub repo.
3. Set **Root directory** to `customer-web`.
4. Build command: `npm run build`
5. Build output: `dist`
6. Add environment variable: `VITE_API_URL`.
7. Cloudflare Pages handles SPA routing automatically.

---

## Self-Hosting with NGINX

Build the app locally, then copy `dist/` to your server.

```nginx
server {
    listen 80;
    server_name app.yourdomain.com;
    root /var/www/dhobighat-customer/dist;
    index index.html;

    # SPA fallback — required for React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

> Add an SSL certificate via Let's Encrypt (`certbot --nginx`). Never serve a production app over plain HTTP.

---

## SPA Routing — Critical Step

React Router handles navigation in the browser. When a user refreshes `/orders` or follows a direct link, the server must return `index.html` instead of a 404.

| Platform | How to fix |
|---|---|
| Vercel | Automatic — no config needed |
| Netlify | Add `public/_redirects`: `/* /index.html 200` |
| Cloudflare Pages | Automatic |
| NGINX | `try_files $uri $uri/ /index.html;` |
| Apache | Add `.htaccess` with `FallbackResource /index.html` |

---

## Backend CORS Configuration

Your backend must allow requests from your web app's domain. In `backend/.env`:

```
CORS_ORIGIN=https://app.yourdomain.com,https://washerman.yourdomain.com
```

If your backend uses the default `cors` config, update it to accept the production domains. Without this, all API calls will fail with CORS errors.

---

## Recommended Domain Setup

| App | Suggested domain |
|---|---|
| Customer web | `app.yourdomain.com` |
| Washerman portal | `washerman.yourdomain.com` |
| Backend API | `api.yourdomain.com` |

---

## Checklist Before Going Live

- [ ] Backend is deployed and accessible at `VITE_API_URL`
- [ ] `.env` files created in both web app folders with correct `VITE_API_URL`
- [ ] Both apps built successfully (`npm run build` exits with no errors)
- [ ] SPA routing fallback configured on your hosting provider
- [ ] Backend CORS allows your production domains
- [ ] Custom domains pointed at hosting provider (DNS propagation can take up to 48h)
- [ ] HTTPS enabled (all major providers do this automatically)
- [ ] Twilio Verify service configured for OTP (see `backend/SETUP.md`)
- [ ] Demo seed run if you want initial test data: `cd backend && npm run seed`

---

## Environment Variables Reference

### customer-web and washerman-web

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | **Yes** | Backend API base URL, no trailing slash |

### backend

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | **Yes** | Random string ≥32 chars for signing access tokens |
| `JWT_REFRESH_SECRET` | **Yes** | Random string ≥32 chars for signing refresh tokens |
| `TWILIO_ACCOUNT_SID` | **Yes** | Twilio account SID for OTP delivery |
| `TWILIO_AUTH_TOKEN` | **Yes** | Twilio auth token |
| `TWILIO_VERIFY_SERVICE_SID` | **Yes** | Twilio Verify service SID (starts with `VA`) |
| `FIREBASE_PROJECT_ID` | **Yes** | For push notifications |
| `FIREBASE_PRIVATE_KEY` | **Yes** | Firebase service account private key |
| `FIREBASE_CLIENT_EMAIL` | **Yes** | Firebase service account email |
| `PORT` | No | Defaults to 3000 |
| `APP_ENV` | No | `production` / `development` |

---

## Generating Secure Secrets

```bash
# Generate JWT secrets (run twice for access + refresh)
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Bundle Size (for reference)

After a production build, the JS is split into named chunks for faster loading:

| Chunk | Size (gzip) | Contents |
|---|---|---|
| `vendor` | ~67 KB | React, React DOM, React Router |
| `motion` | ~38 KB | Framer Motion |
| `forms` | ~22 KB | React Hook Form, Zod |
| `index` | ~21 KB | App pages |
| `http` | ~17 KB | Axios |
| `ui` | ~7 KB | Lucide icons, React Hot Toast |
| `state` | ~2 KB | Zustand |

Total first-load JS: ~174 KB gzipped — well within acceptable range.
