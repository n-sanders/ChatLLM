import OpenAI from "openai";
import { systemPrompt } from "../config.js";

// Initialize OpenAI client with environment variable for API key
const client = new OpenAI({
    apiKey: process.env.XAI_API_KEY, // Store your API key in Vercel environment variables
    baseURL: "https://api.x.ai/v1",
});

export default async function handler(req, res) {
    try {
        const { message, history = [] } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Format conversation history for the API
        const messages = [
            {
                role: "system",
                content: "You are Grok, a chatbot inspired by the Hitchhiker's Guide to the Galaxy." + systemPrompt,
            },
            ...history.map(msg => ({
                // Map 'Grok' and 'Gemini' roles to 'assistant' for the API
                role: msg.role === "user" ? "user" : 
                      (msg.role === "Grok" || msg.role === "Gemini") ? "assistant" : 
                      msg.role,
                content: msg.content
            })),
            {
                role: "user",
                content: message,
            }
        ];

        // Make the API call to OpenAI
        const completion = await client.chat.completions.create({
            model: "grok-2-latest",
            messages: messages,
        });

        // Extract the response
        const responseContent = completion.choices[0].message.content;

        // Send the response back as JSON
        res.status(200).json({ message: responseContent });
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ 
            error: error.message || "Failed to generate response",
            details: error.response?.data || error.toString()
        });
    }
}