// models/Suggestion.js
const mongoose = require("mongoose");

const SuggestionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  suggestions: [{ type: String }], // Array of suggestions
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Suggestion", SuggestionSchema);
