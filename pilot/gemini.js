
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let chatHistory = [];

async function processFileInput(file) {
  if (!file) return null;
  
  const fileData = fs.readFileSync(file.path);
  const mimeType = file.mimetype;
  
  // Convert file to base64
  const fileBase64 = fileData.toString('base64');
  
  return {
    inlineData: {
      data: fileBase64,
      mimeType
    }
  };
}

async function handleChat(message, file = null) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    let prompt = message;
    if (file) {
      const fileData = await processFileInput(file);
      if (fileData) {
        const imageModel = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
        const result = await imageModel.generateContent([prompt, fileData]);
        const response = await result.response;
        chatHistory.push({ role: "user", parts: [prompt, fileData] });
        chatHistory.push({ role: "model", parts: [response.text()] });
        return response.text();
      }
    }

    const chat = model.startChat({
      history: chatHistory.map(msg => ({
        role: msg.role,
        parts: msg.parts
      }))
    });

    const result = await chat.sendMessage(prompt);
    const response = result.response;
    
    chatHistory.push({ role: "user", parts: [prompt] });
    chatHistory.push({ role: "model", parts: [response.text()] });
    
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    return "Désolé, je ne peux pas traiter votre demande pour le moment.";
  }
}

module.exports = { handleChat };
