# Advocate Chauhan — Complete Architecture Documentation

> Generated for migration reference. Every folder, file, route, model, middleware, and service is documented here. A developer can migrate the entire application to any hosting platform using only this document.

---

## Table of Contents

1. [Project Directory Structure](#1-project-directory-structure)
2. [Folder Explanations](#2-folder-explanations)
3. [File Explanations](#3-file-explanations)
4. [React Pages](#4-react-pages)
5. [React Components](#5-react-components)
6. [Backend API Documentation](#6-backend-api-documentation)
7. [Controller Documentation](#7-controller-documentation)
8. [Database Documentation](#8-database-documentation)
9. [Authentication Flow](#9-authentication-flow)
10. [Middleware Flow](#10-middleware-flow)
11. [Payment Flow](#11-payment-flow)
12. [Cloudinary Flow](#12-cloudinary-flow)
13. [WhatsApp Notification Flow](#13-whatsapp-notification-flow)
14. [Environment Variables](#14-environment-variables)
15. [External Services](#15-external-services)
16. [Deployment Configuration](#16-deployment-configuration)
17. [Frontend Build Flow](#17-frontend-build-flow)
18. [Backend Startup Flow](#18-backend-startup-flow)
19. [Complete Request Lifecycle](#19-complete-request-lifecycle)
20. [Feature Dependency Map](#20-feature-dependency-map)
21. [Security Architecture](#21-security-architecture)
22. [Hosting Migration Checklist](#22-hosting-migration-checklist)
23. [Deployment Commands](#23-deployment-commands)
24. [Complete Architecture Report](#24-complete-architecture-report)

---

## 1. Project Directory Structure

```text
ChauhanAdvocate/
│
├── backend/                            ← Node.js + Express REST API
│   ├── config/
│   │   └── db.js                       ← MongoDB connection (unused in server.js — inline connect)
│   ├── controllers/
│   │   ├── adminManagementController.js
│   │   ├── appointmentController.js
│   │   ├── auditLogController.js
│   │   ├── authController.js
│   │   ├── blogController.js
│   │   ├── bookController.js
│   │   ├── bookOrderController.js
│   │   ├── contactController.js
│   │   ├── contactDetailController.js
│   │   ├── courseController.js
│   │   ├── draftController.js
│   │   ├── draftPurchaseController.js
│   │   ├── facebookPostController.js
│   │   ├── faqController.js
│   │   ├── heroBannerController.js
│   │   ├── internshipController.js
│   │   ├── joinWithUsController.js
│   │   ├── jrAdvocateController.js
│   │   ├── magazineController.js
│   │   ├── magazinePurchaseController.js
│   │   ├── newsController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   ├── razorpayController.js
│   │   ├── serviceController.js
│   │   ├── siteSettingsController.js
│   │   ├── superAdminController.js
│   │   ├── testimonialController.js
│   │   ├── userController.js
│   │   └── youtubeVideoController.js
│   ├── middleware/
│   │   ├── auth.js                     ← Admin JWT protect + authorize + generateToken
│   │   ├── turnstile.js                ← Cloudflare Turnstile CAPTCHA verification
│   │   ├── upload.js                   ← Multer + Cloudinary storage
│   │   ├── userAuth.js                 ← User JWT + refresh token lifecycle
│   │   ├── validate.js                 ← express-validator error handler
│   │   └── videoUpload.js              ← Video-specific multer config
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Appointment.js
│   │   ├── AuditLog.js
│   │   ├── Blog.js
│   │   ├── Book.js
│   │   ├── BookOrder.js
│   │   ├── Contact.js
│   │   ├── ContactDetail.js
│   │   ├── Course.js
│   │   ├── Draft.js
│   │   ├── DraftPurchase.js
│   │   ├── Enrollment.js
│   │   ├── FAQ.js
│   │   ├── FacebookPost.js
│   │   ├── HeroBanner.js
│   │   ├── Internship.js
│   │   ├── JoinWithUs.js
│   │   ├── JrAdvocate.js
│   │   ├── LiveAuditLog.js
│   │   ├── LiveSession.js
│   │   ├── Magazine.js
│   │   ├── MagazinePurchase.js
│   │   ├── News.js
│   │   ├── Order.js
│   │   ├── Payment.js
│   │   ├── RefreshToken.js
│   │   ├── SecurityLog.js
│   │   ├── Service.js
│   │   ├── SiteSettings.js
│   │   ├── Testimonial.js
│   │   ├── User.js
│   │   ├── UserNotification.js
│   │   └── YoutubeVideo.js
│   ├── routes/
│   │   ├── adminManagement.js
│   │   ├── appointments.js
│   │   ├── auth.js
│   │   ├── blogs.js
│   │   ├── bookOrders.js
│   │   ├── books.js
│   │   ├── contactDetails.js
│   │   ├── contacts.js
│   │   ├── courses.js
│   │   ├── draftPurchases.js
│   │   ├── drafts.js
│   │   ├── facebookPosts.js
│   │   ├── faqs.js
│   │   ├── heroBanners.js
│   │   ├── internships.js
│   │   ├── joinWithUs.js
│   │   ├── jrAdvocates.js
│   │   ├── live.js
│   │   ├── magazines.js
│   │   ├── news.js
│   │   ├── notifications.js
│   │   ├── orders.js
│   │   ├── payments.js
│   │   ├── services.js
│   │   ├── siteSettings.js
│   │   ├── superAdmin.js
│   │   ├── testimonials.js
│   │   ├── upload.js
│   │   ├── users.js
│   │   └── youtubeVideos.js
│   ├── services/
│   │   └── securityLogger.js           ← Centralized security event logging
│   ├── utils/
│   │   └── slotUtils.js                ← Slot conflict check + MongoDB transaction wrapper
│   ├── scripts/
│   │   └── seed.js                     ← Database seeder (admin, services, FAQs)
│   ├── uploads/                        ← Local ephemeral storage (not used in prod)
│   │   ├── gallery/
│   │   ├── payments/
│   │   ├── avatars/
│   │   └── videos/
│   ├── .env                            ← Environment variables (not committed)
│   ├── .env.example                    ← Environment variable template
│   ├── package.json
│   └── server.js                       ← Entry point
│
├── advocate-user-website/              ← React 18 + Vite (public user portal)
│   ├── public/
│   │   ├── bootstrap.min.css
│   │   ├── bootstrap.bundle.min.js
│   │   ├── fa-all.min.css              ← Font Awesome (local, no CDN)
│   │   ├── aos.css / aos.js
│   │   └── [images, logo, favicon]
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js                ← Axios instance + 401 refresh interceptor
│   │   │   └── index.js                ← All 60+ API call functions
│   │   ├── components/
│   │   │   ├── About.jsx
│   │   │   ├── Appointment.jsx
│   │   │   ├── AppointmentModal.jsx
│   │   │   ├── AppointmentSuccessCard.jsx
│   │   │   ├── AuthGateModal.jsx
│   │   │   ├── BackToTop.jsx
│   │   │   ├── BlogModal.jsx
│   │   │   ├── Blogs.jsx
│   │   │   ├── BookPromoPopup.jsx
│   │   │   ├── Books.jsx
│   │   │   ├── Contact.jsx
│   │   │   ├── CourseEnrollModal.jsx
│   │   │   ├── CoursePreviewModal.jsx
│   │   │   ├── Drafts.jsx
│   │   │   ├── FAQs.jsx
│   │   │   ├── FacebookSection.jsx
│   │   │   ├── FlashFlyerPopup.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── JoinUs.jsx
│   │   │   ├── JrAdvocateModal.jsx
│   │   │   ├── LatestUpdates.jsx
│   │   │   ├── Magazines.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── NewsTicker.jsx
│   │   │   ├── OrderModal.jsx
│   │   │   ├── PhoneButton.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── SEOHead.jsx
│   │   │   ├── Services.jsx
│   │   │   ├── SliderSection.jsx
│   │   │   ├── Testimonials.jsx
│   │   │   ├── TopBar.jsx
│   │   │   ├── TurnstileWidget.jsx
│   │   │   ├── VideoSlider.jsx
│   │   │   ├── WhatsAppButton.jsx
│   │   │   └── YouTubeSection.jsx
│   │   ├── context/
│   │   │   ├── SiteContext.jsx         ← Global site settings from API
│   │   │   └── UserAuthContext.jsx     ← User auth state + refresh token logic
│   │   ├── hooks/
│   │   │   ├── useCounter.js           ← Animated number counter
│   │   │   └── usePolling.js           ← Auto-refresh on interval
│   │   ├── pages/
│   │   │   ├── BookPayment.jsx
│   │   │   ├── Books.jsx
│   │   │   ├── Courses.jsx
│   │   │   ├── Drafts.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── Gallery.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── InternshipPayment.jsx
│   │   │   ├── Live.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Magazines.jsx
│   │   │   ├── News.jsx
│   │   │   ├── Payment.jsx
│   │   │   ├── PrivacyPolicy.jsx
│   │   │   ├── Profile.jsx
│   │   │   └── Register.jsx
│   │   ├── utils/
│   │   │   ├── helpers.js              ← mediaUrl(), formatDate()
│   │   │   └── pendingAction.js        ← Store modal intent across login redirect
│   │   ├── App.jsx                     ← Router + layouts + JSON-LD schema
│   │   └── main.jsx                    ← React entry point
│   ├── .env                            ← Dev env vars
│   ├── .env.production                 ← Production env vars
│   ├── vite.config.js
│   └── package.json
│
├── advocate-admin-panel/               ← React 18 + Vite (admin dashboard)
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js                ← Admin axios instance
│   │   │   └── index.js                ← All admin API functions
│   │   ├── components/
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── ImageUpload.jsx
│   │   │   ├── NotificationAnalytics.jsx
│   │   │   └── Sidebar.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx         ← Admin JWT auth state
│   │   ├── hooks/
│   │   │   └── usePolling.js
│   │   ├── pages/                      ← 28 admin pages
│   │   │   ├── AdminManagement.jsx
│   │   │   ├── Appointments.jsx
│   │   │   ├── AuditLogs.jsx
│   │   │   ├── Blogs.jsx
│   │   │   ├── BookOrders.jsx
│   │   │   ├── Books.jsx
│   │   │   ├── Contacts.jsx
│   │   │   ├── Courses.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Drafts.jsx
│   │   │   ├── FAQs.jsx
│   │   │   ├── FacebookContent.jsx
│   │   │   ├── HeroBanners.jsx
│   │   │   ├── Internships.jsx
│   │   │   ├── JrAdvocates.jsx
│   │   │   ├── LiveSessions.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Magazines.jsx
│   │   │   ├── News.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── Orders.jsx
│   │   │   ├── Payments.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Services.jsx
│   │   │   ├── SiteSettings.jsx
│   │   │   ├── Testimonials.jsx
│   │   │   ├── Users.jsx
│   │   │   └── YouTubeVideos.jsx
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env / .env.production
│   ├── vite.config.js
│   └── package.json
│
├── README.md
├── ARCHITECTURE.md                     ← This file
└── .gitignore
```

---

## 2. Folder Explanations

### `backend/controllers/`
**Purpose:** Business logic layer. Each file handles one resource domain.
**Depends on:** models/, middleware/, utils/, services/
**Imported by:** routes/

### `backend/middleware/`
**Purpose:** Request pipeline functions. Run before controllers.

| File | Purpose |
|------|---------|
| `auth.js` | Admin JWT verification, role-based authorization |
| `userAuth.js` | User JWT + refresh token rotation, cookie helpers |
| `upload.js` | Multer + Cloudinary storage config for all file types |
| `videoUpload.js` | Video-specific multer config |
| `turnstile.js` | Cloudflare Turnstile CAPTCHA backend verification |
| `validate.js` | express-validator error aggregation and response |

### `backend/models/`
**Purpose:** Mongoose schemas — define all MongoDB collections.
**Imported by:** controllers/, middleware/userAuth.js

### `backend/routes/`
**Purpose:** Map HTTP method + URL to middleware chain + controller.
**Imported by:** server.js

### `backend/services/`
**Purpose:** Reusable cross-cutting services.

| File | Purpose |
|------|---------|
| `securityLogger.js` | Logs security events (login failures, CAPTCHA fails) to SecurityLog collection |

### `backend/utils/`
**Purpose:** Pure utility functions with no HTTP context.

| File | Purpose |
|------|---------|
| `slotUtils.js` | `isSlotTaken()` — conflict detection; `withOptionalTransaction()` — MongoDB transaction wrapper with Atlas M0 fallback |

### `advocate-user-website/src/api/`
**Purpose:** All HTTP communication with backend.

| File | Purpose |
|------|---------|
| `axios.js` | Axios instance with base URL, auth header interceptor, 401→refresh→retry interceptor |
| `index.js` | 60+ named API functions for every backend endpoint |

### `advocate-user-website/src/context/`
| File | Purpose |
|------|---------|
| `SiteContext.jsx` | Fetches site settings on app load; provides to all components |
| `UserAuthContext.jsx` | Manages user login state, token storage, logout with cookie revocation |

### `advocate-user-website/src/hooks/`
| File | Purpose |
|------|---------|
| `usePolling.js` | Calls a function on a setInterval; cleans up on unmount |
| `useCounter.js` | Animates a number from 0 to target value |

---

## 3. File Explanations

### `backend/server.js`
- **Purpose:** Express app entry point. Registers all middleware and routes.
- **Key setup:**
  - DNS set to `8.8.8.8` / `8.8.4.4` (Google DNS for reliable external API calls on Render)
  - `trust proxy 1` — correct IP/protocol behind Render's reverse proxy
  - Helmet with full CSP (allows Cloudflare Turnstile)
  - HSTS 1 year with preload
  - CORS: function-based origin check from `ALLOWED_ORIGINS` env var, `credentials: true`
  - Global rate limiter: 1000 req / 15 min on `/api/`
  - Auth rate limiter: 10 req / 15 min on `/api/auth/` and `/api/users/`
  - `Cache-Control: no-store` on all API responses
  - Body parser: JSON + URL-encoded, 10 MB limit
  - Static `/uploads` served from filesystem
  - 29 route groups registered
  - `GET /api/health` — uptime health check
  - `GET /api/gallery` — lists images from `uploads/gallery/`
  - Global error handler + 404 handler

### `backend/middleware/auth.js`
- **Exports:** `protect`, `authorize(...roles)`, `generateToken(id)`
- **protect:** Reads `Authorization: Bearer <token>`, verifies JWT, attaches `req.admin`
- **authorize:** Role-based guard (e.g. `authorize('superAdmin')`)
- **generateToken:** Signs JWT with `JWT_SECRET`, expires in `JWT_EXPIRE` (default 7d)

### `backend/middleware/userAuth.js`
- **Exports:** `protectUser`, `optionalUserAuth`, `generateUserToken`, `issueRefreshToken`, `consumeRefreshToken`, `revokeRefreshToken`, `setRefreshCookie`, `clearRefreshCookie`, `parseCookieHeader`, `REFRESH_COOKIE_NAME`
- **protectUser:** Full user auth — requires valid Bearer token, checks `tokenVersion` for revocation
- **optionalUserAuth:** Sets `req.user` if token valid, else null — never returns 401
- **issueRefreshToken:** Creates SHA-256 hashed refresh token record in MongoDB, returns raw token
- **consumeRefreshToken:** Validates, detects reuse (revokes entire family if reused), rotates
- **setRefreshCookie:** Sets `rt` HttpOnly cookie (`SameSite=none;Secure` in prod, `lax` in dev)

### `backend/middleware/upload.js`
- **Exports:** `upload` (multer instance), `upload.cloudinary` (cloudinary v2 instance)
- **Storage:** `multer-storage-cloudinary` → files go directly to Cloudinary `advocate-chauhan/` folder
- **Resource types:** `image` (auto quality/format optimization), `video`, `raw` (PDF/DOC)
- **Allowed extensions:** jpeg, jpg, png, gif, webp, svg, pdf, mp4, mov, avi, doc, docx
- **Max file size:** `MAX_FILE_SIZE` env var or 20 MB

### `backend/middleware/turnstile.js`
- **Purpose:** Verifies Cloudflare Turnstile tokens before payment controllers run
- **Behavior in dev:** Skips if `TURNSTILE_SECRET_KEY` not set (logs warning)
- **Behavior in prod:** Returns 503 if secret not configured
- **Reads:** `req.body.turnstileToken` or `req.body['cf-turnstile-response']`
- **Calls:** `https://challenges.cloudflare.com/turnstile/v0/siteverify` via native `https` module
- **On failure:** Logs `CAPTCHA_FAILED` via securityLogger, returns 400

### `backend/services/securityLogger.js`
- **Exports:** `info(event, details, req)`, `warn(event, details, req)`, `critical(event, details, req)`
- **Never throws** — all errors are caught silently so security logging never breaks the request
- **Extracts IP** from `x-forwarded-for` header (handles Render proxy)
- **Writes to:** `SecurityLog` collection with 90-day TTL index

### `backend/utils/slotUtils.js`
- **Exports:** `isSlotTaken(date, time, session?)`, `withOptionalTransaction(fn)`
- **isSlotTaken:** Queries appointments for same date+time with non-cancelled status
- **withOptionalTransaction:** Runs `hello` command once to detect replica set; runs fn with session if available, fn(null) otherwise — makes Atlas M0 (no replica set) work alongside M10+

### `advocate-user-website/src/api/axios.js`
- **Base URL:** `import.meta.env.VITE_API_BASE`
- **Request interceptor:** Auto-attaches `Authorization: Bearer <userToken>` from localStorage
- **Response interceptor:** On 401, queues the request, calls `/users/refresh` with `withCredentials`, retries all queued requests with new token; on refresh failure clears localStorage token
- **withCredentials:** Only sent on `/users/refresh` and `/users/logout` (for HttpOnly cookie)

---

## 4. React Pages

### User Website Pages

| Page | Route | Key Components | APIs Called | Auth | Description |
|------|-------|---------------|-------------|------|-------------|
| Home | `/` | Hero, About, Services, Blogs, Testimonials, FAQs, YouTubeSection, FacebookSection, SliderSection, VideoSlider, JoinUs | getSiteSettings, getServices, getBlogs, getTestimonials, getFAQs, getHeroBanners, getYouTubeVideos, getFacebookPosts | No | Main landing page with all sections |
| Login | `/login` | Navbar, Footer | userLogin | No | Email/password login, issues access token + refresh cookie |
| Register | `/register` | Navbar, Footer | userRegister | No | User registration form |
| ForgotPassword | `/forgot-password` | Navbar, Footer | userForgotPassword, userVerifyOTP, userResetPassword | No | 3-step OTP password reset |
| Profile | `/profile` | Profile component (tabs) | getUserProfile, getMyAppointments, getMyOrders, getMyEnrollments, getMyDraftPurchases, getNotifications | Required | User dashboard with tabs: Overview, Appointments, Orders, Courses, Drafts, Notifications, Settings |
| Gallery | `/gallery` | Navbar, Footer | GET /api/gallery | No | Image gallery from uploads/gallery/ |
| Courses | `/courses` | CourseEnrollModal, CoursePreviewModal | getPublicCourses, enrollCourse | Optional | Course listing with enrollment |
| Books | `/books` | OrderModal | getBooks | No | Book listing with purchase flow |
| Magazines | `/magazines` | Magazines component | getMagazines, checkMagazinePurchase | Optional | Magazine browsing and purchase |
| Drafts | `/drafts` | TurnstileWidget | getDrafts, purchaseDraft | Required for paid | Legal draft templates |
| News | `/news` | SEOHead | getActiveNews, getNewsPage | No | News and updates with pagination |
| Live | `/live` | SEOHead | getLiveStatus, getUpcomingSessions, getPastSessions, getLiveJoinUrl | Optional | Live session status and join |
| Payment | `/payment` | TurnstileWidget | getPaymentSettings, submitManualPayment | Optional | Appointment payment (reads from sessionStorage) |
| BookPayment | `/book-payment` | TurnstileWidget | getPaymentSettings, submitBookManualPayment | Optional | Book order payment (reads from sessionStorage) |
| InternshipPayment | `/internship-payment` | — | submitInternshipApplication | No | Internship application + payment |
| Contact | `/contact` | Contact component | sendContact, getSiteSettings | No | Contact form |
| PrivacyPolicy | `/privacy-policy` | — | — | No | Static privacy policy |

### Admin Panel Pages (28)

| Page | Purpose | Auth |
|------|---------|------|
| Login | Admin login | Public |
| Dashboard | Analytics overview, revenue, counts | Admin |
| Appointments | View/manage bookings, update status | Admin |
| Payments | Manual payment verification | Admin |
| BookOrders | Book order management | Admin |
| Books | Book CRUD with Cloudinary | Admin |
| Drafts | Draft template CRUD | Admin |
| Courses | Course CRUD, enrollment management | Admin |
| Magazines | Magazine CRUD, purchase management | Admin |
| LiveSessions | Start/stop/schedule live sessions | Admin |
| Users | User list, deactivation | Admin |
| JrAdvocates | Application management | Admin |
| Internships | Internship listing management | Admin |
| Blogs | Blog CRUD with rich text | Admin |
| News | News CRUD | Admin |
| Services | Service CRUD | Admin |
| FAQs | FAQ CRUD | Admin |
| Testimonials | Testimonial CRUD with approval | Admin |
| SiteSettings | Edit all site content from dashboard | Admin |
| HeroBanners | Manage homepage carousel | Admin |
| Contacts | Contact form submissions | Admin |
| Orders | Jr Advocate / Join-with-us orders | Admin |
| Notifications | Notification analytics dashboard | Admin |
| AuditLogs | Admin action history | Admin |
| AdminManagement | Create/manage admin accounts | Super Admin |
| Profile | Admin profile settings | Admin |
| FacebookContent | Manage Facebook post links | Admin |
| YouTubeVideos | Manage YouTube video links | Admin |

---

## 5. React Components

### TurnstileWidget.jsx
- **Parent:** Payment.jsx, BookPayment.jsx, Drafts.jsx (purchase modal)
- **Props:** `onVerify(token)`, `onExpire()`
- **State:** `status` (loading | verified | expired | error)
- **Behavior:** Loads `https://challenges.cloudflare.com/turnstile/v0/api.js?onload=__onTurnstileLoad&render=explicit` once globally; uses `window.__turnstileQueue` for multiple instances; calls `window.turnstile.render()` on mount; removes widget on unmount
- **Returns null** if `VITE_TURNSTILE_SITE_KEY` not set (dev mode)

### Navbar.jsx
- **State:** scroll position, mobile menu open, active section
- **Context:** `useUserAuth()` — shows user name / logout if logged in
- **Links:** Home, Dashboard, Courses, Magazines, Drafts, Books, Contact, LIVE badge, Book Appointment CTA, notification bell, user menu

### AppointmentModal.jsx
- **Purpose:** Collects appointment details (name, phone, date, time, notes)
- **Behavior:** Stores data to `sessionStorage('pendingAppointment')`, navigates to `/payment`
- **Does NOT call API** — the actual booking API call is in `Payment.jsx`
- **Context:** `useUserAuth()` for user prefill

### UserAuthContext.jsx
- **State:** `user`, `loading`, `unreadCount`, `activeModal`, `modalData`
- **`login(token, userData)`:** Saves token to localStorage, sets user state, restores pending modal
- **`logout()`:** Removes token, calls `POST /users/logout` (best-effort refresh cookie revocation)
- **On load:** Fetches `/users/profile` to restore session; removes token on failure

### SiteContext.jsx
- **Fetches** `GET /api/site-settings` on mount
- **Provides:** All site settings (UPI ID, QR code, contact info, social links) to entire app
- **Used by:** TopBar, Footer, Contact, About, Hero, WhatsAppButton

---

## 6. Backend API Documentation

### Auth (Admin)

| Method | Endpoint | Controller | Middleware | Request Body | Response |
|--------|----------|-----------|-----------|-------------|---------|
| POST | `/api/auth/login` | authController.login | authLimiter | `{email, password}` | `{token, admin}` |
| GET | `/api/auth/me` | authController.getMe | protect | — | `{admin}` |
| PUT | `/api/auth/profile` | authController.updateProfile | protect | `{name, email}` | `{admin}` |
| PUT | `/api/auth/change-password` | authController.changePassword | protect | `{currentPassword, newPassword}` | `{message}` |

### Users (Public + Protected)

| Method | Endpoint | Controller | Middleware | Description |
|--------|----------|-----------|-----------|-------------|
| POST | `/api/users/register` | userController.register | authLimiter | Create user + issue refresh cookie |
| POST | `/api/users/login` | userController.login | authLimiter | Login + issue refresh cookie |
| POST | `/api/users/refresh` | userController.refreshToken | — | Rotate refresh token, return new access token |
| POST | `/api/users/logout` | userController.logoutUser | — | Revoke refresh token, clear cookie |
| POST | `/api/users/forgot-password` | userController.forgotPassword | — | Send OTP via WhatsApp/email |
| POST | `/api/users/verify-otp` | userController.verifyOTP | — | Verify 6-digit OTP |
| POST | `/api/users/reset-password` | userController.resetPassword | — | Set new password with reset token |
| GET | `/api/users/profile` | userController.getProfile | protectUser | Get user profile |
| PUT | `/api/users/profile` | userController.updateProfile | protectUser | Update name/phone |
| PUT | `/api/users/change-password` | userController.changePassword | protectUser | Change password |
| POST | `/api/users/upload-photo` | userController.uploadPhoto | protectUser, upload.single | Upload avatar to Cloudinary |
| GET | `/api/users/my-appointments` | userController.getMyAppointments | protectUser | User's appointments |
| GET | `/api/users/my-orders` | userController.getMyOrders | protectUser | User's book orders |
| GET | `/api/users/notifications` | userController.getNotifications | protectUser | In-app notifications |
| PUT | `/api/users/notifications/:id/read` | userController.markRead | protectUser | Mark one notification read |
| PUT | `/api/users/notifications/mark-all-read` | userController.markAllRead | protectUser | Mark all read |

### Appointments

| Method | Endpoint | Middleware | Description |
|--------|----------|-----------|-------------|
| POST | `/api/appointments` | optionalUserAuth, verifyTurnstile | Book slot (Turnstile protected) |
| GET | `/api/appointments` | protect | Admin: list all appointments |
| GET | `/api/appointments/available-slots` | — | Get booked slots for a date |
| GET | `/api/appointments/:id` | protect | Get single appointment |
| PUT | `/api/appointments/:id` | protect | Update status + WhatsApp notify |
| DELETE | `/api/appointments/:id` | protect | Delete appointment |

### Payments

| Method | Endpoint | Middleware | Description |
|--------|----------|-----------|-------------|
| GET | `/api/payments/payment-settings` | — | Get UPI ID + QR image URL |
| POST | `/api/payments/manual` | paymentSubmitLimiter, optionalUserAuth, upload.single, verifyTurnstile | Submit appointment manual payment |
| POST | `/api/payments/book-manual` | paymentSubmitLimiter, optionalUserAuth, upload.single, verifyTurnstile | Submit book order manual payment |
| POST | `/api/payments` | paymentSubmitLimiter, optionalUserAuth, upload.single, verifyTurnstile | Submit Razorpay payment |
| GET | `/api/payments` | protect | Admin: list all payments |
| PUT | `/api/payments/:id` | protect | Admin: approve/reject payment |

### Books & Orders

| Method | Endpoint | Middleware | Description |
|--------|----------|-----------|-------------|
| GET | `/api/books` | — | List published books |
| POST | `/api/books` | protect, upload.single | Create book (admin) |
| PUT | `/api/books/:id` | protect, upload.single | Update book |
| DELETE | `/api/books/:id` | protect | Delete book |
| GET | `/api/book-orders` | protect | Admin: all book orders |
| PUT | `/api/book-orders/:id` | protect | Update order status |

### Magazines

| Method | Endpoint | Middleware | Description |
|--------|----------|-----------|-------------|
| GET | `/api/magazines` | — | List all magazines |
| POST | `/api/magazines` | protect, upload | Create magazine |
| GET | `/api/magazines/my-purchases` | protectUser | User's purchases |
| GET | `/api/magazines/:id/purchase/status` | protectUser | Check purchase status |
| POST | `/api/magazines/:id/purchase/manual` | protectUser, upload.single, verifyTurnstile | Manual UPI payment |
| POST | `/api/magazines/:id/purchase/razorpay/create-order` | protectUser | Create Razorpay order |
| POST | `/api/magazines/:id/purchase/razorpay/verify` | protectUser | Verify Razorpay signature |
| GET | `/api/magazines/:id/download/full` | protectUser | Download full magazine PDF |
| GET | `/api/magazines/:id/download/preview` | — | Download preview PDF |

### Drafts

| Method | Endpoint | Middleware | Description |
|--------|----------|-----------|-------------|
| GET | `/api/drafts` | — | List published drafts |
| POST | `/api/drafts` | protect, upload | Create draft |
| PUT | `/api/drafts/:id` | protect, upload | Update draft |
| DELETE | `/api/drafts/:id` | protect | Delete draft |
| POST | `/api/draft-purchases/:draftId` | protectUser, upload.single, verifyTurnstile | Purchase draft |
| GET | `/api/draft-purchases/my` | protectUser | User's draft purchases |
| GET | `/api/draft-purchases/check/:draftId` | protectUser | Check purchase status |
| GET | `/api/draft-purchases` | protect | Admin: all purchases |
| PUT | `/api/draft-purchases/:id` | protect | Approve/reject purchase |

### Courses

| Method | Endpoint | Middleware | Description |
|--------|----------|-----------|-------------|
| GET | `/api/courses/public` | — | List public courses |
| GET | `/api/courses/public/:id` | optionalUserAuth | Course detail with enrollment status |
| POST | `/api/courses/enroll` | protectUser | Enroll in free course |
| GET | `/api/courses/my-enrollments` | protectUser | User's enrollments |
| POST | `/api/courses/progress` | protectUser | Update lesson progress |
| POST | `/api/courses` | protect, upload | Admin: create course |
| PUT | `/api/courses/:id` | protect, upload | Admin: update course |

### Live Sessions

| Method | Endpoint | Middleware | Description |
|--------|----------|-----------|-------------|
| GET | `/api/live/current` | — | Current live status |
| GET | `/api/live/upcoming` | — | Upcoming sessions |
| GET | `/api/live/past` | — | Past sessions |
| GET | `/api/live/:id/join-url` | protectUser | Get meeting URL (auth-gated) |
| GET | `/api/live` | protect | Admin: all sessions |
| POST | `/api/live` | protect | Create session |
| PUT | `/api/live/:id` | protect | Update session |
| DELETE | `/api/live/:id` | protect | Delete session |
| POST | `/api/live/:id/announcements` | protect | Add announcement |
| DELETE | `/api/live/:id/announcements/:annId` | protect | Remove announcement |

### Content (Public Read)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | List active services |
| GET | `/api/blogs` | Paginated blogs |
| GET | `/api/blogs/:id` | Single blog |
| GET | `/api/faqs` | Active FAQs |
| GET | `/api/testimonials` | Approved testimonials |
| GET | `/api/news/active` | Active news items |
| GET | `/api/news/page` | Paginated news |
| GET | `/api/hero-banners` | Active hero banners |
| GET | `/api/youtube-videos` | YouTube links |
| GET | `/api/facebook-posts` | Facebook post links |
| GET | `/api/site-settings` | All site settings |
| GET | `/api/contact-details` | Contact information |
| POST | `/api/contacts` | Submit contact form |
| GET | `/api/gallery` | Gallery images list |
| GET | `/api/health` | Health check |

---

## 7. Controller Documentation

### authController.js
- **Purpose:** Admin authentication
- **login:** Finds admin by email, bcrypt compare, logs failures via securityLogger, returns JWT
- **getMe:** Returns `req.admin` populated by `protect` middleware
- **changePassword:** bcrypt compare old password, hash new, save

### userController.js
- **Purpose:** User auth + profile + notifications
- **register:** Creates user, issues access token + refresh cookie
- **login:** Validates credentials, logs failures, issues access token + refresh cookie
- **refreshToken:** Reads `rt` HttpOnly cookie via `parseCookieHeader`, calls `consumeRefreshToken`, issues new access token + new refresh cookie
- **logoutUser:** Revokes refresh token, clears cookie
- **forgotPassword:** Generates OTP, stores hashed OTP in user record, sends via WhatsApp
- **verifyOTP:** Checks OTP + expiry, returns reset token
- **resetPassword:** Validates reset token hash, updates password, increments `tokenVersion`

### appointmentController.js
- **Purpose:** Appointment booking with slot conflict detection
- **create:** Calls `withOptionalTransaction` → `isSlotTaken` → creates Appointment → sends WhatsApp confirmation → creates UserNotification
- **getAvailableSlots:** Returns all booked slots for a date
- **update:** Updates status, sends WhatsApp status notification

### paymentController.js / razorpayController.js
- **Purpose:** UPI manual payment + Razorpay integration
- **createManualPayment:** `withOptionalTransaction` wraps slot-check + Appointment.create; screenshot uploaded via Cloudinary
- **createBookManualPayment:** Creates BookOrder + Payment records
- **Razorpay:** Creates order via Razorpay SDK, verifies HMAC-SHA256 signature on payment

### magazineController.js / magazinePurchaseController.js
- **Purpose:** Magazine CRUD + purchase management
- **Manual purchase:** Creates MagazinePurchase with `pending` status
- **Razorpay purchase:** Creates order, verifies payment, sets status to `verified`
- **Download:** Checks purchase status before returning file URL

---

## 8. Database Documentation

### Admin
```
name: String (required)
email: String (required, unique)
password: String (hashed, select:false)
role: String (default: 'admin') — 'admin' | 'superAdmin'
isActive: Boolean (default: true)
lastLogin: Date
profilePhoto: String
timestamps: true
```

### User
```
name: String (required)
email: String (required, unique)
phone: String (required, unique)
password: String (hashed, bcrypt 12 rounds, select:false)
profilePhoto: String (Cloudinary URL)
isActive: Boolean (default: true)
lastLogin: Date
tokenVersion: Number (default: 0) — incremented to invalidate all JWTs
otp: String (select:false)
otpExpiry: Date (select:false)
resetPasswordToken: String (SHA-256 hashed, select:false)
resetPasswordExpiry: Date (select:false)
timestamps: true
```

### RefreshToken
```
tokenHash: String (SHA-256 of raw token, unique, indexed)
userId: ObjectId → User
family: String (hex, groups related tokens for reuse detection)
expiresAt: Date (TTL index — auto-deleted after expiry)
isRevoked: Boolean (default: false)
ip: String
userAgent: String
timestamps: true
```
**TTL Index:** `expiresAt` with `expireAfterSeconds: 0`

### SecurityLog
```
event: String (e.g. 'USER_LOGIN_FAILED', 'CAPTCHA_FAILED', 'ADMIN_LOGIN_FAILED')
level: String — 'info' | 'warn' | 'critical'
userId: ObjectId → User (optional)
ip: String
userAgent: String
details: Mixed
createdAt: Date (TTL index — auto-deleted after 90 days)
```
**TTL Index:** `createdAt` with `expireAfterSeconds: 7776000` (90 days)

### Appointment
```
name: String (required)
phone: String (required)
email: String
date: Date (required)
time: String (required)
service: String
message: String
status: String — 'pending' | 'confirmed' | 'cancelled' | 'completed'
userId: ObjectId → User (optional)
uniqueId: String (auto-generated, e.g. APT-XXXXXX)
paymentStatus: String
paymentId: ObjectId → Payment
timestamps: true
```
**Index:** `{ date, time, status }` for slot conflict queries

### Payment
```
name: String
phone: String
email: String
service: String
amount: Number
paymentMethod: String — 'upi_id' | 'qr_code'
utrNumber: String
screenshotUrl: String (Cloudinary URL)
status: String — 'pending' | 'verified' | 'rejected'
userId: ObjectId → User
appointmentId: ObjectId → Appointment
type: String — 'appointment' | 'book' | 'magazine' | 'course' | 'draft'
timestamps: true
```

### Book
```
title: String (required)
description: String
price: Number
coverImage: String (Cloudinary URL)
fileUrl: String (Cloudinary URL — PDF)
isPublished: Boolean
category: String
author: String
timestamps: true
```

### BookOrder
```
userId: ObjectId → User
bookId: ObjectId → Book
bookTitle: String
name: String (required)
phone: String (required)
address: String (required)
quantity: Number (default: 1)
amount: Number
paymentMethod: String
utrNumber: String
screenshotUrl: String
status: String — 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
orderId: String (unique, e.g. ORD-XXXXXX)
timestamps: true
```

### Magazine
```
title: String (required)
description: String
coverImage: String (Cloudinary)
previewFile: String (Cloudinary — partial PDF)
fullFile: String (Cloudinary — full PDF)
price: Number
isPublished: Boolean
category: String
issue: String
publishDate: Date
timestamps: true
```

### MagazinePurchase
```
userId: ObjectId → User (required)
magazineId: ObjectId → Magazine (required)
paymentMethod: String — 'manual' | 'razorpay'
status: String — 'pending' | 'verified' | 'rejected'
utrNumber: String
screenshotUrl: String
razorpayOrderId: String
razorpayPaymentId: String
amount: Number
timestamps: true
```

### Draft
```
title: String (required)
contentType: String — 'blog' | 'course' | 'magazine' | 'news' | 'facebook' | 'youtube'
accessType: String — 'free' | 'paid'
price: Number
thumbnail: String (Cloudinary)
contentDataJson: Mixed (file URL, description, etc.)
isPublished: Boolean
lastSavedAt: Date
timestamps: true
```

### DraftPurchase
```
userId: ObjectId → User
draftId: ObjectId → Draft
paymentMethod: String
utrNumber: String
screenshotUrl: String
status: String — 'pending' | 'verified' | 'rejected'
timestamps: true
```

### Course
```
title: String
description: String
thumbnail: String (Cloudinary)
price: Number (0 = free)
modules: [{ title, lessons: [{ title, videoUrl, duration, order }] }]
isPublished: Boolean
instructor: String
category: String
timestamps: true
```

### Enrollment
```
userId: ObjectId → User
courseId: ObjectId → Course
progress: [{ lessonId, completedAt }]
completedAt: Date
timestamps: true
```

### LiveSession
```
title: String
description: String
scheduledAt: Date
status: String — 'scheduled' | 'live' | 'ended'
meetUrl: String (hidden from public — auth-gated)
thumbnail: String
announcements: [{ text, createdAt }]
viewerCount: Number
timestamps: true
```

### LiveAuditLog
```
sessionId: ObjectId → LiveSession
action: String
adminId: ObjectId → Admin
details: Mixed
timestamps: true
```

### Blog
```
title: String
slug: String (auto-generated, unique)
content: String (rich text HTML)
excerpt: String
coverImage: String (Cloudinary)
isPublished: Boolean
publishedAt: Date
tags: [String]
timestamps: true
```

### Service
```
title: String
description: String
icon: String
isActive: Boolean
order: Number
timestamps: true
```

### SiteSettings
```
key: String (unique)
value: Mixed
group: String (e.g. 'contact', 'advocate', 'social', 'payment')
label: String
timestamps: true
```
**Key settings include:** `payment_upi_id`, `payment_qr_image`, `contact_phone`, `contact_email`, `advocate_name`, `advocate_bio`, social media links

### UserNotification
```
userId: ObjectId → User
title: String
message: String
type: String — 'appointment' | 'payment' | 'order' | 'general'
isRead: Boolean (default: false)
relatedId: ObjectId (ref to related document)
timestamps: true
```

### AuditLog
```
admin: ObjectId → Admin
action: String
resource: String
resourceId: ObjectId
details: Mixed
ip: String
timestamps: true
```

### JrAdvocate
```
name, email, phone, barCouncilNumber, experience, specialization,
resumeUrl (Cloudinary), coverLetter, status ('pending'|'reviewed'|'accepted'|'rejected')
timestamps: true
```

### Internship
```
title, description, requirements, duration, stipend, isActive
Applications: [{ name, email, phone, resumeUrl, coverLetter, status }]
timestamps: true
```

### Contact
```
name, email, phone, subject, message
status: String — 'new' | 'read' | 'replied'
timestamps: true
```

### HeroBanner
```
title, subtitle, image (Cloudinary), ctaText, ctaLink, isActive, order
timestamps: true
```

---

## 9. Authentication Flow

### Admin Authentication
```
POST /api/auth/login
  → authLimiter (10 req/15min)
  → authController.login
    → Admin.findOne({ email })
    → bcrypt.compare(password, admin.password)
    → on failure: securityLogger.warn('ADMIN_LOGIN_FAILED')
    → on success: generateToken(admin._id) — JWT, 7d expiry
    → return { token, admin }

All protected admin routes:
  → Authorization: Bearer <token>
  → protect middleware
    → jwt.verify(token, JWT_SECRET)
    → Admin.findById(decoded.id)
    → req.admin = admin
    → next()
```

### User Authentication
```
POST /api/users/register
  → User.create({ name, email, phone, password }) — password auto-hashed
  → generateUserToken(user) — JWT, 15m expiry
  → issueRefreshToken(userId, ip, userAgent) — SHA-256 hash stored in DB
  → setRefreshCookie(res, raw, expiresAt) — rt HttpOnly cookie
  → return { token, user }

POST /api/users/login
  → User.findOne({ email }).select('+password')
  → user.matchPassword(password) — bcrypt compare
  → on failure: securityLogger.warn('USER_LOGIN_FAILED')
  → check user.isActive
  → update user.lastLogin
  → generateUserToken(user) — JWT, 15m expiry
  → issueRefreshToken(userId) — new refresh token family
  → setRefreshCookie(res, raw)
  → return { token, user }
```

### Silent Token Refresh
```
Frontend (axios interceptor):
  → Any request returns 401
  → isRefreshing flag set, request queued
  → POST /api/users/refresh (withCredentials: true)
    → parseCookieHeader reads 'rt' from Cookie header
    → consumeRefreshToken(raw):
      → find by tokenHash
      → if isRevoked: revoke entire family → throw (reuse detected)
      → if expired: throw
      → mark old token isRevoked = true
      → find user, check isActive
      → return { user, family }
    → generateUserToken(user)
    → issueRefreshToken(userId, ip, ua, family) — same family, new token
    → setRefreshCookie(res, newRaw)
    → return { token }
  → retry all queued requests with new token
```

### Password Reset (OTP Flow)
```
POST /api/users/forgot-password
  → User.findOne({ email })
  → user.generateOTP() — 6-digit, 10-min expiry, stored hashed
  → send OTP via WhatsApp (Meta Cloud API)
  → return { message: 'OTP sent' }

POST /api/users/verify-otp
  → find user by email
  → compare OTP, check otpExpiry
  → user.generateResetToken() — 32-byte random, SHA-256 hashed stored
  → return { resetToken } — raw token sent to client

POST /api/users/reset-password
  → hash incoming resetToken with SHA-256
  → User.findOne({ resetPasswordToken: hash, resetPasswordExpiry: { $gt: now } })
  → set user.password = newPassword (triggers pre-save bcrypt hash)
  → user.tokenVersion += 1 — invalidates all existing JWTs
  → clear otp, resetToken fields
```

### tokenVersion Revocation
- Every user JWT carries `tv: user.tokenVersion`
- `protectUser` checks `decoded.tv !== user.tokenVersion` → 401 if mismatch
- Incremented on: password change, account deactivation by admin
- Effect: All previously issued access tokens immediately become invalid

---

## 10. Middleware Flow

### Request Pipeline Order (server.js)
```
Request
  → DNS resolve (Google 8.8.8.8)
  → Helmet (security headers: CSP, HSTS, referrerPolicy, CORP)
  → CORS (check origin against ALLOWED_ORIGINS, credentials: true)
  → Rate Limiter (1000/15min global on /api/)
  → Auth Rate Limiter (10/15min on /api/auth/ and /api/users/)
  → Cache-Control no-store headers
  → express.json() body parser (10MB limit)
  → express.urlencoded() body parser
  → Static /uploads serving
  → Route matching
  → Route-specific middleware (protect/protectUser/upload/turnstile)
  → Controller
  → Global error handler
```

### Helmet CSP Configuration
```
defaultSrc: 'self'
scriptSrc: 'self', challenges.cloudflare.com
styleSrc: 'self', 'unsafe-inline'
imgSrc: 'self', data:, res.cloudinary.com
connectSrc: 'self', challenges.cloudflare.com
frameSrc: 'self', challenges.cloudflare.com
fontSrc: 'self', data:
objectSrc: 'none'
upgradeInsecureRequests: []
```

### Turnstile Middleware (after multer)
```
Placement: AFTER upload.single() so multer parses FormData first
  → read TURNSTILE_SECRET_KEY env var
  → if missing in dev: warn + skip; in prod: 503
  → read req.body.turnstileToken
  → POST to challenges.cloudflare.com/turnstile/v0/siteverify
  → on success: next()
  → on failure: securityLogger.warn('CAPTCHA_FAILED') + 400
```

### upload.js (Cloudinary Storage)
```
Multer config:
  → CloudinaryStorage: folder='advocate-chauhan'
  → resource_type auto-detection: image/video/raw
  → image optimization: quality=auto, fetch_format=auto
  → allowed: jpeg,jpg,png,gif,webp,svg,pdf,mp4,mov,avi,doc,docx
  → max size: MAX_FILE_SIZE (default 20MB)
```

### validate.js
```
Reads validationResult(req) from express-validator
  → if errors: return 400 with first error message
  → else: next()
```

---

## 11. Payment Flow

### Manual UPI Payment (Appointment)
```
1. User fills AppointmentModal → sessionStorage('pendingAppointment')
2. Navigate to /payment
3. Payment.jsx reads sessionStorage, shows UPI ID / QR code
4. User pays externally via UPI app
5. User enters UTR number + optional screenshot
6. Turnstile CAPTCHA completes (auto-verified in managed mode)
7. POST /api/payments/manual
   → paymentSubmitLimiter (rate limit)
   → optionalUserAuth (attach user if logged in)
   → upload.single('screenshot') (Cloudinary upload)
   → verifyTurnstile (Cloudflare verify)
   → paymentController.createManualPayment:
     → withOptionalTransaction(session):
       → isSlotTaken(date, time, session) → 409 if taken
       → Appointment.create([data], { session })
       → Payment.create([data], { session })
     → createUserNotification (if user logged in)
     → send WhatsApp confirmation
8. Return { success, appointmentId, paymentId }
```

### Manual UPI Payment (Book Order)
```
1. OrderModal → sessionStorage('pendingBookOrder')
2. Navigate to /book-payment
3. POST /api/payments/book-manual
   → multer + turnstile + paymentController.createBookManualPayment
   → creates BookOrder + Payment records
   → WhatsApp notification to admin
```

### Manual UPI Payment (Draft)
```
1. Draft purchase modal in Drafts.jsx
2. POST /api/draft-purchases/:draftId
   → protectUser (must be logged in)
   → upload.single('screenshot')
   → verifyTurnstile
   → draftPurchaseController.create
   → creates DraftPurchase with status 'pending'
   → admin approves manually in dashboard
```

### Razorpay Payment (Magazine)
```
1. POST /api/magazines/:id/purchase/razorpay/create-order
   → protectUser
   → magazinePurchaseController: Razorpay.orders.create({ amount, currency, receipt })
   → return { orderId, amount, currency, keyId }

2. Frontend opens Razorpay checkout modal

3. On payment success from Razorpay:
   POST /api/magazines/:id/purchase/razorpay/verify
   → protectUser
   → verify HMAC-SHA256:
     expectedSignature = HMAC(razorpay_order_id + '|' + razorpay_payment_id, RAZORPAY_KEY_SECRET)
   → if match: MagazinePurchase.status = 'verified'
   → grant download access
```

### Payment Admin Verification (Manual)
```
Admin dashboard → Payments page
  → GET /api/payments (list all pending)
  → Admin reviews UTR + screenshot
  → PUT /api/payments/:id { status: 'verified' }
    → updates Payment record
    → updates linked Appointment/BookOrder status
    → creates UserNotification for user
    → sends WhatsApp confirmation
```

---

## 12. Cloudinary Flow

### Upload Flow
```
File received by multer → CloudinaryStorage intercepts
  → cloudinary.uploader.upload_stream()
  → folder: 'advocate-chauhan'
  → resource_type: auto-detected
  → images: transformation [{ quality: 'auto', fetch_format: 'auto' }]
  → Cloudinary returns: { secure_url, public_id, resource_type, format }
  → req.file.path = secure_url (stored in DB)
  → req.file.filename = public_id (used for deletion)
```

### Image URL Format
```
https://res.cloudinary.com/dovo1iala/image/upload/q_auto,f_auto/advocate-chauhan/<public_id>
```

### Folder Structure
```
Cloudinary root/
└── advocate-chauhan/
    ├── [images — book covers, magazine covers, blog covers, avatars, QR codes, screenshots]
    ├── [PDFs — draft files, magazine files, course materials]
    └── [videos — course videos]
```

### Deletion
- When admin deletes a file from the dashboard, the controller calls `cloudinary.uploader.destroy(public_id)`
- `public_id` is stored in the DB alongside `secure_url`

### Frontend mediaUrl Helper
```js
// advocate-user-website/src/utils/helpers.js
export const API_BASE = import.meta.env.VITE_API_BASE?.replace('/api', '') || 'http://localhost:5000';
export function mediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path; // Already a Cloudinary URL
  return `${API_BASE}${path}`; // Legacy local path
}
```

---

## 13. WhatsApp Notification Flow

### Service Used
Meta WhatsApp Cloud API (not Twilio — no Twilio in this project)

### Environment Variables
```
WHATSAPP_ACCESS_TOKEN=   ← Permanent system user token from Meta Business
WHATSAPP_PHONE_NUMBER_ID= ← WhatsApp Business phone number ID
ADMIN_WHATSAPP=91XXXXXXXXXX ← Admin's WhatsApp number to receive notifications
```

### Notification Triggers
| Event | Recipient | Message Content |
|-------|-----------|----------------|
| Appointment booked | Admin | Name, phone, date, time, service |
| Appointment status changed | User (if phone provided) | New status, appointment ID |
| Book order placed | Admin | Order details, delivery address |
| Payment verified | User | Confirmation message |
| OTP for password reset | User | 6-digit OTP |

### API Call Pattern
```
POST https://graph.facebook.com/v17.0/{WHATSAPP_PHONE_NUMBER_ID}/messages
Authorization: Bearer {WHATSAPP_ACCESS_TOKEN}
{
  messaging_product: 'whatsapp',
  to: '91XXXXXXXXXX',
  type: 'text',
  text: { body: 'message text' }
}
```

---

## 14. Environment Variables

### Backend (`backend/.env`)

| Variable | Purpose | Used In |
|----------|---------|---------|
| `PORT` | Express listen port (default 5000) | server.js |
| `NODE_ENV` | `development` or `production` | server.js, userAuth.js, upload.js |
| `MONGO_URI` | MongoDB Atlas connection string | server.js |
| `JWT_SECRET` | Signs both admin and user JWTs | auth.js, userAuth.js |
| `JWT_EXPIRE` | Admin token expiry (default `7d`) | auth.js |
| `USER_JWT_EXPIRE` | User access token expiry (default `15m`) | userAuth.js |
| `USER_REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime (default `30`) | userAuth.js |
| `ADMIN_EMAIL` | Default admin email (seed) | seed.js |
| `ADMIN_PASSWORD` | Default admin password (seed) | seed.js |
| `ADMIN_NAME` | Default admin name (seed) | seed.js |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account identifier | upload.js |
| `CLOUDINARY_API_KEY` | Cloudinary API key | upload.js |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | upload.js |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile server secret | turnstile.js |
| `TURNSTILE_STRICT` | If `true`, fail-closed on CAPTCHA errors | turnstile.js |
| `WHATSAPP_ACCESS_TOKEN` | Meta Cloud API permanent token | appointmentController, userController |
| `WHATSAPP_PHONE_NUMBER_ID` | WhatsApp Business phone ID | appointmentController, userController |
| `ADMIN_WHATSAPP` | Admin's WhatsApp number | appointmentController |
| `RAZORPAY_KEY_ID` | Razorpay public key | razorpayController |
| `RAZORPAY_KEY_SECRET` | Razorpay secret (for HMAC verification) | razorpayController, magazinePurchaseController |
| `ALLOWED_ORIGINS` | Comma-separated CORS allowed origins | server.js |
| `MAX_FILE_SIZE` | Upload size limit in bytes (default 20MB) | upload.js |
| `EMAIL_USER` | Gmail address for email sending | userController (optional) |
| `EMAIL_PASS` | Gmail app password | userController (optional) |

### User Website (`advocate-user-website/.env.production`)

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE` | Backend API URL (e.g. `https://advocatechauhan-fqgugda3cgd3e6fp.southindia-01.azurewebsites.net/api`) |
| `VITE_TURNSTILE_SITE_KEY` | Cloudflare Turnstile public site key |

---

## 15. External Services

| Service | Provider | Used For | Config Location |
|---------|---------|---------|----------------|
| **MongoDB Atlas** | MongoDB Inc. | Primary database (all collections) | `MONGO_URI` |
| **Cloudinary** | Cloudinary Ltd. | Permanent file storage — images, PDFs, videos | `CLOUDINARY_*` env vars |
| **WhatsApp Cloud API** | Meta | Appointment confirmations, OTP delivery, order notifications | `WHATSAPP_*` env vars |
| **Razorpay** | Razorpay Pvt Ltd | Online payments for magazines | `RAZORPAY_*` env vars |
| **Cloudflare Turnstile** | Cloudflare | CAPTCHA on all payment forms | `TURNSTILE_*` env vars + `VITE_TURNSTILE_SITE_KEY` |
| **GitHub Pages** | GitHub | Frontend hosting (user website + admin panel) | gh-pages branch |
| **Render** | Render Inc. | Backend Node.js hosting | Environment vars in Render dashboard |
| **Google Fonts** | Google | Playfair Display + Inter | `index.html` link tag |
| **Font Awesome** | Fonticons | Icons (self-hosted — no CDN) | `public/fa-all.min.css` |

---

## 16. Deployment Configuration

### Backend (`backend/package.json`)
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "seed": "node scripts/seed.js"
  }
}
```

### Render Configuration
```
Root Directory: backend
Build Command:  npm install
Start Command:  node server.js
Node Version:   18+
Health Check:   GET /api/health
Environment:    All backend env vars (see Section 14)
```

### GitHub Actions (Deploy to GitHub Pages)
```yaml
# Triggered on push to main
# Runs: npm install → npm run build → npx gh-pages -d dist
# Deploys built /dist to gh-pages branch
```

### Manual Frontend Deploy
```bash
cd advocate-user-website
npm run build
npx gh-pages -d dist
```

### Vite Config
```js
// advocate-user-website/vite.config.js
base: '/ChauhanAdvocate'   ← GitHub Pages subdirectory
```

### React Router
```js
// App.jsx
<BrowserRouter basename="/ChauhanAdvocate">
```

### SPA 404 Redirect (GitHub Pages)
```js
// index.html — inline script
// Converts /ChauhanAdvocate/some-path → /?/some-path
// then React Router reads it back
```

---

## 17. Frontend Build Flow

```bash
cd advocate-user-website

# Install
npm install

# Development
npm run dev
# → vite dev server at http://localhost:5173
# → VITE_API_BASE from .env (local backend)
# → Turnstile CAPTCHA skipped (no secret key in dev)

# Production Build
npm run build
# → vite build
# → reads .env.production
# → VITE_* vars embedded as string literals in bundle
# → outputs to dist/
# → index.html + assets/index-[hash].js + assets/index-[hash].css

# Deploy
npx gh-pages -d dist
# → pushes dist/ to gh-pages branch directly (bypasses GitHub Actions)
```

### Build Output
```
dist/
├── index.html              (3.4 KB)
├── assets/
│   ├── index-[hash].js     (~514 KB, ~141 KB gzipped)
│   └── index-[hash].css    (~104 KB, ~19 KB gzipped)
├── bootstrap.min.css       (self-hosted)
├── fa-all.min.css          (self-hosted Font Awesome)
├── bootstrap.bundle.min.js
├── aos.css / aos.js
└── [images, logo, favicon]
```

---

## 18. Backend Startup Flow

```
node server.js
│
├── dns.setServers(['8.8.8.8', '8.8.4.4'])   ← Force Google DNS
├── require('dotenv').config()                ← Load .env
├── app = express()
├── app.set('trust proxy', 1)                ← Render proxy
├── app.use(helmet({...}))                   ← Security headers
├── app.use(cors({...}))                     ← CORS with credentials
├── app.use(limiter)                         ← Rate limit /api/
├── app.use(authLimiter)                     ← Rate limit auth routes
├── app.use(express.json({ limit: '10mb' }))
├── app.use('/uploads', express.static(...)) ← Static file serving
├── mkdir uploads/* if not exist             ← Ensure dirs for local uploads
├── mongoose.connect(MONGO_URI)              ← MongoDB Atlas connection
├── app.use('/api/auth', ...)               ← Register 29 route groups
├── ...all routes...
├── app.get('/api/health', ...)             ← Health check
├── app.get('/api/gallery', ...)            ← Gallery listing
├── app.use(globalErrorHandler)             ← 500 handler
├── app.use(404Handler)                     ← 404 catch-all
└── app.listen(PORT)                        ← Start server
```

**No cron jobs. No WebSockets. No job queues.**

---

## 19. Complete Request Lifecycle

```
Browser
  │
  ▼
React Page (e.g. Payment.jsx)
  │  user clicks Submit Payment
  │
  ▼
TurnstileWidget.onVerify → sets turnstileToken state
  │
  ▼
Axios Request (advocate-user-website/src/api/axios.js)
  │  Request Interceptor:
  │    → reads userToken from localStorage
  │    → sets Authorization: Bearer <token>
  │
  ▼
HTTPS → advocatechauhan-fqgugda3cgd3e6fp.southindia-01.azurewebsites.net/api/payments/manual
  │
  ▼
Express Server (backend/server.js)
  │
  ├── Helmet → adds security headers to response
  ├── CORS → checks origin header
  ├── Rate Limiter → checks request count
  ├── Cache-Control headers added
  ├── Body Parser → parses JSON / multipart FormData
  │
  ▼
Route: POST /api/payments/manual (backend/routes/payments.js)
  │
  ├── paymentSubmitLimiter (5 req/hour per IP)
  ├── optionalUserAuth → verifies JWT if present, sets req.user
  ├── upload.single('screenshot') → multer → Cloudinary → req.file.path
  ├── verifyTurnstile → Cloudflare siteverify → next() or 400
  │
  ▼
paymentController.createManualPayment (backend/controllers/paymentController.js)
  │
  ├── withOptionalTransaction(async (session) => {
  │     isSlotTaken(date, time, session) → query Appointment collection
  │     if taken: throw { slotTaken: true } → 409
  │     Appointment.create([...], { session })
  │     Payment.create([...], { session })
  │   })
  ├── UserNotification.create(...)  ← if user logged in
  ├── WhatsApp API call             ← Meta Cloud API
  │
  ▼
Response: { success: true, appointmentId, paymentId }
  │
  ▼
Axios Response Interceptor
  │  if 200: resolve
  │  if 401: → POST /users/refresh → retry original request
  │
  ▼
React State Update
  │  setScreen('success') → show success UI
  │
  ▼
Browser renders success screen
```

---

## 20. Feature Dependency Map

```
Appointments
├── User (optional link — guest bookings allowed)
├── Payment (created together in transaction)
├── WhatsApp (confirmation to admin)
├── UserNotification (if user logged in)
└── slotUtils (conflict detection + transaction wrapper)

Payment
├── Appointment (for appointment payments)
├── BookOrder (for book payments)
├── Cloudinary (screenshot upload)
├── Turnstile (CAPTCHA verification)
└── User (optional)

User Auth
├── RefreshToken (rotation + reuse detection)
├── SecurityLog (login failure tracking)
├── UserNotification (in-app alerts)
└── WhatsApp (OTP delivery)

Magazines
├── MagazinePurchase
├── Razorpay (online payment)
├── Turnstile (manual payment)
├── Cloudinary (cover + PDF files)
└── User (required for purchase)

Drafts
├── DraftPurchase
├── Turnstile (purchase form)
├── Cloudinary (template files)
└── User (required for purchase)

Courses
├── Enrollment
├── Cloudinary (video + thumbnail)
└── User (required for enrollment)

LiveSessions
├── LiveAuditLog
└── User (required to get meetUrl)

Admin Auth
├── AuditLog (admin action tracking)
└── SecurityLog (login failures)
```

---

## 21. Security Architecture

| Layer | Implementation |
|-------|---------------|
| **Transport** | HTTPS enforced via Render + HSTS header (1 year, preload) |
| **Content Security Policy** | Strict CSP via Helmet — blocks inline scripts, external CDNs except Cloudflare |
| **CORS** | Allowlist-based with credentials; only `ashritha-d.github.io` in production |
| **Rate Limiting** | 1000 req/15min global; 10 req/15min on auth endpoints |
| **Admin JWT** | 7-day access token, no refresh (admin sessions expire naturally) |
| **User JWT** | 15-minute access token — very short-lived |
| **Refresh Tokens** | HttpOnly + Secure + SameSite=none cookies; SHA-256 hashed in DB; 30-day TTL; family-based reuse detection; automatic full-family revocation on reuse |
| **Token Revocation** | `tokenVersion` field on User — incrementing immediately invalidates all JWTs |
| **CAPTCHA** | Cloudflare Turnstile on all public payment endpoints (appointment, book, magazine, draft) |
| **File Uploads** | Allowlist of extensions; 20MB limit; stored on Cloudinary (not local disk in prod) |
| **Security Logging** | `SecurityLog` collection with 90-day TTL for login failures and CAPTCHA failures |
| **Password Hashing** | bcrypt with 12 rounds |
| **OTP** | 6-digit, 10-minute expiry, stored hashed |
| **Reset Tokens** | SHA-256 hashed before DB storage; 15-minute expiry |
| **Meet URL** | Live session join URLs are auth-gated — `protectUser` required |
| **DNS** | Hardcoded Google DNS (8.8.8.8) prevents Render DNS failures on external API calls |

---

## 22. Hosting Migration Checklist

### Moving from Render to Railway / DigitalOcean / VPS

#### Environment Variables
- [ ] Copy all env vars from Render dashboard to new platform
- [ ] Verify `NODE_ENV=production` is set
- [ ] Update `ALLOWED_ORIGINS` to include any new frontend URLs
- [ ] Verify `MONGO_URI` Atlas connection string still works from new IP (whitelist new IP in Atlas)

#### Build & Start
- [ ] Root directory: `backend/`
- [ ] Build command: `npm install`
- [ ] Start command: `node server.js`
- [ ] Node.js version: 18+

#### Port
- [ ] Railway/DO auto-assigns PORT — confirm `process.env.PORT` is used (it is)
- [ ] Health check endpoint: `GET /api/health`

#### Database (MongoDB Atlas)
- [ ] Whitelist new server IP in Atlas Network Access
- [ ] Or use `0.0.0.0/0` (allow all — less secure)
- [ ] Test connection on first deploy

#### File Uploads / Storage
- [ ] Cloudinary config carries over via env vars — no migration needed
- [ ] `uploads/` directory is ephemeral on all cloud platforms — Cloudinary handles prod storage
- [ ] Local uploads (gallery) may need migration if any exist

#### SSL / HTTPS
- [ ] Railway: automatic SSL
- [ ] DigitalOcean App Platform: automatic SSL
- [ ] VPS: Set up Certbot / Let's Encrypt + Nginx reverse proxy

#### Custom Domain
- [ ] Update `ALLOWED_ORIGINS` env var on backend
- [ ] Update `VITE_API_BASE` in frontend `.env.production` + rebuild + redeploy frontend
- [ ] Update CORS on Render (remove old URL if moving away)

#### Razorpay
- [ ] No webhook configured — signature verification is done client-side POST
- [ ] No callback URL change needed

#### Cloudflare Turnstile
- [ ] Widget hostname allowlist in Cloudflare dashboard — add new domain if backend changes
- [ ] Frontend domain (GitHub Pages) already allowed — no change if frontend stays

#### WhatsApp / Meta API
- [ ] Access token is permanent — no change needed
- [ ] Test a notification after deploy

#### Reverse Proxy (VPS only)
```nginx
server {
  listen 80;
  server_name api.yourdomain.com;
  location / {
    proxy_pass http://localhost:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

#### After Deploy
- [ ] Test `GET /api/health` — should return `{ status: 'ok' }`
- [ ] Test admin login
- [ ] Test user login + token refresh (check browser cookies)
- [ ] Test appointment booking (slot detection + WhatsApp)
- [ ] Test file upload (Cloudinary)
- [ ] Test Turnstile CAPTCHA on payment form
- [ ] Check security headers: `curl -I https://your-api.com/api/health`

---

## 23. Deployment Commands

### Backend (Railway)
```bash
# Railway detects Node.js automatically
# Set environment variables in Railway dashboard
# Deploy: push to main branch (auto-deploy) or
railway up
```

### Backend (DigitalOcean App Platform)
```bash
# Connect GitHub repo in DigitalOcean dashboard
# Source: backend/ folder
# Build: npm install
# Run: node server.js
```

### Backend (VPS / Ubuntu)
```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repo
git clone https://github.com/ashritha-d/ChauhanAdvocate.git
cd ChauhanAdvocate/backend

# Install dependencies
npm install

# Set environment variables
nano .env  # paste all env vars

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name advocate-backend

# Auto-start on reboot
pm2 save
pm2 startup

# Check logs
pm2 logs advocate-backend

# Restart after code update
git pull && pm2 restart advocate-backend
```

### Frontend (GitHub Pages)
```bash
cd advocate-user-website
npm install
npm run build
npx gh-pages -d dist
# → Published to https://ashritha-d.github.io/ChauhanAdvocate/
```

### Frontend (Cloudflare Pages — recommended migration)
```bash
# Connect GitHub repo in Cloudflare Pages dashboard
# Build settings:
#   Framework: Vite
#   Build command: npm run build
#   Output directory: dist
#   Root directory: advocate-user-website
# Environment variables: VITE_API_BASE, VITE_TURNSTILE_SITE_KEY
```

### Database Seed (first time setup)
```bash
cd backend
npm run seed
# Creates: default admin user, 6 services, 6 FAQs, 5 testimonials
```

---

## 24. Complete Architecture Report

### System Architecture
```
                    ┌─────────────────────────┐
                    │   Cloudflare (CDN/CAPTCHA)│
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
     ┌────────▼─────────┐  ┌────▼──────────┐  ┌───▼──────────────┐
     │  User Website     │  │ Admin Panel   │  │   Backend API     │
     │  React + Vite     │  │ React + Vite  │  │   Node.js/Express │
     │  GitHub Pages     │  │ GitHub Pages  │  │   Render          │
     └──────────────────┘  └───────────────┘  └───────┬──────────┘
                                                       │
                           ┌───────────────────────────┼─────────────┐
                           │                           │             │
                  ┌────────▼────────┐    ┌─────────────▼──┐  ┌──────▼──────┐
                  │  MongoDB Atlas   │    │   Cloudinary    │  │  Meta Cloud │
                  │  (Database)      │    │  (File Storage) │  │  (WhatsApp) │
                  └─────────────────┘    └────────────────┘  └─────────────┘
                                                                  │
                                                         ┌────────▼────────┐
                                                         │    Razorpay      │
                                                         │   (Payments)     │
                                                         └─────────────────┘
```

### API Architecture
- **Pattern:** MVC (Model-View-Controller) with Express Router
- **29 route groups**, each mapped to a controller
- **Middleware chain:** auth → upload → turnstile → controller
- **Response format:** `{ success: Boolean, data/message/error }`

### Database Architecture
- **33 Mongoose models** covering every business domain
- **TTL indexes:** SecurityLog (90 days), RefreshToken (30 days)
- **Unique indexes:** User.email, User.phone, RefreshToken.tokenHash, Blog.slug
- **Transaction support:** `withOptionalTransaction` with Atlas M0 fallback

### Authentication Architecture
- **Two separate auth systems:** Admin (7d JWT, no refresh) + User (15m JWT + 30d HttpOnly refresh cookie)
- **Refresh token rotation:** Family-based reuse detection
- **TokenVersion revocation:** Instant invalidation without token blacklist

### Payment Architecture
- **Manual UPI:** All payment forms → UTR + screenshot → admin verification → status update
- **Razorpay:** Order creation → checkout → HMAC signature verification → grant access
- **CAPTCHA gate:** Turnstile on all public payment endpoints

### Security Architecture
- **8-layer security:** DNS → Helmet → CORS → Rate Limit → Auth → CAPTCHA → Upload → Logging
- **Zero stored plaintext secrets:** Passwords bcrypt(12), tokens SHA-256 hashed
- **Immediate revocation:** tokenVersion field

### Hosting Architecture (Current)
| Component | Platform | Cost |
|-----------|---------|------|
| User Website | GitHub Pages | Free |
| Admin Panel | GitHub Pages | Free |
| Backend API | Render (free tier) | Free |
| Database | MongoDB Atlas M0 | Free |
| File Storage | Cloudinary (free tier) | Free |
| CAPTCHA | Cloudflare Turnstile | Free |
| **Total** | | **$0/month** |

### Migration Guide (Render → Railway)
1. Create Railway project, connect `ChauhanAdvocate` repo
2. Set source to `backend/` subfolder
3. Copy all 20 environment variables from Render to Railway
4. Whitelist Railway's outbound IP in MongoDB Atlas
5. Railway auto-deploys on push to main
6. Update `ALLOWED_ORIGINS` if needed
7. Test health check: `GET https://your-railway-url.railway.app/api/health`
8. No code changes required — Railway runs `node server.js` automatically
