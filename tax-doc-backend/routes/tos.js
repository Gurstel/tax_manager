// routes/tos.js
const express = require("express");
const router = express.Router();

// For simplicity, serve a static text. In a real scenario, store this in a file or CMS.
const termsText = `
**Terms of Service**
- We collect your email and password to manage your account.
- Uploaded documents are stored securely in AWS S3.
- Summaries and suggestions are generated using OpenAI APIs.
- We do not share your data with third parties without consent.
- By using our service, you agree to these terms.
`;

router.get("/", (req, res) => {
  res.json({ terms: termsText });
});

module.exports = router;
