// Remove the import and use CDN
// import { marked } from 'marked';

// Load config text into textareas
window.addEventListener('DOMContentLoaded', () => {
    document.getElementById('family-memory').value = window.familyPrompt;
    document.getElementById('me-memory').value = window.mePrompt;
    document.getElementById('grok-memory').value = window.grokPrompt;
    document.getElementById('gemini-memory').value = window.geminiPrompt;
});

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
const progressBar = document.getElementById('progress-bar');
const summarizeButton = document.getElementById('summarize-button');

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

    updateProgressBar();
}

function updateProgressBar() {
    const totalCharacters = chatDiv.textContent.length;
    const maxCharacters = 6000;
    let percentage = (totalCharacters / maxCharacters) * 100;
    percentage = Math.min(percentage, 100); // Cap at 100%

    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = `${percentage}%`;
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

async function sendGrokMessage(requestBody) {
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    const savedMessage = message;
    input.value = '';
    input.style.height = '37px';

    try {
        // Get the current conversation name
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
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

async function sendGeminiMessage(requestBody) {
    const message = input.value.trim();
    if (!message) return;

    addMessage(message, 'user');
    const savedMessage = message;
    input.value = '';
    input.style.height = '37px';

    try {
        // Get the current conversation name
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
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
    const familyMemory = document.getElementById('family-memory').value;
    const meMemory = document.getElementById('me-memory').value;
    const grokMemory = document.getElementById('grok-memory').value;
    const geminiMemory = document.getElementById('gemini-memory').value;

    let systemPrompt = `${familyMemory} ${meMemory}`; // Base memories
    systemPrompt += selectedModel === 'grok' ? ` ${grokMemory}` : ` ${geminiMemory}`;

    const requestBody = {
        message: input.value,
        history: conversationHistory,
        conversationName: conversationNameInput.value,
        systemPrompt: systemPrompt
    };

    if (selectedModel === 'grok') {
        await sendGrokMessage(requestBody);
    } else {
        await sendGeminiMessage(requestBody);
    }
}

document.querySelectorAll('.icon').forEach(icon => {
    icon.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        sidebar.classList.toggle('active');
    });
});

const pinButton = document.querySelector('.pin-button');

pinButton.addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('pinned');
});

async function getSummary() {
    addMessage("Generating summary...", "system"); // Indicate summary generation

    const summaryPrompt = "Create a short, concise summary of the following conversation:";

    const requestBody = {
        message: summaryPrompt, // Use a specific prompt for summarization
        history: conversationHistory, // Send the full history
        conversationName: conversationNameInput.value, // Keep the same conversation name
        systemPrompt: "You are a helpful assistant designed to summarize conversations." // Specific system prompt for summary
    };

    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error + (data.details ? `\n\nDetails: ${data.details}` : ''));
        }

        // Remove the "Generating summary..." message
        const systemMessages = chatDiv.querySelectorAll('.message.system');
        const lastSystemMessage = systemMessages[systemMessages.length - 1];
        if (lastSystemMessage && lastSystemMessage.textContent.includes("Generating summary...")) {
            lastSystemMessage.remove();
        }

        // Clear chat and history
        chatDiv.innerHTML = '';
        conversationHistory = [];

        addMessage(`**Summary of past conversations:**\n${data.text}`, 'system'); // Add the summary as the only message
        updateProgressBar(); // Reset progress bar after clearing

    } catch (error) {
         // Remove the "Generating summary..." message even on error
        const systemMessages = chatDiv.querySelectorAll('.message.system');
        const lastSystemMessage = systemMessages[systemMessages.length - 1];
        if (lastSystemMessage && lastSystemMessage.textContent.includes("Generating summary...")) {
            lastSystemMessage.remove();
        }
        addMessage(`Error generating summary: ${error.message}`, 'system');
    }
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
newChatBtn.addEventListener('click', startNewChat);

summarizeButton.addEventListener('click', getSummary);
