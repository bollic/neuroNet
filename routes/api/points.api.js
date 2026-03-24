// /api/points.api.js
const express = require('express');
const router = express.Router();

const User = require('../../models/users');
const PointModel = require('../../models/Point');
const { isAuthenticated } = require('../../middleware/auth');
// oppure importa la tua funzione dove sta
function canSeeDescription(point, user) {
   if (!point || !user) return false;   // ⬅️ FIX CRITICO
  // proprietario
  //if (String(point.user) === String(user._id)) return true;
  // proprietario
    const pointUserId = point.user?._id ?? point.user;
  // const pointUserId = point.user._id ? point.user._id : point.user; 
  if (String(pointUserId) === String(user._id)) return true;

  // office vede tutto
  if (user.role === 'office') return true;

  if (!point.descriptionVisibleTo?.length) return false;

  const perm = point.descriptionVisibleTo.find(
    v => String(v.fieldId) === String(user._id)
  );

  if (!perm) return false;

  if (!perm.until) return true;

  return perm.until > new Date();
}

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(401).json({ error: 'Utente non trovato' });
    }
    console.log("USER:", user._id, user.email, user.role);
    // 1️⃣ recupera office
const office = await User.findOne({
  role: 'office',
  groupId: user.groupId
});

if (!office) {
  return res.json([]);
}

// 2️⃣ nomi categorie valide
const validCategoryNames = office.categories.map(c => c.name);

// 3️⃣ prendi SOLO punti validi
    const points = await PointModel.find({
      groupId: user.groupId,
  category: { $in: validCategoryNames }
    }).populate('user', 'email role');
   // console.log("canSeeDescription for first point:", canSeeDescription(points[0], user));
if (points.length > 0) {
  console.log(
    "canSeeDescription for first point:",
    canSeeDescription(points[0], user)
  );
} else {
  console.log("📍 Nessun punto presente per questo utente");
}

console.log(
  `📍 Points validi inviati: ${points.length} / categorie:`,
  validCategoryNames
);



    // 4️⃣ filtro definitivo lato server
    const safePoints = points.map(p => {
      const o = p.toObject();

      if (!canSeeDescription(p, user)) {
         o.description = "";   // oppure delete o.description
      }

      return o;
    });

    return res.json(safePoints);
    //res.json(points);

  } catch (err) {
    console.error('❌ API /points:', err);
    res.status(500).json({ error: 'Errore server' });
  }
});

module.exports = router;
