const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const path = require('path');

dotenv.config();

const app = express();

// ======= CORS FIX FOR RENDER + VERCEL =======
const allowedOrigins = [
  "http://localhost:3000",        // local frontend
  /\.vercel\.app$/                // any Vercel deployment (production + preview)
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow Postman, etc.

      // Check against allowed origins
      const allowed = allowedOrigins.some((allowedOrigin) =>
        allowedOrigin instanceof RegExp
          ? allowedOrigin.test(origin)
          : allowedOrigin === origin
      );

      if (allowed) {
        callback(null, true);
      } else {
        console.log("❌ CORS BLOCKED:", origin);
        callback(new Error("CORS not allowed for this origin: " + origin), false);
      }
    },
    credentials: true,
    methods: "GET,POST,PUT,DELETE",
  })
);

// ======= Middleware =======
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ======= Connect DB =======
connectDB();

// ======= Routes =======
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// ======= Start Server =======
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
