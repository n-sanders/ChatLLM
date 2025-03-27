// Remove the import and use CDN
// import { marked } from 'marked';

let currentSessionWords = [];
let currentWordIndex = 0;
let currentWord = '';
let wordLength = 0;
let enteredLetters = [];
let currentPos = 0;
let currentAttempts = 0;
let allWords = [];

const chatDiv = document.getElementById('chat');
const input = document.getElementById('input');
const modelSelect = document.getElementById('model-select');
const sendBtn = document.getElementById('send');
const newChatBtn = document.getElementById('new-chat');
const conversationNameInput = document.getElementById('conversation-name');

// Track conversation history
let conversationHistory = [];

// Generate a default conversation name
function generateDefaultName() {
    const date = new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    });
    return `Chat ${date}`;
}

// Set initial conversation name
conversationNameInput.value = generateDefaultName();

// Auto-resize textarea as user types
function autoResizeTextarea() {
    input.style.height = 'auto';
    input.style.height = (input.scrollHeight) + 'px';
}

input.addEventListener('input', autoResizeTextarea);
input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function addMessage(text, sender) {
    const msg = document.createElement('div');
    msg.className = `message ${sender}`;
    const senderName = sender === 'user' ? 'You' : sender === 'Grok' ? 'Grok' : 'Gemini';
    
    // Create a container for the sender name
    const senderSpan = document.createElement('span');
    senderSpan.className = 'sender-name';
    senderSpan.textContent = `${senderName}: `;
    
    // Create a container for the message content
    const contentSpan = document.createElement('span');
    contentSpan.className = 'message-content';
    contentSpan.innerHTML = marked.parse(text, { breaks: true });
    
    msg.appendChild(senderSpan);
    msg.appendChild(contentSpan);
    chatDiv.appendChild(msg);
    chatDiv.scrollTop = chatDiv.scrollHeight;

    // Add message to history with specific model name
    conversationHistory.push({ 
        role: sender === 'user' ? 'user' : sender,
        content: text 
    });
}

async function startNewChat() {
    // Clear the chat UI
    chatDiv.innerHTML = '';
    conversationHistory = [];
    
    // Generate new conversation name
    conversationNameInput.value = generateDefaultName();
    
    // Focus the input
    input.focus();
}

async function sendGrokMessage() {
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    const savedMessage = message;
    input.value = '';
    input.style.height = '37px';

    try {
        // Get the current conversation name
        const currentConversationName = conversationNameInput.value || 'Untitled Chat';
        
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: savedMessage,
                history: conversationHistory.slice(0, -1),
                conversationName: currentConversationName
            }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error + (data.details ? `\n\nDetails: ${data.details}` : ''));
        }

        addMessage(data.message, 'Grok');
    } catch (error) {
        addMessage(`Error: ${error.message}`, 'Grok');
    }
}

async function sendGeminiMessage() {
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    const savedMessage = message;
    input.value = '';
    input.style.height = '37px';

    try {
        // Get the current conversation name
        const currentConversationName = conversationNameInput.value || 'Untitled Chat';
        
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                prompt: savedMessage,
                history: conversationHistory.slice(0, -1),
                conversationName: currentConversationName
            }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error + (data.details ? `\n\nDetails: ${data.details}` : ''));
        }

        addMessage(data.text, 'Gemini');
    } catch (error) {
        addMessage(`Error: ${error.message}`, 'Gemini');
    }
}

async function sendMessage() {
    const selectedModel = modelSelect.value;
    if (selectedModel === 'grok') {
        await sendGrokMessage();
    } else {
        await sendGeminiMessage();
    }
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
newChatBtn.addEventListener('click', startNewChat);
