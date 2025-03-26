import { GoogleGenAI } from "@google/genai";
import { systemPrompt } from "../config.js";

const genAI = new GoogleGenAI(process.env.GOOGLE_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, history = [] } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Combine history with current prompt
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
      `${contextPrompt}\n\nHuman: ${prompt}\n\nGemini:` : 
      prompt;

    const response = await genAI.models.generateContent({
        model: 'gemini-2.5-pro-exp-03-25',
        contents: fullPrompt,
      });
    
    return res.status(200).json({ text: response.text });
  } catch (error) {
    console.error('Gemini API error:', error);
    // Extract the detailed error message if available
    const errorMessage = error.message || 'Failed to generate content';
    return res.status(500).json({ 
      error: errorMessage,
      details: error.response?.data || error.toString()
    });
  }
}