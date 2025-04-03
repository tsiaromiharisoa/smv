const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chatMessages');
const clearButton = document.getElementById('clearButton');
const fileInput = document.getElementById('fileInput');

// Fonction pour générer un ID utilisateur unique (conservée, mais utilisation modifiée)
function getUID() {
    if (!localStorage.getItem('chatUID')) {
        localStorage.setItem('chatUID', 'user_' + Math.random().toString(36).substr(2, 9));
    }
    return localStorage.getItem('chatUID');
}

let uid = Date.now().toString(); // UID basé sur un timestamp

function addMessage(message, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
        </div>
    `;
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showLoadingIndicator() {
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot-message loading';
    loadingDiv.innerHTML = `
        <div class="loading-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return loadingDiv;
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    addMessage(message, true);
    userInput.value = '';

    const loadingIndicator = showLoadingIndicator();

    try {
        const response = await fetch('/gemini/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: message,
                uid: uid
            })
        });

        const data = await response.json();
        loadingIndicator.remove();

        if (data.error) {
            addMessage('Désolé, une erreur est survenue: ' + data.error);
        } else {
            addMessage(data.response);
        }
    } catch (error) {
        loadingIndicator.remove();
        addMessage('Désolé, une erreur est survenue lors de la communication avec le serveur.');
    }
}

async function handleFileUpload(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('uid', uid);
    formData.append('prompt', 'Analyze this file and describe its contents');

    const loadingIndicator = showLoadingIndicator();

    try {
        const response = await fetch('/gemini/chat-with-file', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        loadingIndicator.remove();

        if (data.error) {
            addMessage('Désolé, une erreur est survenue: ' + data.error);
        } else {
            addMessage(data.response);
        }
    } catch (error) {
        loadingIndicator.remove();
        addMessage('Désolé, une erreur est survenue lors du traitement du fichier.');
    }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

clearButton.addEventListener('click', async () => {
    try {
        await fetch('/gemini/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uid })
        });
        chatMessages.innerHTML = '';
        uid = Date.now().toString();
        addMessage("Bonjour ! Je suis une création de ❤️Bruno Rakotomalala❤️, conçue pour vous aider. Comment puis-je vous être utile aujourd'hui ?");
    } catch (error) {
        addMessage('Désolé, une erreur est survenue lors de la réinitialisation de la conversation.');
    }
});

fileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length > 0) {
        handleFileUpload(files[0]);
    }
});