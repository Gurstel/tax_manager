// routes/resources.js
const express = require("express");
const router = express.Router();

const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: (base_url = "https://api.perplexity.ai"),
});

router.post("/resources", async (req, res) => {
  const { topic } = req.body;
  if (!topic) {
    return res.status(400).json({ error: "Topic is required." });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "llama-3.1-sonar-small-128k-online",
      messages: [
        {
          role: "system",
          content:
            "Provide 5 links in a numbered format. Just give the numbers and links, no need for any other text.",
        },
        { role: "user", content: `Please provide links about: ${topic}` },
      ],
      max_tokens: 500,
    });

    const answer = response.choices[0].message["content"];
    res.json({ answer });
  } catch (error) {
    console.error("Error fetching resources:", error);
    res.status(500).json({ error: "Failed to fetch resources." });
  }
});

module.exports = router;
