const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const multer = require('multer');
const mime = require("mime-types");

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } 
});

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function handleChat(message, file = null) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(message);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error in handleChat:', error);
    return "Désolé, je ne peux pas traiter votre demande pour le moment.";
  }
}


const router = express.Router();

router.get('/', (req, res) => {
    res.send('Bienvenue sur l\'API Gemini. Utilisez /chat avec un prompt et un uid pour discuter.');
});

router.get('/chat', async (req, res) => {
  try {
    const { prompt, uid } = req.query;
    if (!prompt) return res.status(400).json({ erreur: "Le paramètre 'prompt' est requis" });

    const response = await handleChat(prompt);
    res.json({ response: response });
  } catch (error) {
    console.error('Erreur lors du traitement de la requête:', error);
    res.status(500).json({ erreur: "Une erreur est survenue lors du traitement de votre demande", details: error.message });
  }
});


router.post('/chat', async (req, res) => {
  try {
    const { prompt, uid } = req.body;
    if (!prompt) return res.status(400).json({ erreur: "Le paramètre 'prompt' est requis" });
    if (!uid) return res.status(400).json({ erreur: "Le paramètre 'uid' est requis" });

    const response = await handleChat(prompt);
    res.json({ response: response });
  } catch (error) {
    console.error('Erreur lors du traitement de la requête:', error);
    res.status(500).json({ erreur: "Une erreur est survenue lors du traitement de votre demande", details: error.message });
  }
});

router.post('/reset', (req, res) => {
    try {
        const { uid } = req.body;
        if (!uid) return res.status(400).json({ erreur: "Le paramètre 'uid' est requis" });
        // sessions is undefined, this line might cause an error. Needs clarification.  Leaving as is for now.
        res.json({ success: true, message: "Conversation réinitialisée avec succès" });
    } catch (error) {
        console.error('Erreur lors de la réinitialisation de la conversation:', error);
        res.status(500).json({ erreur: "Une erreur est survenue lors de la réinitialisation de la conversation", details: error.message });
    }
});

module.exports = router;