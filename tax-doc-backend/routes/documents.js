// routes/documents.js
const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authenticateToken");
const {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const Document = require("../models/Document");

const s3 = new S3Client({ region: process.env.AWS_REGION });

// Get list of documents with optional year/month and search filtering
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month, search } = req.query;

    const query = { userId };

    // Date Filtering (uploadedAt)
    if (year && !isNaN(year)) {
      const parsedYear = parseInt(year, 10);

      if (month && !isNaN(month)) {
        // Filter by specific year and month
        const parsedMonth = parseInt(month, 10) - 1; // JS months are 0-based
        const start = new Date(parsedYear, parsedMonth, 1, 0, 0, 0);
        const end = new Date(parsedYear, parsedMonth + 1, 1, 0, 0, 0);
        query.uploadedAt = { $gte: start, $lt: end };
      } else {
        // Filter by entire year
        const start = new Date(parsedYear, 0, 1, 0, 0, 0);
        const end = new Date(parsedYear + 1, 0, 1, 0, 0, 0);
        query.uploadedAt = { $gte: start, $lt: end };
      }
    }

    // Name Search Filtering
    if (search && search.trim() !== "") {
      if (search.includes("\\") || search.includes("$")) {
        // Prevent regex injection
        return res.status(400).send("Invalid search query.");
      }
      query.name = { $regex: search, $options: "i" };
    }

    const documents = await Document.find(query).sort({ uploadedAt: -1 });
    res.json(documents);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).send("Server error.");
  }
});

// Get pre-signed URL for download
router.get("/download/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.id;

    // Verify ownership
    const document = await Document.findOne({ _id: documentId, userId });
    if (!document) {
      return res.status(404).send("Document not found.");
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: document.key,
    };

    const command = new GetObjectCommand(params);
    const url = await getSignedUrl(s3, command, { expiresIn: 60 });

    res.json({ url });
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    res.status(500).send("Error generating URL.");
  }
});

// Delete a document
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const documentId = req.params.id;

    // Verify ownership
    const document = await Document.findOne({ _id: documentId, userId });
    if (!document) {
      return res.status(404).send("Document not found.");
    }

    // Delete the file from S3
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: document.key,
    };

    await s3.send(new DeleteObjectCommand(params));

    // Delete the document from MongoDB
    await Document.deleteOne({ _id: documentId });

    res.status(200).send("Document deleted successfully.");
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).send("Error deleting document.");
  }
});

module.exports = router;
