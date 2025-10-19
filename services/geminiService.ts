
import { GoogleGenAI } from "@google/genai";

// Ensure the API key is available in the environment variables
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Polishes the fan offer text to be more natural and appealing using Gemini API.
 * @param offerText The original fan offer text.
 * @returns A promise that resolves to the polished text.
 */
export const polishFanOffer = async (offerText: string): Promise<string> => {
  try {
    const prompt = `請將以下粉絲優惠活動內容，潤飾成更自然、更吸引人的語氣，直接回傳潤飾後的文字即可，不要包含任何前言或結語。原文：「${offerText}」`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error polishing fan offer:", error);
    // In case of an API error, return the original text to not block the user.
    return `為您的粉絲提供特別優惠：${offerText}`;
  }
};
