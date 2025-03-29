import { GoogleGenAI } from "@google/genai";
import { saveChatHistory } from "../utils/blobStorage.js";

const genAI = new GoogleGenAI(process.env.GOOGLE_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, history = [], conversationName, systemPrompt } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const contextPrompt = [
        `System: ${systemPrompt}`,
        ...history.map(msg => {
          const role = msg.role === 'user' ? 'Human' :
                      msg.role === 'Grok' ? 'Grok' :
                      msg.role === 'Gemini' ? 'Gemini' :
                      'Assistant';
          return `${role}: ${msg.content}`;
        })
      ].join('\n\n');

    const fullPrompt = contextPrompt ? 
        `${contextPrompt}\n\nHuman: ${message}\n\nGemini:` : 
        message;

    const response = await genAI.models.generateContent({
        model: 'gemini-2.5-pro-exp-03-25',
        contents: fullPrompt,
    });

    const responseText = response.text;

    // Save API response to history
    await saveChatHistory([...history, 
        { role: 'user', content: message },
        { role: 'Gemini', content: responseText }
    ], conversationName);
    
    return res.status(200).json({ text: responseText });
  } catch (error) {
    console.error('Gemini API error:', error);
    const errorMessage = error.message || 'Failed to generate content';
    return res.status(500).json({ 
      error: errorMessage,
      details: error.response?.data || error.toString()
    });
  }
}