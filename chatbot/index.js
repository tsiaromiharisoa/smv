
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');

// Charger les variables d'environnement
dotenv.config();

// Importer les routes de l'API Gemini
const geminiRoutes = require('./pilot/gemini');

// Initialiser l'application Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuration du middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configuration de multer pour le téléchargement de fichiers
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // limite de 10MB
});

// Routes pour l'API Gemini
app.use('/gemini', geminiRoutes);

// Route par défaut
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur démarré sur http://0.0.0.0:${PORT}`);
});
