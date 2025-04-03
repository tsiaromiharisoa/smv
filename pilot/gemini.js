const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');
const multer = require('multer');
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const router = express.Router();

// Configuration de multer pour le stockage temporaire des fichiers
const upload = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// Initialisation de l'API Gemini et du gestionnaire de fichiers
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// Configuration de génération par défaut (moved to handleChat)


// Stockage des sessions (replaced by chatHistory in handleChat)


// Fonction pour télécharger l'image depuis une URL
async function downloadImage(url) {
    try {
        const response = await axios({ url, responseType: 'stream' });
        const tempPath = path.join(os.tmpdir(), `image_${Date.now()}.jpg`);
        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(tempPath));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Erreur lors du téléchargement de l\'image:', error);
        return null;
    }
}

// Fonction pour télécharger un fichier vers Gemini
async function uploadToGemini(filePath, mimeType) {
    try {
        // Vérifier que le fichier existe
        if (!fs.existsSync(filePath)) {
            throw new Error(`Le fichier ${filePath} n'existe pas`);
        }

        // Obtenir les statistiques du fichier
        const stats = fs.statSync(filePath);
        console.log(`Taille du fichier: ${stats.size} octets`);

        if (stats.size === 0) {
            throw new Error('Le fichier est vide');
        }

        const displayName = path.basename(filePath);
        console.log(`Tentative de téléchargement du fichier ${displayName} de type ${mimeType}`);

        const uploadResult = await fileManager.uploadFile(filePath, {
            mimeType,
            displayName: displayName,
        });

        const file = uploadResult.file;
        console.log(`Fichier téléchargé ${file.displayName} comme: ${file.name}`);
        return file;
    } catch (error) {
        console.error('Erreur lors du téléchargement vers Gemini:', error);
        throw error;
    }
}


//  New functions from edited code
const {
  handleChat
} = require('./gemini-chat-helper'); // Assuming handleChat is in a separate file


// Route principale pour l'API Gemini
router.get('/', (req, res) => {
    res.send('Bienvenue sur l\'API Gemini. Utilisez /chat avec un prompt et un uid pour discuter.');
});

// Route GET pour le chat avec Gemini (refactored)
router.get('/chat', async (req, res) => {
  try {
    const { prompt, uid, imageUrl } = req.query;
    if (!prompt) return res.status(400).json({ erreur: "Le paramètre 'prompt' est requis" });

    let response;
    if (imageUrl && imageUrl.trim() !== '') {
      try {
        const imagePath = await downloadImage(imageUrl);
        if (!imagePath) return res.status(400).json({ erreur: 'Impossible de télécharger l\'image depuis l\'URL fournie' });
        const file = await uploadToGemini(imagePath, 'image/jpeg');
        response = await handleChat(prompt, {path:imagePath, mimetype: 'image/jpeg'}); //using new handleChat
        fs.unlinkSync(imagePath);
      } catch (error) {
        console.error('Erreur lors du traitement de l\'image:', error);
        return res.status(500).json({ erreur: 'Erreur lors du traitement de l\'image', details: error.message });
      }
    } else {
      response = await handleChat(prompt); //using new handleChat
    }
    res.json({ response: response });
  } catch (error) {
    console.error('Erreur lors du traitement de la requête:', error);
    res.status(500).json({ erreur: "Une erreur est survenue lors du traitement de votre demande", details: error.message });
  }
});

// Route POST pour le chat avec Gemini (refactored)
router.post('/chat', async (req, res) => {
  try {
    const { prompt, uid, imageUrl } = req.body;
    if (!prompt) return res.status(400).json({ erreur: "Le paramètre 'prompt' est requis" });
    if (!uid) return res.status(400).json({ erreur: "Le paramètre 'uid' est requis" });

    let response;
    if (imageUrl && imageUrl.trim() !== '') {
      try {
        const imagePath = await downloadImage(imageUrl);
        if (!imagePath) return res.status(400).json({ erreur: 'Impossible de télécharger l\'image depuis l\'URL fournie' });
        const file = await uploadToGemini(imagePath, 'image/jpeg');
        response = await handleChat(prompt, {path:imagePath, mimetype: 'image/jpeg'}); //using new handleChat
        fs.unlinkSync(imagePath);
      } catch (error) {
        console.error('Erreur lors de l\'analyse de l\'image:', error);
        return res.status(500).json({ erreur: 'Erreur lors de l\'analyse de l\'image', details: error.message });
      }
    } else {
      response = await handleChat(prompt); //using new handleChat
    }
    res.json({ response: response });
  } catch (error) {
    console.error('Erreur lors du traitement de la requête:', error);
    res.status(500).json({ erreur: "Une erreur est survenue lors du traitement de votre demande", details: error.message });
  }
});

// Route pour réinitialiser la conversation (kept unchanged)
router.post('/reset', (req, res) => {
    try {
        const { uid } = req.body;
        if (!uid) return res.status(400).json({ erreur: "Le paramètre 'uid' est requis" });
        if (sessions[uid]) sessions[uid] = [];
        res.json({ success: true, message: "Conversation réinitialisée avec succès" });
    } catch (error) {
        console.error('Erreur lors de la réinitialisation de la conversation:', error);
        res.status(500).json({ erreur: "Une erreur est survenue lors de la réinitialisation de la conversation", details: error.message });
    }
});

// Route pour l'upload direct de fichier (refactored)
router.post('/chat-with-file', upload.single('file'), async (req, res) => {
    try {
        const { prompt, uid } = req.body;
        const file = req.file;
        if (!prompt) return res.status(400).json({ erreur: "Le paramètre 'prompt' est requis" });
        if (!uid) return res.status(400).json({ erreur: "Le paramètre 'uid' est requis" });
        if (!file) return res.status(400).json({ erreur: "Aucun fichier n'a été uploadé" });

        let mimeType;
        if (file.mimetype.startsWith('image/')) {
            mimeType = file.mimetype;
        } else if (file.mimetype === 'application/pdf') {
            mimeType = 'application/pdf';
        } else if (file.mimetype === 'application/msword' ||
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            console.log('Traitement de fichier Word:', file.originalname, 'avec MIME:', mimeType);
        } else if (file.mimetype === 'application/vnd.ms-powerpoint' ||
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
            mimeType = file.mimetype;
        } else {
            console.log('Type MIME non pris en charge:', file.mimetype);
            return res.status(400).json({ erreur: "Le type de fichier n'est pas pris en charge" });
        }
        try {
            const response = await handleChat(prompt, file); //using new handleChat
            fs.unlinkSync(file.path);
            res.json({ response: response });
        } catch (uploadError) {
            console.error('Erreur lors du téléchargement du fichier vers Gemini:', uploadError);
            return res.status(500).json({ erreur: "Erreur lors du traitement du fichier", details: uploadError.message });
        }
    } catch (error) {
        console.error('Erreur lors du traitement de la requête avec fichier:', error);
        res.status(500).json({ erreur: "Une erreur est survenue lors du traitement de votre demande", details: error.message });
    }
});

module.exports = router;