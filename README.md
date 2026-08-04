# Advocate Chauhan — Legal Services Platform

Full-stack legal services web application with three portals: public user website, admin dashboard, and REST API backend.

**Live URLs**
- User Website: https://ashritha-d.github.io/ChauhanAdvocate/
- Backend API: https://advocatechauhan-fqgugda3cgd3e6fp.southindia-01.azurewebsites.net/api

---

## Project Structure

```
ChauhanAdvocate/
├── backend/                        ← Node.js + Express REST API
│   ├── controllers/                ← Business logic (30 controllers)
│   ├── middleware/                 ← Auth, Turnstile CAPTCHA, upload, rate limiting
│   ├── models/                     ← Mongoose models (30+ models)
│   ├── routes/                     ← API route definitions (29 route files)
│   ├── services/                   ← securityLogger, WhatsApp notifications
│   ├── utils/                      ← slotUtils (transaction wrappers)
│   ├── scripts/seed.js             ← Database seeder
│   └── server.js                   ← Entry point, Helmet CSP, CORS
│
├── advocate-user-website/          ← React 18 + Vite (public website)
│   └── src/
│       ├── api/                    ← axios instance + all API functions
│       ├── components/             ← Reusable UI components + TurnstileWidget
│       ├── context/                ← UserAuthContext (JWT + refresh tokens)
│       ├── hooks/                  ← usePolling, useCounter
│       ├── pages/                  ← Full page components
│       └── utils/                  ← helpers, pendingAction
│
└── advocate-admin-panel/           ← React 18 + Vite (admin dashboard)
    └── src/
        ├── api/                    ← Admin API functions
        ├── components/             ← Admin UI components
        ├── context/                ← AdminAuthContext
        └── pages/                  ← 28 admin page components
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, React Router v6, Axios |
| **Admin Panel** | React 18, Vite |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas + Mongoose |
| **Auth (Admin)** | JWT (jsonwebtoken + bcryptjs) |
| **Auth (User)** | JWT access token (15m) + HttpOnly refresh token (30d) |
| **File Storage** | Cloudinary (permanent, replaces ephemeral uploads) |
| **Payments** | Razorpay + Manual UPI/QR code flow |
| **Notifications** | WhatsApp via Meta Cloud API |
| **CAPTCHA** | Cloudflare Turnstile |
| **Security** | Helmet CSP + HSTS, rate limiting, security event logging |
| **Deployment** | GitHub Pages (frontend) + Render (backend) |
| **Animations** | AOS.js |
| **Icons** | Font Awesome 6 |
| **Fonts** | Google Fonts (Playfair Display + Inter) |

---

## Features

### User Website
- Appointment booking with slot management and WhatsApp confirmation
- Book purchases with UPI/QR payment and order tracking
- Legal draft templates (free + paid)
- Course enrollment and payment
- Magazine browsing and purchase
- Live sessions page with real-time status
- User registration, login, profile, notifications
- Cloudflare Turnstile CAPTCHA on all payment forms
- Silent JWT refresh (access token auto-renewed via HttpOnly refresh cookie)
- News ticker, hero banners, blogs, FAQs, testimonials, gallery

### Admin Dashboard (28 pages)
- Dashboard with analytics and revenue overview
- Appointments — view, update status, WhatsApp notify
- Payments — manual UPI payment verification, Razorpay orders
- Book Orders — manage orders, update delivery status
- Books, Courses, Drafts, Magazines — full CRUD with Cloudinary uploads
- Live Sessions — start/stop/schedule, live status broadcast
- Users — view all registered users, deactivate accounts
- Jr Advocates — applications management
- Blogs, News, FAQs, Testimonials, Services — full CRUD
- Site Settings — editable from admin (contact info, UPI ID, QR code, etc.)
- Hero Banners — manage homepage carousel
- Audit Logs — admin action history
- Security Logs — login failures, CAPTCHA failures
- Facebook/YouTube content management
- Admin Management + Super Admin controls

### Backend Security
- Helmet with full CSP (allows Cloudflare Turnstile, Google Fonts)
- HSTS (1 year, includeSubDomains, preload)
- Refresh token rotation with family-based reuse detection
- TTL-indexed SecurityLog and RefreshToken collections
- `withOptionalTransaction` — MongoDB transaction wrapper with Atlas M0 fallback
- Rate limiting on all payment and auth routes
- Cloudflare Turnstile verification middleware on all public payment endpoints

---

## API Routes

### Auth (Admin)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/auth/me` | Get admin profile |
| PUT | `/api/auth/profile` | Update admin profile |
| PUT | `/api/auth/change-password` | Change admin password |

### Users (Public + Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | User registration |
| POST | `/api/users/login` | User login (issues refresh cookie) |
| POST | `/api/users/refresh` | Silent token refresh |
| POST | `/api/users/logout` | Revoke refresh token |
| GET | `/api/users/profile` | Get user profile |
| PUT | `/api/users/profile` | Update user profile |
| GET | `/api/users/notifications` | Get user notifications |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/appointments` | Book appointment |
| GET | `/api/appointments` | List all (admin) |
| PUT | `/api/appointments/:id` | Update status (admin) |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments` | Submit manual payment (Turnstile protected) |
| POST | `/api/payments/manual` | Manual UPI payment (Turnstile protected) |
| POST | `/api/payments/book-manual` | Book order payment (Turnstile protected) |
| GET | `/api/payments` | List all payments (admin) |
| PUT | `/api/payments/:id` | Update payment status (admin) |

### Books & Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/books` | List published books |
| POST | `/api/books` | Create book (admin) |
| GET | `/api/book-orders` | List all orders (admin) |
| PUT | `/api/book-orders/:id` | Update order status (admin) |

### Drafts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/drafts` | List published drafts |
| POST | `/api/drafts` | Create draft (admin) |
| POST | `/api/draft-purchases/:draftId` | Purchase draft (Turnstile protected) |
| GET | `/api/draft-purchases` | List all purchases (admin) |

### Courses & Magazines
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List published courses |
| POST | `/api/courses` | Create course (admin) |
| GET | `/api/magazines` | List published magazines |
| POST | `/api/magazines` | Create magazine (admin) |

### Live Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/live/status` | Get current live status |
| POST | `/api/live/start` | Start live session (admin) |
| POST | `/api/live/stop` | Stop live session (admin) |

### Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blogs` | List published blogs |
| GET | `/api/services` | List active services |
| GET | `/api/faqs` | List active FAQs |
| GET | `/api/testimonials` | List approved testimonials |
| GET | `/api/news` | List news items |
| GET | `/api/site-settings` | Get site settings |
| POST | `/api/contacts` | Submit contact form |

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/advocate_chauhan

# Admin Auth
JWT_SECRET=your_long_random_secret_min_32_chars
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@advocatechauhan.com
ADMIN_PASSWORD=Admin@123456
ADMIN_NAME=Admin

# User Auth
USER_JWT_EXPIRE=15m
USER_REFRESH_TOKEN_EXPIRE_DAYS=30

# Cloudinary (file storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Cloudflare Turnstile
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
TURNSTILE_STRICT=false

# WhatsApp (Meta Cloud API)
WHATSAPP_ACCESS_TOKEN=your_permanent_system_user_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
ADMIN_WHATSAPP=91XXXXXXXXXX

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Email (optional — receipt delivery)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# CORS
ALLOWED_ORIGINS=https://ashritha-d.github.io
```

### User Website (`advocate-user-website/.env.production`)

```env
VITE_API_BASE=https://advocatechauhan-fqgugda3cgd3e6fp.southindia-01.azurewebsites.net/api
VITE_TURNSTILE_SITE_KEY=your_cloudflare_turnstile_site_key
```

---

## Local Development

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas connection string)
- Cloudinary account
- Cloudflare Turnstile keys (optional for dev — skipped automatically)

### 1. Clone & Install

```bash
git clone https://github.com/ashritha-d/ChauhanAdvocate.git
cd ChauhanAdvocate

# Backend
cd backend && npm install

# User website
cd ../advocate-user-website && npm install

# Admin panel
cd ../advocate-admin-panel && npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env with your values
```

### 3. Seed Database

```bash
cd backend
npm run seed
```

### 4. Start All Services

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — User website
cd advocate-user-website && npm run dev

# Terminal 3 — Admin panel
cd advocate-admin-panel && npm run dev
```

| Service | URL |
|---------|-----|
| Backend API | http://localhost:5000/api |
| User Website | http://localhost:5173 |
| Admin Panel | http://localhost:5174 |

**Default Admin Credentials:**
- Email: `admin@advocatechauhan.com`
- Password: `Admin@123456`

---

## Deployment

### Frontend (GitHub Pages)

```bash
cd advocate-user-website
npm run build
npx gh-pages -d dist
```

### Backend (Render)

1. Connect GitHub repo to Render
2. Set root directory to `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all environment variables from the list above

### Admin Panel

Deploy separately to GitHub Pages, Vercel, or Netlify. Update `VITE_API_BASE` to point to the deployed backend.

---

## Models Overview

| Model | Description |
|-------|-------------|
| Admin | Admin user with JWT auth |
| User | Public user with JWT + refresh token auth |
| RefreshToken | HttpOnly refresh tokens with family reuse detection |
| SecurityLog | Login failures, CAPTCHA failures (90-day TTL) |
| Appointment | Appointment bookings with slot management |
| Payment | Manual UPI + Razorpay payments |
| Book | Legal books for sale |
| BookOrder | Book purchase orders |
| Draft | Legal document templates |
| DraftPurchase | Draft purchase records |
| Course | Online courses |
| Enrollment | Course enrollments |
| Magazine | Legal magazines |
| MagazinePurchase | Magazine purchases |
| LiveSession | Live broadcast sessions |
| Blog | Published blog posts |
| News | News/updates |
| Service | Legal services offered |
| FAQ | Frequently asked questions |
| Testimonial | Client testimonials |
| SiteSettings | Admin-editable site content |
| HeroBanner | Homepage carousel banners |
| Contact | Contact form submissions |
| UserNotification | In-app user notifications |
| AuditLog | Admin action audit trail |
| JrAdvocate | Junior advocate applications |
| Internship | Internship listings |
| JoinWithUs | Join requests |
| FacebookPost | Facebook content links |
| YoutubeVideo | YouTube video links |
