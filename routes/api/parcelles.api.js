// parcelles.api.js
const express = require('express');
const router = express.Router();

const User = require('../../models/users');
const ParcelleModel = require('../../models/Parcelle');
const { isAuthenticated } = require('../../middleware/auth');
router.get('/', isAuthenticated, async (req, res) => {
  const user = req.session.user;

  if (!user) {
    console.warn("⚠️ API /parcelles chiamata senza user in sessione");
    return res.status(401).json({ success: false, error: "Non autenticato" });
  }

  console.log(
    "🌿 API /parcelles user:",
 
     user.pseudonyme,
    "groupId:",
    user.groupId
  );

  try {
    const parcelles = await ParcelleModel
      .find({ user: user._id }) // solo le mie parcelle
      .populate('user');

    console.log("🌿 Parcelles trovate per utente field:", parcelles.length);

    res.json({
      success: true,
      parcelles
    });
  } catch (err) {
    console.error("❌ Errore API parcelles:", err);
    res.status(500).json({ success: false });
  }
});



module.exports = router;