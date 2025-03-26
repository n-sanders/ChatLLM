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
let spellingListTitle = ''; // New: Store the title
let spellingListDescription = ''; // New: Store the description

const chatDiv = document.getElementById('chat');
const input = document.getElementById('input');
const modelSelect = document.getElementById('model-select');
const sendBtn = document.getElementById('send');

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
    // Use marked.parse instead of window.marked
    contentSpan.innerHTML = marked.parse(text, { breaks: true });
    
    msg.appendChild(senderSpan);
    msg.appendChild(contentSpan);
    chatDiv.appendChild(msg);
    chatDiv.scrollTop = chatDiv.scrollHeight; // Auto-scroll
}

async function sendGrokMessage() {
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    input.value = '';

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        addMessage(data.message, 'Grok');
    } catch (error) {
        addMessage(`Error: ${error.message}`, 'Grok');
    }
}

async function sendGeminiMessage() {
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    input.value = '';

    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: message }),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        addMessage(data.text, 'Gemini');
    } catch (error) {
        addMessage(`Error: ${error.message}`, 'Gemini');
    }
}

async function sendMessage() {
    const selectedModel = modelSelect.value;
    if (selectedModel === 'grok') {
        await sendGrokMessage();
    } else if (selectedModel === 'gemini') {
        await sendGeminiMessage();
    }
}

sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
