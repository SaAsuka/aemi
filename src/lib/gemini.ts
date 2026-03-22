import { GoogleGenAI } from "@google/genai"

let _gemini: GoogleGenAI | null = null

export function getGemini(): GoogleGenAI {
  if (!_gemini) {
    _gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" })
  }
  return _gemini
}
