// routes/chat.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const { OpenAI } = require("openai");
const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const Document = require("../models/Document"); // Added import for Document model

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const s3 = new S3Client({ region: process.env.AWS_REGION });

router.post("/chatbot", authenticateToken, async (req, res) => {
  console.log("Chat request received");
  const userId = req.user.id;
  const userMessage = req.body.message;

  try {
    // Fetch user's documents from MongoDB
    const documents = await Document.find({ userId });

    // Extract summaries from documents
    let summaries = documents.map((doc) => doc.summary).join("\n\n");

    // Ensure summaries do not exceed maximum token limit
    const maxSummaryTokens = 2048; // Adjust based on the model's context limit
    const approxTokens = Math.ceil(summaries.length / 4);

    if (approxTokens > maxSummaryTokens) {
      // Truncate the summaries to fit within token limits
      const allowedLength = maxSummaryTokens * 4; // Approximate character count
      summaries = summaries.slice(-allowedLength);
    }

    console.log("User's question:", userMessage);

    // Prepare messages for OpenAI
    const messages = [
      {
        role: "system",
        content: `
    You are a financial literacy assistant.
    
    - Help the user understand their documents and provide advice specifically personalized to their documents.
    - When providing advice, present tips as concise bullet points or numbered lists.
    - Use clear and simple language.
    - The user may ask questions or request summaries of their documents.
    - Using the provided summaries, give users advice on how to manage their finances better.
    - Always prioritize user privacy and data security.
    - Encourage them to do their own research.
    `,
      },
      {
        role: "assistant",
        content: `Here are the summaries of the user's documents:\n${summaries}`,
      },
      {
        role: "user",
        content: userMessage,
      },
    ];

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // or "gpt-4" if you have access
      messages: messages,
      max_tokens: 500,
    });

    const reply = completion.choices[0].message["content"];
    console.log("Chatbot reply:", reply);
    res.json({ reply });
  } catch (error) {
    console.error("Error in chatbot:", error);
    res.status(500).send("Error processing your request.");
  }
});

module.exports = router;
