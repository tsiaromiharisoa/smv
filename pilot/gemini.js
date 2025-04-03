
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const { GoogleAIFileManager } = require("@google/generative-ai/server");
const fs = require("node:fs");
const mime = require("mime-types");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey, {
  apiVersion: "v1" // Utiliser v1 au lieu de v1beta
});
const fileManager = new GoogleAIFileManager(apiKey);

let chatHistory = [];

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

async function uploadToGemini(path, mimeType) {
  const uploadResult = await fileManager.uploadFile(path, {
    mimeType,
    displayName: path,
  });
  return uploadResult.file;
}

async function waitForFilesActive(files) {
  console.log("Waiting for file processing...");
  for (const name of files.map((file) => file.name)) {
    let file = await fileManager.getFile(name);
    while (file.state === "PROCESSING") {
      process.stdout.write(".");
      await new Promise((resolve) => setTimeout(resolve, 10_000));
      file = await fileManager.getFile(name);
    }
    if (file.state !== "ACTIVE") {
      throw Error(`File ${file.name} failed to process`);
    }
  }
  console.log("...all files ready\n");
}

async function processFileInput(file) {
  if (!file) return null;
  try {
    const uploadedFile = await uploadToGemini(file.path, file.mimetype);
    await waitForFilesActive([uploadedFile]);
    return uploadedFile;
  } catch (error) {
    console.error('File processing error:', error);
    return null;
  }
}

async function handleChat(message, file = null) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig
    });
    
    if (file) {
      const fileData = await processFileInput(file);
      if (fileData) {
        const imageModel = genAI.getGenerativeModel({ 
          model: "gemini-pro-vision",
          generationConfig
        });
        const result = await imageModel.generateContent([message, fileData]);
        const response = await result.response;
        return response.text();
      }
    }

    const chat = model.startChat({
      history: chatHistory.map(msg => ({
        role: msg.role,
        parts: [msg.parts].flat()
      })),
      generationConfig
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    
    chatHistory.push({ role: "user", parts: message });
    chatHistory.push({ role: "model", parts: response.text() });
    
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return "Désolé, je ne peux pas traiter votre demande pour le moment.";
  }
}

module.exports = { handleChat };
