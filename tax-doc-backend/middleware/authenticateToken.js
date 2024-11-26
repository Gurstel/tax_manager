// middleware/authenticateToken.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).send("Access token missing.");
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      console.error("Token verification error:", err);
      return res.status(403).send("Invalid or expired token.");
    }
    req.user = user;
    next();
  });
};
