import express from 'express';
import Thread from '../models/Thread.js';
import getOpenAIAPIResponse from '../utils/openai.js';
import bcrypt from 'bcrypt';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required! Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { userId, username }
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
};

router.get('/ping', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'SigmaGPT server is active' });
});

router.get('/thread', authMiddleware, async (req, res) => {
  try {
    // Only return threads created by this user (or legacy unassigned threads)
    const threads = await Thread.find({
      $or: [
        { userId: req.user.userId },
        { userId: { $exists: false } },
        { userId: null },
      ],
    }).sort({ updatedAt: -1 });

    res.json(threads);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch threads!' });
  }
});

router.get('/thread/:threadId', authMiddleware, async (req, res) => {
  const { threadId } = req.params;

  try {
    const thread = await Thread.findOne({ threadId });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found!' });
    }

    // Only creator can view their thread
    if (thread.userId && thread.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({ error: 'You are not authorized to view this chat history!' });
    }

    res.json(thread.messages);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch chat!' });
  }
});

router.delete('/thread/:threadId', authMiddleware, async (req, res) => {
  const { threadId } = req.params;

  try {
    const thread = await Thread.findOne({ threadId });

    if (!thread) {
      return res.status(404).json({ error: 'Thread not found!' });
    }

    // ONLY the user who created this thread can delete it
    if (thread.userId && thread.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        error: 'You are not authorized to delete this history! Only the creator can delete it.',
      });
    }

    await Thread.findOneAndDelete({ threadId });

    res.status(200).json({ success: 'Thread deleted successfully!' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to delete thread!' });
  }
});

router.post('/chat', authMiddleware, async (req, res) => {
  const { threadId, message } = req.body;

  if (!threadId || !message) {
    return res.status(400).json({ error: 'Missing required fields!' });
  }

  try {
    let thread = await Thread.findOne({ threadId });

    if (!thread) {
      thread = new Thread({
        userId: req.user.userId,
        threadId,
        title: message.substring(0, 30),
        messages: [{ role: 'user', content: message }],
      });
    } else {
      // Only creator can send messages in their thread
      if (thread.userId && thread.userId.toString() !== req.user.userId.toString()) {
        return res.status(403).json({
          error: 'You are not authorized to send messages in this chat!',
        });
      }
      if (!thread.userId) {
        thread.userId = req.user.userId;
      }
      thread.messages.push({ role: 'user', content: message });
    }

    const assistantReply = await getOpenAIAPIResponse(message);

    thread.messages.push({ role: 'assistant', content: assistantReply });
    thread.updatedAt = new Date();

    await thread.save();
    res.json({ Reply: assistantReply });
  } catch (error) {
    console.log(error);
    if (
      error.status === 429 ||
      error.message?.includes('quota') ||
      error.message?.includes('429')
    ) {
      return res.status(429).json({
        error:
          'Your free Gemini API limit (20 requests/day) has run out! Please change your API Key or wait until tomorrow.',
      });
    }

    res.status(500).json({ error: 'Something went wrong!' });
  }
});

router.post('/register', async (req, res) => {
  const { email, username, name, password } = req.body;

  if (!email || !username || !password) {
    return res
      .status(400)
      .json({ error: 'Missing required registration fields!' });
  }

  try {
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: 'Username or Email already registered!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
    });

    await newUser.save();

    return res.status(201).json({
      success: 'User registered successfully!',
      user: {
        id: newUser._id,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: 'Registration operations failed on server!!' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required login fields!' });
  }

  try {
    const trimmedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      return res.status(400).json({ error: 'Invalid Email or Password!' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid Email or Password!' });
    }
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    return res.status(200).json({
      success: 'Logged in successfully!',
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Login operations failed on server!!' });
  }
});

export default router;
