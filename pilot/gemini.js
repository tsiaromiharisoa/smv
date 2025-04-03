const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const fs = require("node:fs");
const multer = require('multer');
const mime = require("mime-types");

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  }
});

let chatSession;

async function handleChat(message) {
  try {
    if (!chatSession) {
      chatSession = model.startChat({
        history: [],
      });
    }

    const result = await chatSession.sendMessage(message);
    return result.response.text();
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
        chatSession = null; // Reset the chat session
        res.json({ success: true, message: "Conversation réinitialisée avec succès" });
    } catch (error) {
        console.error('Erreur lors de la réinitialisation de la conversation:', error);
        res.status(500).json({ erreur: "Une erreur est survenue lors de la réinitialisation de la conversation", details: error.message });
    }
});

module.exports = router;