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
    const q = message.toLowerCase();

    if (/aaj.*(date|tarikh)|date.*aaj|today.*date|आज.*(date|तारीख)|तारीख.*आज/.test(q)) {
      const now = new Date();
      const date = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(now);
      return res.json({
        reply: `आज की तारीख ${date} है।`,
        sources: []
      });
    }

    if (/abhi.*(time|samay|kitna.*(baj|bja)|(?:baj|bja).*kitna|baje)|time.*abhi|current.*time|what.*time|what.*clock|अभी.*(time|समय|कितना.*बज|बज.*कितना|बजे)|समय.*अभी/.test(q)) {
      const now = new Date();
      const time = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }).format(now);
      return res.json({
        reply: `अभी भारत में समय ${time} है।`,
        sources: []
      });
    }

    if (
      q.includes("raushan k bare") ||
      q.includes("raushan ke bare") ||
      q.includes("raushan k baare") ||
      q.includes("raushan ke baare") ||
      q.includes("raushan kaun hai") ||
      q.includes("who is raushan")
    ) {
      return res.json({
        reply: "Raushan Kumar Raushan AI के निर्माता हैं। वे Bhittha More, District Sitamarhi, Bihar से हैं। उनके पिता का नाम Govind Sah और माता का नाम Mrs. Ranju Devi है।",
        sources: []
      });
    }
    if (!message) {
      return res.status(400).json({
        error: "Message खाली है"
      });
    }

    const needsWeb = /latest|today|current|news|weather|price|rate|result|election|who won|कब|आज|ताजा|न्यूज|मौसम|कीमत|रेट|रिजल्ट/.test(message.toLowerCase());

    let searchData = { results: [] };

    if (needsWeb) {
      const searchRes = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: process.env.TAVILY_API_KEY,
          query: message,
          max_results: 1
        })
      });

      searchData = await searchRes.json();
    }

    const sources = (searchData.results || [])
      .map(r => `Title: ${r.title}\nContent: ${r.content}\nURL: ${r.url}`)
      .join("\n\n");
const prompt = `You are Raushan AI, an AI assistant created and developed by Raushan Kumar.

ABOUT RAUSHAN:
Name: Raushan Kumar
Location: Bhittha More, District Sitamarhi, Bihar
Father's name: Govind Sah
Mother's name: Mrs. Ranju Devi

If the user asks about Raushan, such as "Raushan ke bare me batao", "Raushan kaun hai", or "Who is Raushan", answer using the ABOUT RAUSHAN information above.\nFor questions about Raushan, prioritize the ABOUT RAUSHAN information above and do not use web search results to identify him.\nWhen asked "Raushan ke bare me batao", give a direct answer about Raushan using only the information provided above.
Do not invent or add personal information that is not provided above.
Do not claim that Google created Raushan AI. You may explain that Raushan AI uses Google's Gemini AI technology as its underlying AI service.

Use the following fresh web search results to answer the user accurately. If the search results do not contain enough information, say so. Do not invent facts.

WEB RESULTS:
${sources}

USER QUESTION:
${message}`;
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
    });

    res.json({
  reply: response.text,
  sources: (searchData.results || []).slice(0, 1).map(r => ({
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
