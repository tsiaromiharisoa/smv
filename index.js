
const express = require('express');
const path = require('path');
const multer = require('multer');
const app = express();
const { handleChat } = require('./pilot/gemini');

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(express.static('public'));
app.use(express.json());

app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }
    const response = await handleChat(message);
    res.json({ response });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Une erreur s\'est produite' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/cours', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cours/cours.html'));
});

app.get('/cours/malagasy6eme', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cours/malagasy6eme.html'));
});

app.get('/sujet', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sujet.html'));
});

app.get('/chatbot', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chatbot.html'));
});

app.get('/physiqueTA', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'physiqueTA.html'));
});

app.get('/pdfPCTA', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pdfPCTA.html'));
});



// Servir les fichiers PDF
app.use('/attached_assets', express.static('attached_assets'));

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
