
import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

export const getFinancialInsights = async (transactions: Transaction[]): Promise<string> => {
  try {
    // Initializing Gemini client with process.env.API_KEY directly as per guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const summary = transactions.map(t => 
      `${t.type}: ${t.value} - ${t.description} (${t.transaction_time})`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these recent transactions and provide 3 short, actionable financial tips. Be friendly but professional.
      
      Transactions:
      ${summary}`,
      config: {
        systemInstruction: "You are a senior financial advisor who provides concise and clever money-saving advice based on transaction history."
      }
    });

    // Accessing .text property directly as per guidelines
    return response.text || "No insights available at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Start tracking more to get personalized AI insights!";
  }
};
