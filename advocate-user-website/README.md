# advocate-user-website

Modern, fully dynamic public-facing website for Advocate Chauhan built with React. All content is served from the backend API — any changes in the admin panel instantly reflect here.

## Live Demo

> Deploy to Vercel: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## Tech Stack

- **Framework:** React 18 + Vite
- **Styling:** Bootstrap 5 + Custom CSS
- **HTTP Client:** Axios
- **Routing:** React Router v6
- **Animations:** AOS (Animate on Scroll)
- **Icons:** Font Awesome 6

## Features

- Fully dynamic content via REST API
- Responsive design (mobile-first)
- Smooth scroll animations
- Appointment booking form
- Contact form
- Blog with modal reader
- Testimonials slider with auto-play
- FAQ accordion
- WhatsApp floating button
- Back-to-top button
- SEO meta tags from settings
- Graceful fallback content when API is offline

## Project Structure

```
advocate-user-website/
├── public/
├── src/
│   ├── api/
│   │   ├── axios.js          # Axios instance
│   │   └── index.js          # All API calls
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Hero.jsx
│   │   ├── About.jsx
│   │   ├── Services.jsx
│   │   ├── Profile.jsx
│   │   ├── Testimonials.jsx
│   │   ├── FAQs.jsx
│   │   ├── Blogs.jsx
│   │   ├── BlogModal.jsx
│   │   ├── Appointment.jsx
│   │   ├── Contact.jsx
│   │   ├── Footer.jsx
│   │   ├── WhatsAppButton.jsx
│   │   └── BackToTop.jsx
│   ├── context/
│   │   └── SiteContext.jsx   # Global site settings state
│   ├── pages/
│   │   ├── Home.jsx
│   │   └── PrivacyPolicy.jsx
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
git clone https://github.com/YOUR_USERNAME/advocate-user-website.git
cd advocate-user-website
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

For production, set this to your deployed backend URL:

```env
VITE_API_BASE=https://your-backend.onrender.com/api
```

### 3. Start development server

```bash
npm run dev
```

Runs on **http://localhost:3000**

### 4. Build for production

```bash
npm run build
npm run preview
```

## Deployment (Vercel)

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Set environment variable: `VITE_API_BASE=https://your-backend-url/api`
4. Deploy — Vercel auto-detects Vite

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_BASE` | Backend API base URL |

## Connected Services

- **Backend API:** `advocate-backend-api` — must be running
- **Admin Panel:** `advocate-admin-panel` — manages all content shown here

---

Made with ❤️ for Justice
