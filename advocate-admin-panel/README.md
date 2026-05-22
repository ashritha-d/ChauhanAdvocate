# advocate-admin-panel

Secure, feature-rich admin dashboard for the Advocate Chauhan platform. Manage all website content — any change instantly reflects on the live user website.

## Live Demo

> Deploy to Vercel: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Tech Stack

- **Framework:** React 18 + Vite
- **Styling:** Bootstrap 5 + Custom CSS
- **HTTP Client:** Axios (with JWT interceptors)
- **Rich Text Editor:** React Quill
- **Icons:** Font Awesome 6

## Features

### Authentication
- JWT login with persistent session
- Auto-redirect to login on token expiry
- Secure password change

### Dashboard
- Live stats: appointments, contacts, services, blogs
- Recent appointments table
- Recent inquiry list

### Content Management
| Module | Capabilities |
|---|---|
| **Site Settings** | Site name, tagline, hero text, advocate profile, contact info, social links, stats, SEO |
| **Hero Banners** | Create/edit/delete hero section banners with images |
| **Services** | Full CRUD with icon picker, feature tags, active/featured toggle |
| **Blogs** | Rich text editor, cover image upload, category, author, publish/draft |
| **Testimonials** | Add client reviews with photo upload, approve/feature toggle |
| **FAQs** | Ordered FAQ management with category tags |
| **Appointments** | View all bookings, update status (pending/confirmed/completed/cancelled) |
| **Contacts** | Read inquiries, mark as read, reply via email |
| **Profile** | Update name, change password |

## Project Structure

```
advocate-admin-panel/
├── src/
│   ├── api/
│   │   ├── axios.js          # Axios instance with JWT interceptor
│   │   └── index.js          # All API call functions
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   ├── ConfirmModal.jsx
│   │   └── ImageUpload.jsx
│   ├── context/
│   │   └── AuthContext.jsx   # Auth state + login/logout
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── SiteSettings.jsx
│   │   ├── HeroBanners.jsx
│   │   ├── Services.jsx
│   │   ├── Blogs.jsx
│   │   ├── Testimonials.jsx
│   │   ├── FAQs.jsx
│   │   ├── Appointments.jsx
│   │   ├── Contacts.jsx
│   │   └── Profile.jsx
│   ├── utils/
│   │   └── helpers.js
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .env
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/advocate-admin-panel.git
cd advocate-admin-panel
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_BASE=http://localhost:5000/api
```

### 3. Start development server

```bash
npm run dev
```

Runs on **http://localhost:3001**

### 4. Default admin credentials

> Set in `advocate-backend-api/.env` before seeding

```
Email:    admin@advocatechauhan.com
Password: admin123
```

### 5. Build for production

```bash
npm run build
```

## Deployment (Vercel)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Set environment variable: `VITE_API_BASE=https://your-backend-url/api`
4. Deploy

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_BASE` | Backend API base URL |

## Security Notes

- All admin routes require a valid JWT (`Authorization: Bearer <token>`)
- Token is stored in `localStorage` and sent via Axios interceptor
- Auto-logout on 401 responses
- Rate limiting is enforced on the backend auth endpoint

## Connected Services

- **Backend API:** `advocate-backend-api` — must be running
- **User Website:** `advocate-admin-panel` — changes made here reflect there

---

Made with ❤️ for Justice
