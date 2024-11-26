// models/Document.js
const mongoose = require("mongoose");

const DocumentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  key: { type: String, required: true },
  name: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Document", DocumentSchema);
