
function addMessage(message, isUser = false) {
  const chatMessages = document.querySelector('.chat-messages');
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', isUser ? 'user-message' : 'bot-message');
  messageDiv.textContent = message;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function handleSendMessage() {
  const messageInput = document.getElementById('message-input');
  const fileInput = document.getElementById('file-upload');
  const message = messageInput.value.trim();
  const file = fileInput.files[0];

  if (!message && !file) return;

  if (message) {
    addMessage(message, true);
    messageInput.value = '';
  }

  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('message', message);

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      addMessage(data.response);
    } catch (error) {
      console.error('Error:', error);
      addMessage('Désolé, une erreur s\'est produite.');
    }

    fileInput.value = '';
  } else {
    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });
      const data = await response.json();
      addMessage(data.response);
    } catch (error) {
      console.error('Error:', error);
      addMessage('Désolé, une erreur s\'est produite.');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.querySelector('.theme-toggle');
  let isDark = false;

  themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? '☀️' : '🌓';
  });

  // Ajout d'animation sur les boutons
  document.querySelectorAll('.nav-btn').forEach(button => {
    button.addEventListener('click', () => {
      button.style.transform = 'scale(0.95)';
      setTimeout(() => {
        button.style.transform = '';
      }, 100);
      
      if (button.classList.contains('contact-btn')) {
        window.location.href = '/contact';
      } else if (button.classList.contains('courses-btn')) {
        window.location.href = '/cours';
      } else if (button.classList.contains('bacc-btn')) {
        window.location.href = '/sujet';
      } else if (button.classList.contains('chatbot-btn')) {
        window.location.href = '/chatbot';
      }
    });
  });
});
