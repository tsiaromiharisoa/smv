
const express = require('express');
const path = require('path');
const app = express();

app.use(express.static('public'));

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

app.get('/physiqueTA', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'physiqueTA.html'));
});

app.get('/pdfPCTA', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pdfPCTA.html'));
});

app.get('/chatbot', (req, res) => {
  res.sendFile(path.join(__dirname, 'chatbot/public/index.html'));
});

// Servir les fichiers PDF
app.use('/attached_assets', express.static('attached_assets'));

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
