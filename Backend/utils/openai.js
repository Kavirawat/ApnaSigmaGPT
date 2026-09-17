import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const getOpenAIAPIResponse = async (message) => {
  if (!message) {
    throw new Error('Message content is missing.');
  }
  try {
    const response = await ai.models.generateContent({
      // model: 'gemini-3.6-flash',
      model: 'gemini-3.5-flash-lite',
      contents: message,
    });

    console.log('Gemini Response:', response.text);

    return response.text;
  } catch (err) {
    console.error('Error occurred:', err);
    throw err;
  }
};

export default getOpenAIAPIResponse;
