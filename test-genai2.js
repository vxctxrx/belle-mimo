import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY });

async function test() {
  try {
    console.log("Tentando gerar imagem...");
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: 'A cute puppy',
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
      }
    });
    console.log("SUCESSO!");
    console.log(response.generatedImages[0].image.imageBytes.substring(0, 50) + "...");
  } catch (e) {
    console.error("ERRO:", e);
  }
}
test();
