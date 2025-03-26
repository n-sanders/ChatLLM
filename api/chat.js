import OpenAI from "openai";

// Initialize OpenAI client with environment variable for API key
const client = new OpenAI({
    apiKey: process.env.XAI_API_KEY, // Store your API key in Vercel environment variables
    baseURL: "https://api.x.ai/v1",
});

export default async function handler(req, res) {
    try {
        // Optionally, get user input from query or body
        const userMessage = req.query.message || req.body.message || "What is the meaning of life, the universe, and everything?";

        // Make the API call to OpenAI
        const completion = await client.chat.completions.create({
            model: "grok-2-latest",
            messages: [
                {
                    role: "system",
                    content: "You are Grok, a chatbot inspired by the Hitchhiker's Guide to the Galaxy.",
                },
                {
                    role: "user",
                    content: userMessage,
                },
            ],
        });

        // Extract the response
        const responseContent = completion.choices[0].message.content;

        // Send the response back as JSON
        res.status(200).json({ message: responseContent });
    } catch (error) {
        console.error("Error in API call:", error.message);
        res.status(500).json({ error: "Failed to process request" });
    }
}