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

    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: message,
        max_results: 5
      })
    });

    const searchData = await searchRes.json();

    const sources = (searchData.results || [])
      .map(r => `Title: ${r.title}\nContent: ${r.content}\nURL: ${r.url}`)
      .join("\n\n");

    const prompt = `Use the following fresh web search results to answer the user accurately. If the search results do not contain enough information, say so. Do not invent facts.\n\nWEB RESULTS:\n${sources}\n\nUSER QUESTION:\n${message}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    res.json({
      reply: response.text,
      sources: (searchData.results || []).map(r => ({
        title: r.title,
        url: r.url
      }))
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
