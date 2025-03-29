import OpenAI from "openai";
import { saveChatHistory } from "../utils/blobStorage.js";

// Initialize OpenAI client with environment variable for API key
const client = new OpenAI({
    apiKey: process.env.XAI_API_KEY, 
    baseURL: "https://api.x.ai/v1",
});

export default async function handler(req, res) {
    try {
        const { message, history = [], conversationName, systemPrompt } = req.body;
        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // Remove initial save to avoid duplication
        // Only save once after we get the response

        // Format conversation history for the API
        const messages = [
            {
                role: "system",
                content: systemPrompt,
            },
            ...history.map(msg => ({
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

        // Save the complete conversation including the new response
        // This is the only place we should save to avoid duplicate files
        const updatedHistory = [...history, 
            { role: 'user', content: message },
            { role: 'Grok', content: responseContent }
        ];
        
        console.log('Saving chat with conversation name:', conversationName);
        await saveChatHistory(updatedHistory, conversationName);

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