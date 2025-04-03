
const express = require('express');
const path = require('path');
const multer = require('multer');
const app = express();
const gemini = require('./pilot/gemini');
const handleChat = gemini.handleChat;

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(express.static('public'));
app.use(express.json());

app.post('/chat', upload.array('files'), async (req, res) => {
  try {
    const message = req.body.message || '';
    const files = req.files || [];
    
    const response = await handleChat(message, files);
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

app.get('/cours/serieA', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cours/serieA/Cours_serie_A.html'));
});

app.get('/cours/serieA/malagasy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cours/serieA/cours_Malagasy_SerieA.html'));
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

app.post('/chat/reset', (req, res) => {
  try {
    // Réinitialiser la conversation
    res.json({ success: true });
  } catch (error) {
    console.error('Error resetting chat:', error);
    res.status(500).json({ error: 'Une erreur s\'est produite' });
  }
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
