const express = require("express");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const app = express();
const PORT = 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message?.trim();

    if (!message) {
      return res.status(400).json({
        error: "Message खाली है"
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: message,
    });

    res.json({
      reply: response.text
    });

  } catch (error) {
    console.error("Gemini Error:", error);

    res.status(500).json({
      error: "AI से response नहीं मिल पाया"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Raushan AI चल रहा है: http://localhost:${PORT}`);
});
