import { GoogleGenerativeAI } from '@google/generative-ai';

async function run() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});
    console.log(await model.generateContent("test"));
  }
  
  run();