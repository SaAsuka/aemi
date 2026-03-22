import { GoogleGenAI } from "@google/genai"

const globalForGemini = globalThis as unknown as {
  gemini: GoogleGenAI | undefined
}

export const gemini =
  globalForGemini.gemini ??
  new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? "" })

globalForGemini.gemini = gemini
