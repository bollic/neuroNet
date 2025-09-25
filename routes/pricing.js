// routes/pricing.js
const express = require("express");
const router = express.Router();

router.get("/pricing", (req, res) => {
  res.render("pricing", { user: req.session.user });
});

module.exports = router;
