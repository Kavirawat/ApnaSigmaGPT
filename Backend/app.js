import express from 'express';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
import cors from 'cors';
import mongoose from 'mongoose';
import chatRoutes from './routes/chat.js';

const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors());
app.use('/api', chatRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
  connectDB();
});

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log('Connected with Database!');
  } catch (err) {
    console.log('Failed to connect with Db', err);
  }
};

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// app.post('/test', async (req, res) => {
//   if (!req.body.contents) {
//     return res.status(400).json({ error: 'Send your oppinion' });
//   }
//   try {
//     const response = await ai.models.generateContent({
//       model: 'gemini-3.8-flash',
//       contents: req.body.contents,
//     });

//     console.log('Gemini Response:', response.text);

//     return res.send({ text: response.text });
//   } catch (err) {
//     console.error('Error occurred:', err);
//     res
//       .status(500)
//       .json({ error: 'Something went wrong', details: err.message });
//   }
// });
