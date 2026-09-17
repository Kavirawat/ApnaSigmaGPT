import express from 'express';
import Thread from '../models/Thread.js';
import getOpenAIAPIResponse from '../utils/openai.js';
import bcrypt from 'bcrypt';
import User from '../models/user.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

router.get('/thread', async (req, res) => {
  try {
    const threads = await Thread.find({}).sort({ updatedAt: -1 });

    res.json(threads);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetched threads!' });
  }
});

router.get('/thread/:threadId', async (req, res) => {
  const { threadId } = req.params;

  try {
    const threads = await Thread.findOne({ threadId });

    if (!threads) {
      return res.status(404).json({ error: 'Thread not found!' });
    }

    res.json(threads.messages);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetched chat!' });
  }
});

router.delete('/thread/:threadId', async (req, res) => {
  const { threadId } = req.params;

  try {
    const deletedThreads = await Thread.findOneAndDelete({ threadId });

    if (!deletedThreads) {
      return res.status(404).json({ error: 'Thread could not be deleted!' });
    }

    res.status(200).json({ success: 'Threads is deleted successfully!' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to delete thread!' });
  }
});

router.post('/chat', async (req, res) => {
  const { threadId, message } = req.body;

  if (!threadId || !message) {
    return res.status(400).json({ error: 'Missing required fields!' });
  }

  try {
    let thread = await Thread.findOne({ threadId });

    if (!thread) {
      thread = new Thread({
        threadId,
        title: message.substring(0, 30),
        messages: [{ role: 'user', content: message }],
      });
    } else {
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
    const user = await User.findOne({ email: email.toLowerCase() });

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
