// routes/suggestions.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const Document = require("../models/Document");
const Suggestion = require("../models/Suggestion");

const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// GET /suggestions - Fetch existing suggestions or generate new ones
router.get("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Check if suggestions already exist for the user
    let userSuggestions = await Suggestion.findOne({ userId });

    if (userSuggestions) {
      // Return existing suggestions
      return res.json({ suggestions: userSuggestions.suggestions });
    }

    // If no suggestions exist, generate new ones
    // Fetch user's documents
    const documents = await Document.find({ userId });

    if (documents.length === 0) {
      return res
        .status(400)
        .send("No documents found for generating suggestions.");
    }

    // Combine summaries
    let summaries = documents.map((doc) => doc.summary).join("\n\n");

    // Prepare prompt for OpenAI
    const prompt = `Analyze the following document summaries and provide a detailed list of actionable financial recommendations tailored to the user's specific financial situation and goals. Each suggestion should:

Be numbered and presented clearly in simple, concise language.
Directly reference specific details and numbers from the document summaries to ensure relevance and precision.
Include at least three specific and personal improvement strategies based on explicit insights or themes extracted from the summaries.
Document Summaries:
${summaries}
  `;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    const reply = completion.choices[0].message["content"];

    // Split suggestions into an array
    const suggestions = reply
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => line.trim());

    // Save suggestions to the database
    await Suggestion.findOneAndUpdate(
      { userId },
      { suggestions, createdAt: new Date() },
      { upsert: true }
    );

    // Return the suggestions
    res.json({ suggestions });
  } catch (error) {
    console.error(
      "Error generating suggestions:",
      error.response?.data || error.message
    );
    res.status(500).send("Error generating suggestions.");
  }
});

// POST /suggestions/add - Add a new unique suggestion
router.post("/add", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Fetch existing suggestions
    let userSuggestions = await Suggestion.findOne({ userId });

    if (!userSuggestions) {
      // If no suggestions exist, initialize an empty array
      userSuggestions = new Suggestion({ userId, suggestions: [] });
    }

    // Fetch user's documents
    const documents = await Document.find({ userId });

    if (documents.length === 0) {
      return res
        .status(400)
        .send("No documents found for generating suggestions.");
    }

    // Combine summaries
    let summaries = documents.map((doc) => doc.summary).join("\n\n");

    // Prepare prompt for OpenAI, including existing suggestions to avoid duplication
    const existingSuggestionsText = userSuggestions.suggestions.join("\n");

    const prompt = `
Review the following document summaries and provide one unique, actionable financial suggestion tailored to the user's specific financial situation and goals. The new suggestion must:

Be distinct and not overlap with any of the existing suggestions in content or intent.
Be presented clearly and concisely in simple language.
Directly reference specific details from the document summaries to demonstrate its relevance.
Existing Suggestions:
${existingSuggestionsText || "None"}

Document Summaries:
${summaries}
  `;

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 150,
    });

    const reply = completion.choices[0].message["content"].trim();

    // Ensure the new suggestion is not already in the existing suggestions
    if (userSuggestions.suggestions.includes(reply)) {
      return res
        .status(200)
        .send("No new unique suggestions could be generated.");
    }

    // Add the new suggestion to the user's suggestions
    userSuggestions.suggestions.push(reply);
    await userSuggestions.save();

    // Return the updated suggestions
    res.json({ suggestions: userSuggestions.suggestions });
  } catch (error) {
    console.error(
      "Error adding new suggestion:",
      error.response?.data || error.message
    );
    res.status(500).send("Error adding new suggestion.");
  }
});

// DELETE /suggestions - Refresh suggestions by deleting existing ones
router.delete("/", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    await Suggestion.deleteMany({ userId });
    res.status(200).send("Suggestions refreshed.");
  } catch (error) {
    console.error("Error deleting suggestions:", error.message);
    res.status(500).send("Error refreshing suggestions.");
  }
});

module.exports = router;
