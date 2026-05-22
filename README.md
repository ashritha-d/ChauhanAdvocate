# ChauhanAdvocate

Full-stack Advocate / Lawyer Management System — public website, admin dashboard, and REST API backend.

## Project Structure

```
ChauhanAdvocate/
├── backend/                 ← Node.js + Express + MongoDB REST API (port 5000)
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/seed.js
│   ├── uploads/
│   ├── server.js
│   └── .env.example
├── advocate-user-website/   ← React public website (port 3000)
│   └── src/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── api/
└── advocate-admin-panel/    ← React admin dashboard (port 3001)
    └── src/
        ├── components/
        ├── context/
        ├── pages/
        └── api/
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- A modern web browser
- Live Server extension (VS Code) or any HTTP server

---

## Installation & Setup

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

The `.env` file is already created with defaults. Edit as needed:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/advocate_chauhan
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
NODE_ENV=development
ADMIN_EMAIL=admin@advocatechauhan.com
ADMIN_PASSWORD=Admin@123456
ADMIN_NAME=Admin
```

### 3. Start MongoDB

Make sure MongoDB is running locally:
```bash
# Windows
net start MongoDB

# Or start mongod directly
mongod
```

### 4. Seed the Database

```bash
cd backend
npm run seed
```

This creates:
- Admin user
- 6 default services
- 6 default FAQs
- 5 testimonials

### 5. Start the Backend Server

```bash
cd backend
npm run dev    # Development (with nodemon auto-restart)
# or
npm start      # Production
```

Server runs at: `http://localhost:5000`

### 6. Seed Site Settings

After server starts, visit:
```
http://localhost:5000/api/site-settings/seed
```

### 7. Open Frontend

Open `frontend/index.html` with Live Server (VS Code) or any HTTP server.

**VS Code Live Server:** Right-click `index.html` → "Open with Live Server"

### 8. Open Admin Panel

Open `admin/index.html` with Live Server.

**Default Admin Credentials:**
- Email: `admin@advocatechauhan.com`
- Password: `Admin@123456`

---

## API Endpoints

### Public (No Auth Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/services` | Get active services |
| GET | `/api/blogs` | Get published blogs |
| GET | `/api/blogs/:id` | Get single blog |
| GET | `/api/testimonials` | Get approved testimonials |
| GET | `/api/faqs` | Get active FAQs |
| GET | `/api/site-settings` | Get all site settings |
| POST | `/api/appointments` | Book appointment |
| POST | `/api/contacts` | Submit contact form |

### Protected (JWT Token Required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get admin profile |
| PUT | `/api/auth/profile` | Update profile |
| PUT | `/api/auth/change-password` | Change password |
| GET/POST/PUT/DELETE | `/api/services/*` | Manage services |
| GET/POST/PUT/DELETE | `/api/blogs/*` | Manage blogs |
| GET/POST/PUT/DELETE | `/api/testimonials/*` | Manage testimonials |
| GET/POST/PUT/DELETE | `/api/faqs/*` | Manage FAQs |
| GET/PUT/DELETE | `/api/appointments/*` | Manage appointments |
| GET/PUT/DELETE | `/api/contacts/*` | Manage contacts |
| GET/PUT | `/api/site-settings` | Manage site settings |
| POST | `/api/upload` | Upload image |

---

## Features

### Frontend
- Responsive single-page design with smooth scroll
- Dynamic content loaded from backend APIs
- Hero section with animated particles
- Services, About, Profile, Testimonials carousel
- Appointment booking form with validation
- Contact form with real-time feedback
- FAQ accordion
- Blog section with modal reader and load-more
- WhatsApp floating button
- Back to top button
- AOS scroll animations
- Bootstrap 5 responsive grid

### Admin Dashboard
- Secure JWT-based login
- Dashboard with analytics cards
- Full CRUD for: Services, Blogs, Testimonials, FAQs
- Appointment management with status updates
- Contact/Message inbox with status tracking
- Site settings management (all text/images editable)
- Rich text editor (Quill.js) for blog content
- Image upload support
- Responsive sidebar navigation

### Backend
- Express.js REST API
- MongoDB with Mongoose ODM
- JWT authentication
- bcrypt password hashing
- Rate limiting (prevent abuse)
- Helmet security headers
- Input validation with express-validator
- Multer file upload
- MVC architecture

---

## Customization

### Change Advocate Details
1. Log in to admin: `admin/index.html`
2. Go to **Site Settings**
3. Update "Advocate" group fields (name, designation, bio, photo)
4. Save settings

### Add Services
Admin → Services → Add Service

### Update Contact Info
Admin → Site Settings → Contact group

### Publish a Blog Post
Admin → Blog → New Post → Check "Published" → Save

---

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Use MongoDB Atlas for cloud database
4. Deploy backend on Heroku/Railway/Render/VPS
5. Update `API_BASE` in `frontend/js/main.js` and `admin/js/admin.js` to your deployed backend URL
6. Serve frontend on Netlify/Vercel or same server

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Bootstrap 5, JavaScript (ES6+) |
| Animations | AOS.js, CSS animations |
| Icons | Font Awesome 6 |
| Fonts | Google Fonts (Playfair Display + Inter) |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| Auth | JWT + bcrypt |
| Rich Text | Quill.js |
| File Upload | Multer |
| Security | Helmet, express-rate-limit |

---

## Support

For issues or customization requests, review the code structure and API documentation above.
