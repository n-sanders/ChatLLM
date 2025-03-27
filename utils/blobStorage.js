import { put, list } from '@vercel/blob';

function sanitizeFileName(name) {
    console.log('Sanitizing name:', name);
    return name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'untitled';
}

export async function saveChatHistory(history, conversationName) {
    try {
        console.log('saveChatHistory called with name:', conversationName);
        const timestamp = new Date().toISOString().split('T')[0];
        const sanitizedName = sanitizeFileName(conversationName || 'untitled');
        const fileName = `conversations/${sanitizedName}.json`;
        
        console.log('Saving to file:', fileName);

        const historyJson = JSON.stringify({
            name: conversationName,
            created: timestamp,
            lastUpdated: new Date().toISOString(),
            messages: history
        }, null, 2);

        const blob = await put(fileName, historyJson, {
            access: 'public',
            addRandomSuffix: false,
            contentType: 'application/json'
        });

        console.log("Chat history saved to:", blob.url);
        return blob.url;
    } catch (error) {
        console.error("Error saving chat history:", error);
        throw error;
    }
}

export async function listConversations() {
    try {
        const { blobs } = await list({ prefix: 'conversations/' });
        return blobs.map(blob => ({
            url: blob.url,
            name: blob.pathname.split('/').pop().split('.')[0],
            created: blob.uploadedAt
        }));
    } catch (error) {
        console.error("Error listing conversations:", error);
        throw error;
    }
}
