# advocate-backend-api

Centralized REST API server for the Advocate Chauhan web platform. Powers both the public user website and the admin panel.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT + bcryptjs
- **File Upload:** Multer
- **Security:** Helmet, CORS, express-rate-limit

## Features

- JWT-protected admin routes
- File upload with Multer
- Rate limiting on all API and auth routes
- Full CRUD for all content models
- MongoDB Atlas compatible

## Project Structure

```
backend/
├── controllers/        # Route handler logic
├── middleware/         # Auth, upload, validation
├── models/             # Mongoose schemas
├── routes/             # Express routers
├── scripts/
│   └── seed.js         # Database seeder
├── uploads/            # Uploaded media files
├── .env                # Environment variables (not committed)
├── .env.example        # Template for env vars
└── server.js           # Entry point
```

## API Endpoints

| Resource | Public | Protected |
|---|---|---|
| `GET /api/site-settings` | ✓ | — |
| `PUT /api/site-settings` | — | ✓ Admin |
| `GET /api/services` | ✓ | — |
| `POST/PUT/DELETE /api/services` | — | ✓ Admin |
| `GET /api/blogs` | ✓ | — |
| `GET /api/blogs/admin/all` | — | ✓ Admin |
| `POST/PUT/DELETE /api/blogs` | — | ✓ Admin |
| `GET /api/testimonials` | ✓ | — |
| `GET /api/faqs` | ✓ | — |
| `POST /api/appointments` | ✓ (public) | — |
| `GET /api/appointments` | — | ✓ Admin |
| `POST /api/contacts` | ✓ (public) | — |
| `GET /api/contacts` | — | ✓ Admin |
| `GET /api/hero-banners` | ✓ | — |
| `POST /api/upload` | — | ✓ Admin |
| `POST /api/auth/login` | ✓ | — |
| `GET /api/health` | ✓ | — |

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/advocate-backend-api.git
cd advocate-backend-api
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/advocate_chauhan
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
ADMIN_EMAIL=admin@advocatechauhan.com
ADMIN_PASSWORD=yourpassword
ADMIN_NAME=Admin
```

### 3. Seed the database

```bash
node scripts/seed.js
```

### 4. Start the server

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

Server runs on `http://localhost:5000`

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default 5000) |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRE` | JWT expiry duration |
| `NODE_ENV` | `development` or `production` |
| `ADMIN_EMAIL` | Initial admin email |
| `ADMIN_PASSWORD` | Initial admin password |

## Deployment

Deploy to **Render** or **Railway**:

1. Set all environment variables in the platform dashboard
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Connect MongoDB Atlas (ensure IP `0.0.0.0/0` is whitelisted)

## Connected Apps

- **User Website:** `advocate-user-website` — reads public endpoints
- **Admin Panel:** `advocate-admin-panel` — reads/writes protected endpoints

---

Made with ❤️ for Justice
