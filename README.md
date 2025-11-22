# Public Space - Complete Project (Frontend + Backend)

This package contains a ready-to-run full-stack app implementing the Public Space rules you requested and working auth + friend management + posting limits.

## What I added
- JWT-based auth (register/login) with bcrypt password hashing.
- Friends search and add UI (mutual friendship created server-side).
- Posting rules enforced server-side (0 friends = cannot post, 1 friend = 1 post/day, 2-10 friends = friendsCount per day, >10 = unlimited)
- Frontend stores JWT in localStorage and sends Authorization header.

## Quick start (local)

### Prerequisites
- Node.js >= 16, npm
- MongoDB running locally (or provide MONGO_URI)

### Backend
```bash
cd backend
cp .env.example .env
# edit .env to set MONGO_URI and JWT_SECRET
npm install
npm run dev   # runs with nodemon; or npm start
```

Server runs on port 5000 by default. Uploads served from `http://localhost:5000/uploads/...`

### Frontend
```bash
cd frontend
npm install
npm start
```

Open http://localhost:3000

### Demo flow
1. Register a new user (username + password). Then login.
2. Use Friends panel: search by username and add friend. Mutual friendship is created.
3. Posting rules change as your friend count changes. Try posting with 0 friends (blocked), 1 friend (1 post/day), 2-10 friends (count posts/day), >10 (unlimited).
4. To inspect uploads, view backend/uploads directory or open image/video link returned by posts data.

### Notes & troubleshooting
- This is a local dev scaffold — for production you must secure file uploads, validate inputs, and host MongoDB with backups.
- If uploads do not display, ensure backend is running and `uploads/` folder exists (the server creates it).

Enjoy!
