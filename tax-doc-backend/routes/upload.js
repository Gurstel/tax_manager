// routes/upload.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const authenticateToken = require("../middleware/authenticateToken");
const Document = require("../models/Document");

const storage = multer.memoryStorage();
const upload = multer({ storage });

const s3 = new S3Client({ region: process.env.AWS_REGION });

router.post(
  "/",
  authenticateToken,
  upload.array("documents"),
  async (req, res) => {
    try {
      const files = req.files;
      const userId = req.user.id;
      console.log(process.env.AWS_S3_BUCKET);
      const uploadPromises = files.map(async (file) => {
        const key = `${userId}/${file.originalname}`;
        const params = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: key,
          Body: file.buffer,
        };

        // Upload to S3
        await s3.send(new PutObjectCommand(params));

        // Save metadata to MongoDB
        const document = new Document({
          userId,
          key,
          name: file.originalname,
        });
        await document.save();
      });

      await Promise.all(uploadPromises);
      res.status(200).send("Files uploaded successfully.");
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).send("Error uploading files.");
    }
  }
);

module.exports = router;
