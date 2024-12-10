// index.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const suggestionsRoute = require("./routes/suggestions");

const app = express();

// Middleware
app.use(express.json());

// CORS Configuration
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "chrome-extension://hmcfjnbbgehfldnhegpfhefngeemjjkk",
    ],
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Import Routes
const authRoute = require("./routes/auth");
const uploadRoute = require("./routes/upload");
const documentsRoute = require("./routes/documents");
const chatRoute = require("./routes/chat");
const tosRoute = require("./routes/tos");
const resourcesRoute = require("./routes/resources");

// Use Routes
app.use("/auth", authRoute);
app.use("/tos", tosRoute);
app.use("/upload", uploadRoute);
app.use("/documents", documentsRoute);
app.use("/chat", chatRoute);
app.use("/suggestions", suggestionsRoute);
app.use("/resources", resourcesRoute);
// Start Server
const port = process.env.PORT || 5001;
app.listen(port, () => console.log(`Server running on port ${port}`));
