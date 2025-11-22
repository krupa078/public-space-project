const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Post = require('../models/Post');
const User = require('../models/User');
const auth = require('../middleware/auth');

// multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({ storage });

// Utility: compute today's limit based on friends count
function dailyLimitFromFriends(count) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count >= 2 && count <= 10) return count;
  return Infinity;
}

// create uploads folder if missing
const fs = require('fs');
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// POST /api/posts/create  (auth required)
router.post('/create', auth, upload.single('media'), async (req, res) => {
  const userId = req.user.id;
  const user = await User.findById(userId).populate('friends');
  if (!user) return res.status(404).json({ message: 'User not found' });

  const friendsCount = user.friends.length;
  const dailyLimit = dailyLimitFromFriends(friendsCount);
  if (dailyLimit === 0) return res.status(403).json({ message: 'You must have friends to post on public page.' });

  // count how many posts user made today
  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayPosts = await Post.countDocuments({ user: userId, createdAt: { $gte: todayStart } });
  if (todayPosts >= dailyLimit) return res.status(403).json({ message: `Daily limit reached. Limit: ${dailyLimit}` });

  const mediaUrl = req.file ? ('/uploads/' + req.file.filename) : null;
  const mediaType = req.file && req.file.mimetype.startsWith('video') ? 'video' : 'image';
  const post = await Post.create({
    user: userId,
    caption: req.body.caption || '',
    mediaUrl,
    mediaType
  });
  res.json(post);
});

// GET /api/posts/all -> public feed (latest first)
router.get('/all', async (req, res) => {
  const posts = await Post.find()
    .sort({ createdAt: -1 })
    .populate("user", "username")
    .populate("sharedBy", "username"); // IMPORTANT LINE!

  res.json(posts);
});


// POST /api/posts/:id/like (require auth)
router.post('/:id/like', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  const uid = req.user.id;
  if (!post.likes.includes(uid)) post.likes.push(uid);
  else post.likes = post.likes.filter(x => x.toString() !== uid);
  await post.save();
  res.json({ likes: post.likes.length });
});

// POST /api/posts/:id/comment { text }
router.post('/:id/comment', auth, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) return res.status(404).json({ message: 'Post not found' });
  post.comments.push({ user: req.user.id, text: req.body.text });
  await post.save();
  res.json(post);
});
//POST /api/posts/:id/share
// SHARE A POST
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { targetUserId } = req.body; 

    let post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Increase share count
    post.shares = (post.shares || 0) + 1;

    // Ensure sharedBy field exists
    if (!post.sharedBy) post.sharedBy = [];

    // Add the user who shared
    if (!post.sharedBy.includes(req.user.id)) {
      post.sharedBy.push(req.user.id);
    }

    await post.save();

    // Populate usernames FOR FRONTEND
    post = await Post.findById(req.params.id)
      .populate("sharedBy", "username");

    res.json({
      message: "Shared successfully",
      shares: post.shares,
      sharedBy: post.sharedBy
    });

  } catch (err) {
    res.status(500).json({ 
      message: "Share failed", 
      error: err.message 
    });
  }
});


module.exports = router;
