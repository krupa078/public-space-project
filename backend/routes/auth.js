const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_demo';

// POST /api/auth/register { username, password }
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'username and password required' });
  let user = await User.findOne({ username });
  if (user) return res.status(400).json({ message: 'username taken' });
  const hash = await bcrypt.hash(password, 10);
  user = await User.create({ username, password: hash });
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ user: { _id: user._id, username: user.username }, token });
});

// POST /api/auth/login { username, password }
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'username and password required' });
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.password || '');
  if (!ok) return res.status(400).json({ message: 'invalid credentials' });
  const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ user: { _id: user._id, username: user.username }, token });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const auth = req.header('Authorization');
  if (!auth) return res.json(null);
  try {
    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).populate('friends', 'username');
    res.json({ _id: user._id, username: user.username, friends: user.friends });
  } catch (err) {
    res.json(null);
  }
});

// POST /api/auth/:id/add-friend { friendId }  (requires Authorization header)
router.post('/:id/add-friend', async (req, res) => {
  const { friendId } = req.body;
  const user = await User.findById(req.params.id);
  const friend = await User.findById(friendId);
  if (!user || !friend) return res.status(404).json({ message: 'User(s) not found' });
  if (!user.friends.includes(friendId)) user.friends.push(friendId);
  if (!friend.friends.includes(req.params.id)) friend.friends.push(req.params.id);
  await user.save(); await friend.save();
  res.json({ message: 'friends updated' });
});

// GET /api/auth/search?q=term
router.get('/search', async (req, res) => {
  const q = req.query.q || '';
  const users = await User.find({ username: { $regex: q, $options: 'i' } }).limit(20).select('_id username');
  res.json(users);
});

module.exports = router;
