
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

async function waitForFilesActive(files) {
  for (const name of files.map((file) => file.name)) {
    let file = await fileManager.getFile(name);
    while (file.state === "PROCESSING") {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      file = await fileManager.getFile(name);
    }
    if (file.state !== "ACTIVE") {
      throw Error(`File ${file.name} failed to process`);
    }
  }
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

let chatSession = null;

async function handleChat(message, files = []) {
  try {
    if (!chatSession) {
      chatSession = model.startChat({
        history: [],
      });
    }

    let result;
    if (files && files.length > 0) {
      const geminiFiles = [];
      const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      for (const file of files) {
        if (supportedTypes.includes(file.mimetype)) {
          const data = fs.readFileSync(file.path);
          const base64Data = data.toString('base64');
          geminiFiles.push({
            inlineData: {
              data: base64Data,
              mimeType: file.mimetype
            }
          });
        } else {
          console.log(`Type de fichier non supporté: ${file.mimetype}`);
        }
      }

      if (geminiFiles.length > 0) {
        const parts = [{
          text: message || "Analysez ces images et répondez à mes questions"
        }, ...geminiFiles];

        result = await chatSession.sendMessage(parts);
      } else {
        const parts = [{
          text: message || "Décrivez cette image",
        }];

        for (const file of files) {
          const data = fs.readFileSync(file.path);
          const base64Data = data.toString('base64');
          
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: file.mimetype
            }
          });
        }

        result = await chatSession.sendMessage(parts);
      }
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
