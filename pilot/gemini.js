
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let chatHistory = [];

async function processFileInput(file) {
  if (!file) return null;
  
  const fileData = fs.readFileSync(file.path);
  const mimeType = file.mimetype;
  
  return {
    inlineData: {
      data: fileData.toString('base64'),
      mimeType
    }
  };
}

async function handleChat(message, file = null) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    if (file) {
      const fileData = await processFileInput(file);
      if (fileData) {
        const imageModel = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
        const result = await imageModel.generateContent([message, fileData]);
        const response = await result.response;
        return response.text();
      }
    }

    const chat = model.startChat({
      history: chatHistory.map(msg => ({
        role: msg.role,
        parts: [msg.parts].flat()
      }))
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
