import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { GoogleGenAI } from "@google/genai";
import Note from "../models/Note.js";

const router = express.Router();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Simple test endpoint: ask the AI anything (no auth, no notes)
router.post("/ask", async (req, res) => {
  try {
    const { question } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: question,
    });
    res.json({ answer: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "AI request failed" });
  }
});

// Chat with YOUR notes (protected): retrieve -> augment -> generate
router.post("/chat", protect, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    // 1) RETRIEVE — get this user's notes
    const notes = await Note.find({ owner: req.userId });

    // 2) AUGMENT — turn the notes into context and build the prompt
    const context = notes
      .map((n) => `Title: ${n.title}\n${n.content}`)
      .join("\n\n");

    const prompt = `You are a helpful assistant for the user's personal notes.
Answer using ONLY the notes below. If the answer isn't in them, say you don't know.

NOTES:
${context}

QUESTION: ${question}`;

    // 3) GENERATE — ask the AI, grounded in the notes
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ answer: response.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "AI chat failed" });
  }
});

export default router;
