const express = require("express");
const OpenAI = require("openai");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message;

    if (!message) {
      return res.status(400).json({
        error: "Message खाली है"
      });
    }

    const response = await openai.chat.completions.create({
      model: "gemini-3.5-flash-lite",   messages: [
        {
          role: "system",
          content: `
You are Raushan AI.
You are a helpful AI assistant.
If the user asks in Hindi, answer in Hindi.
If the user asks in English, answer in English.
Keep answers simple and easy to understand.
          `
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    res.json({
      reply: response.choices[0].message.content
    });

  } catch (error) {
    console.error(error.message);

    res.status(500).json({
      error: "AI से response नहीं मिल पाया"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Raushan AI चल रहा है: http://localhost:${PORT}`);
});
