// routes/upload.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const authenticateToken = require("../middleware/authenticateToken");
const Document = require("../models/Document");
const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai");
const pdfParse = require("pdf-parse");
const Suggestion = require("../models/Suggestion");

const storage = multer.memoryStorage();
const upload = multer({ storage });
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
const s3 = new S3Client({ region: process.env.AWS_REGION });

router.post(
  "/",
  authenticateToken,
  upload.array("documents"),
  async (req, res) => {
    try {
      const files = req.files;
      const userId = req.user.id;

      // Delete existing suggestions so they can be regenerated
      await Suggestion.deleteOne({ userId });

      const uploadPromises = files.map(async (file) => {
        const key = `${userId}/${file.originalname}`;
        const s3Params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          Body: file.buffer,
        };

        // Upload file to S3
        await s3.send(new PutObjectCommand(s3Params));

        // Extract text from the file
        let fileContent = file.buffer.toString();

        // Attempt to parse year from filenam
        let extractedYear;
        const yearMatch = file.originalname.match(
          /(?:^|[^0-9])(20\d{2})(?:[^0-9]|$)/
        );
        if (yearMatch && yearMatch[0]) {
          extractedYear = parseInt(yearMatch[1], 10);
        }

        // Ensure the content size doesn't exceed token limits
        const maxTokens = 4096; // Max tokens for gpt-3.5-turbo
        const approxTokens = Math.ceil(fileContent.length / 4);

        if (approxTokens > maxTokens - 500) {
          // Truncate the content if it's too large
          fileContent = fileContent.substring(0, (maxTokens - 500) * 4);
        }

        // Summarize the document using OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that summarizes documents.",
            },
            {
              role: "user",
              content: `Please provide a concise summary of the following document. If it looks like a tax document make sure to put all important numbers in the summary. Also note any ways that the user can better file taxes or deal with their finances better:\n\n${fileContent}`,
            },
          ],
        });

        // Save metadata and summary to MongoDB
        const document = new Document({
          userId,
          key,
          name: file.originalname,
          summary: completion.choices[0].message.content,
          year: extractedYear || undefined, // store year if found
        });
        await document.save();
      });

      await Promise.all(uploadPromises);

      res.status(200).send("Files uploaded and processed successfully.");
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).send("Error uploading files.");
    }
  }
);

module.exports = router;
