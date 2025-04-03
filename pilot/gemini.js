
const express = require('express');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const fs = require("node:fs");
const multer = require('multer');
const mime = require("mime-types");

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }
});

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

async function uploadToGemini(path, mimeType) {
  const uploadResult = await fileManager.uploadFile(path, {
    mimeType,
    displayName: path,
  });
  return uploadResult.file;
}

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  }
});

async function handleChat(message, files = []) {
  try {
    if (!chatSession) {
      chatSession = model.startChat({
        history: [],
      });
    }

    let result;
    if (files && files.length > 0) {
      const uploadedFiles = await Promise.all(
        files.map(file => uploadToGemini(file.path, file.mimetype))
      );
      
      const parts = [{
        text: message || "Décrivez cette image",
      }];
      
      uploadedFiles.forEach(file => {
        parts.push({
          inlineData: file
        });
      });

      result = await chatSession.sendMessage(parts);
    } else {
      result = await chatSession.sendMessage(message);
    }

    return result.response.text();
  } catch (error) {
    console.error('Error in handleChat:', error);
    return "Désolé, je ne peux pas traiter votre demande pour le moment.";
  }
}

const router = express.Router();

router.post('/chat', upload.array('files'), async (req, res) => {
  try {
    const message = req.body.message;
    const files = req.files;
    
    const response = await handleChat(message, files);
    res.json({ response });

    // Cleanup uploaded files
    if (files) {
      files.forEach(file => {
        fs.unlink(file.path, err => {
          if (err) console.error('Error deleting file:', err);
        });
      });
    }
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: "Une erreur est survenue", details: error.message });
  }
});

router.post('/reset', (req, res) => {
  try {
    chatSession = null;
    res.json({ success: true, message: "Conversation réinitialisée avec succès" });
  } catch (error) {
    console.error('Error resetting conversation:', error);
    res.status(500).json({ error: "Une erreur est survenue lors de la réinitialisation" });
  }
});

module.exports = {
  router,
  handleChat
};
