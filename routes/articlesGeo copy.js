//articlesGeo.js route per points e parcelles
const express = require("express");
const router = express.Router();
const fs = require('fs');
const path = require('path');  // <--- aggiungi questa riga
const bcrypt = require('bcrypt'); // Utilisé pour comparer les mots de passe hachés

const mongoose = require('mongoose');
const User = require('../models/users');
const PointModel = require('../models/Point'); 
const ParcelleModel = require('../models/Parcelle'); 
const Group = require('../models/Group');
const {
  isAuthenticated,
  onlyField,
  onlyOffice
} = require('../middleware/auth');
const PLANS = require('../config/plans');
const { checkPlanLimit } = require("../services/planService");

// Ottieni ObjectId da Mongoose
//const ObjectId = mongoose.Types.ObjectId;
const multer = require('multer');

// Configurazione multer per più immagini
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads'); // Cartella di destinazione
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});
  const defaultCategories = [
  { name: 'A', icon: '🟥' },
  { name: 'B', icon: '🟧' },
  { name: 'C', icon: '🟨' },
  { name: 'D', icon: '🟩' },
  { name: 'E', icon: '🟦' }
];
/*

*/

// Configurazione di multer per gestire più immagini
const uploadSingle = multer({ storage }).single("image");
// 🔧 Funzione riutilizzabile per costruire groupsPreview
async function buildGroupsPreview() {
  const groupIds = await User.distinct("groupId", { groupId: { $ne: null } });
  const groupsPreview = [];

  for (const groupId of groupIds) {
    const members = await User.find({ groupId }).select("email role").lean();
    const pointsCount = await PointModel.countDocuments({ groupId });
    const lastPoint = await PointModel
      .findOne({ groupId })
      .sort({ createdAt: -1 })
      .select("createdAt name");
       // 🔹 Qui recuperiamo il gruppo vero dal modello Group
    let group = await Group.findOne({ groupId }).lean();
    if (!group) {
      // Se non esiste, creane uno di default
      group = {
        groupId,
        name: `Groupe ${groupId}`,
        description: "Aucune description pour le moment.",
        keywords: []
      };
    }

   groupsPreview.push({
      groupId,
      name: group.name,
      description: group.description,
      keywords: group.keywords,
      totalMembers: members.length,
      pointsCount,
      lastPoint,
      membersPreview: members.slice(0, 5)
    });
  }

  // Ordina per numero di punti (dal più attivo al meno attivo)
  groupsPreview.sort((a, b) => b.pointsCount - a.pointsCount);
  return groupsPreview;
}

// fuori dalla route, in alto nel file
let devCounter = 0;


router.get('/', async (req, res) => {
  try {
    console.log("➡️ Entrato in / con sessione:", req.session);
    let user = req.session.user || null;
    console.log("👤 Utente:", user);
if (user && user._id) {
  try {
    const userDb = await User.findById(user._id);

    if (!userDb) {
      console.log('⚠️ Utente non trovato nel DB → probabilmente eliminato. Logout sicuro.');
      return req.session.destroy(() => {
        res.clearCookie('connect.sid');
        return res.redirect('/');
      });
    }
  } catch (err) {
    console.log('⚠️ Errore DB → NON forza logout per evitare logout falsi', err);
  }
}

    // ✅ Redireziona subito in base al ruolo (se l'utente esiste davvero)
    if (user) {
      if (user.role === "office") {
        return res.redirect("/indexOfficeGeo");
      }
      if (user.role === "field") {
        return res.redirect("/indexZoneGeo");
      }
      if (user.role === "admin") {
        return res.redirect("/users"); // o dove preferisci
      }
    }

    // ✅ Se non c'è utente, mostra la preview gruppi
// ✅ Se non c’è utente, mostra la preview gruppi
const groupsPreview = await buildGroupsPreview();


res.render('index', {
  title: 'La liste des points',
  session: req.session,
  user,
  groupsPreview
  
});

  } catch (error) {
    console.error('❌ Errore durante caricamento index:', error);
    res.status(500).send('Erreur lors de la récupération des groupes');
  }
});
// ===========================
// GET /groups  → lista completa dei gruppi
// ===========================
router.get('/groups', async (req, res) => {
  try {
   const groupsPreview = await buildGroupsPreview();

    res.render('groups', {
      title: 'Tous les groupes actifs',
      user: req.session.user || null,
      groupsPreview
    });
  } catch (error) {
    console.error('❌ Errore durante il caricamento dei gruppi:', error);
    res.status(500).send('Erreur lors du chargement des groupes');
  }
});

router.get('/groups/:groupId', async (req, res) => {
  try {
    const { groupId } = req.params;

    // Utente loggato
    const user = req.session.user || null;

    // Controllo permessi: è office del gruppo?
    const isGroupOffice =
      user &&
      user.role === 'office' &&
      user.groupId === groupId;

    // Cerca il gruppo
    let group = await Group.findOne({ groupId });

    // Se non esiste ancora, crearlo
    if (!group) {
      group = await Group.create({
        groupId,
        name: `Groupe ${groupId}`,
        description: "Aucune description pour le moment.",
        keywords: []
      });
    }

    // Recupera membri e punti
    const groupMembers = await User.find({ groupId });
    const points = await PointModel.find({ groupId });

    // Render
    res.render('group-detail', {
      groupId,
      group,
      members: groupMembers,
      points,
      user,
      isGroupOffice
    });

  } catch (err) {
    console.error("❌ Errore in /groups/:groupId:", err);
    res.status(500).send("Erreur lors du chargement du groupe");
  }
});

// FEED PUBBLICO — SOLO READ
router.get('/groups/:groupId/feed', async (req, res) => {
  const { groupId } = req.params;

  const points = await PointModel.find({ groupId })
    .sort({ createdAt: -1 })
    .limit(20);

  res.render('partials/groupFeedPublic', { points });
});

// 👇 in routes/groups.js
router.post('/groups/:groupId/updateInfo', async (req, res) => {
  const { groupId } = req.params;
  const { name, description, keywords } = req.body;
    const user = req.session.user;
    // ✅ Controllo dei permessi
  if (!user || (user.role !== 'admin' && !(user.role === 'office' && user.groupId === groupId))) {
    return res.status(403).send("Non hai i permessi per aggiornare questo gruppo");
  }
  await Group.findOneAndUpdate(
    { groupId },
    {
      name,
      description,
      keywords: keywords ? keywords.split(',').map(k => k.trim()) : []
    },
    { new: true, upsert: true }
  );

  res.redirect(`/groups/${groupId}`);
});

// routes/zoneParcelle.js o simile
router.get('/indexZoneParcelle', isAuthenticated, onlyField, async (req, res) => {
  console.log('🌿 ROUTE /indexZoneParcelle chiamata');
  console.log('📦 Sessione:', req.session);

  const user = req.session.user;
  if (!user || !user._id) {
    console.warn('⚠️ Utente non autenticato o senza _id');
    return res.status(401).send('Utente non autenticato');
  }

  try {
    const parcelles = await ParcelleModel.find({ user: user._id }).populate('user');


        // Vista standard con mappa
      res.render('indexZoneParcelle', {
      user,
      session: req.session,
      parcelles
    });

  } catch (error) {
    console.error('❌ Errore nel caricamento delle parcelles:', error);
    res.status(500).send('Errore del server');
  }
});

router.get('/indexOfficeParcelle', isAuthenticated, onlyOffice, async (req, res) => {
  try {
    if (req.session.user.role !== 'office') {
      return res.redirect('/');
    }

    // Recupera l'utente office attuale
    const currentUser = await User.findById(req.session.user._id);
    if (!currentUser) {
      return res.status(404).send("Utente office non trovato");
    }

    const categories = currentUser.categories || ["A", "B", "C", "D", "E"];

    // Recupera SOLO gli utenti field del suo gruppo
    const fieldUsers = await User.find({
      role: 'field',
      groupId: currentUser.groupId,
    });

    console.log("👥 Utenti field trovati:", fieldUsers.length);

    const fieldUserIds = fieldUsers.map((u) => u._id);
    const parcellesRaw = await ParcelleModel.find({
      user: { $in: fieldUserIds },
      groupId: currentUser.groupId
    }).populate('user', 'email');

    console.log("📍 ParcellesRaw trovate:", parcellesRaw.length);
    parcellesRaw.forEach((p,i) => {
      console.log(`[${i+1}] Parcelle: ${p.name}, creato da → ${p.user ? p.user.email : '❓ utente mancante'}`);
    });

    // 👉 unico mapping per il client
    const parcellesForClient = parcellesRaw.map(p => {
      const date = p.createdAt ? new Date(p.createdAt) : null;
      const cats = p.categories || (p.category ? [p.category] : []);

      return {
        _id: p._id,
        name: p.name,
        category: cats.length ? cats.join(', ') : '',
        coordinates: p.geometry?.coordinates || [],
        userEmail: p.user?.email || '❓',
        userId: p.user?._id?.toString() || null,
        createdAtFormatted: date
          ? date.toLocaleString("it-IT", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        createdAtISO: date ? date.toISOString().slice(0, 10) : "",
      };
    });

    const message = req.session.message;
    req.session.message = null;

    // 👉 un solo res.render
    res.render('indexOfficeParcelle', {
      parcelles: parcellesForClient,
      fieldUsers,
      categories,
      user: req.session.user,
      groupId: currentUser.groupId,
      session: req.session,
      message
    });

  } catch (err) {
    console.error('❌ Errore nel recupero delle parcelle per office:', err);
    res.status(500).send('Errore interno del server');
  }
});

router.get('/indexOfficeGeo', isAuthenticated, onlyOffice, async (req, res) => {
  try {
    // Sicurezza: solo office
    if (req.session.user.role !== "office") {
      return res.redirect("/");
    }

    // Recupera l'utente office attuale
    const currentUser = await User.findById(req.session.user._id);
    if (!currentUser) {
      return res.status(404).send("Utente office non trovato");
    }
       // ⭐️ Recupero del gruppo dell’office
    const group = await Group.findOne({ groupId: currentUser.groupId });
    const currentPlan = group ? group.plan : "free";   // fallback
     // recupera il maxPoints dal config
  const maxPoints = PLANS[currentPlan]?.maxPoints || 0;
    const categories = currentUser.categories || [];

    // Recupera SOLO gli utenti field del suo gruppo
    const fieldUsers = await User.find({
      role: "field",
      groupId: currentUser.groupId,
    });

    console.log("👥 Utenti field trovati:", fieldUsers.length);

    const fieldUserIds = fieldUsers.map((u) => u._id); // ObjectId, NON string
    const pointsRaw = await PointModel.find({
      user: { $in: fieldUserIds },
      groupId: currentUser.groupId
    }).populate('user', 'email');

    // 👇 aggiungi qui i log di debug
    console.log('📍 Punti trovati dopo il filtro:', pointsRaw.length);
     pointsRaw.forEach((p,i) => {
      console.log(`[${i+1}] Punto: ${p.name}, creato da → ${p.user ? p.user.email : '❓ utente mancante'}`);
     });

      // Mappa i punti con userEmail, userId e date
      const points = pointsRaw.map(p => {
        const date = p.createdAt ? new Date(p.createdAt) : null;

        return {
          _id: p._id,
          name: p.name,
          category: p.category,
          coordinates: p.coordinates || [], // necessario per Leaflet
          createdAtFormatted: date
            ? date.toLocaleString("it-IT", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",

          createdAtISO: date ? date.toISOString().slice(0, 10) : "", // 👈 campo nascosto per filtro DataTables
          userId: p.user ? p.user._id.toString() : null,
          userEmail: p.user ? p.user.email : "❓utente sconosciuto"
        };
      });
      console.log("💡 Plan dal DB:", currentPlan);

        // render: PASSA SOLO l'array piatto (pointsForClient) al client
      res.render("indexOfficeGeo", {
        points,           // già con userEmail e userId
        fieldUsers,       // array field users (utile lato client)
        categories,
        user: req.session.user,
        groupId: currentUser.groupId,
        plan: currentPlan,
        maxPoints, // <-- passiamo al template
       // message: res.locals.message,  // <-- questo è corretto
        session: req.session
      });

  } catch (err) {
    console.error("❌ Errore nel recupero punti per office:", err);
    res.status(500).send("Errore interno del server");
  }
});
// ===========================
// GET /groupFeed
// ===========================
/* router.get('/groupFeed', isAuthenticated, onlyField, async (req, res) => {
  console.log("📩 [groupFeed] Sessione attuale:", req.session);
  console.log("👤 [groupFeed] Utente in sessione:", req.session.user);

  if (!req.session.user) {
    console.warn("⚠️ Nessun utente trovato in sessione!");
    return res.status(401).send("Non autenticato");
  }

  const user = await User.findById(req.session.user._id);
  if (!user) {
    return res.status(404).send("Utente non trovato");
  }

  console.log("✅ Utente DB trovato:", user.email, " | groupId:", user.groupId);
  // 🔥 SOLO punti del gruppo, NESSUN ANON
  const points = await PointModel.find({
     groupId: user.groupId 
    }).populate("user");

  console.log("🧾 [groupFeed] Punti trovati:", points.length);

  res.render("partials/groupFeed", { points, user });
});*/
/*
router.get('/groupFeedPublic', async (req, res) => {
  console.log("📩 [groupFeed] Sessione attuale:", req.session);
  console.log("👤 [groupFeed] Utente in sessione:", req.session.user);

  if (!req.session.user) {
    console.warn("⚠️ Nessun utente trovato in sessione!");
    return res.status(401).send("Non autenticato");
  }

  const user = await User.findById(req.session.user._id);
  if (!user) {
    return res.status(404).send("Utente non trovato");
  }

  console.log("✅ Utente DB trovato:", user.email, " | groupId:", user.groupId);
  // 🔥 SOLO punti del gruppo, NESSUN ANON
  const points = await PointModel.find({
     groupId: user.groupId 
    }).populate("user");

  console.log("🧾 [groupFeed] Punti trovati:", points.length);

  res.render("partials/groupFeed", { points, user });
});
*/

router.get('/indexZoneGeo', isAuthenticated, onlyField, async (req, res) => {
  try {
    const user = req.session.user;

    console.log("🧪 FIELD user:", user.email, "groupId:", user.groupId);

    // 🔍 Recupera il gruppo
    const group = await Group.findOne({ groupId: user.groupId });
    if (!group) {
      return res.status(400).send("Gruppo non trovato");
    }

    const plan = group.plan;
    const pointLimit = PLANS[plan].maxPoints;

    // 🔍 Office referente
    const referenteOffice = await User.findOne({
      role: 'office',
      groupId: user.groupId
    });
    const categories = referenteOffice?.categories || [];
    console.log("🧪 REFERENTE FINALE:", referenteOffice?.email || null);

    res.render('indexZoneGeo', {
      user,
      referenteOffice,
      plan,
      pointLimit,
      points: [],
      categories, // <-- aggiungi qui
    });

  } catch (err) {
    console.error("❌ Errore in /indexZoneGeo:", err);
    res.status(500).send("Errore interno");
  }
});

async function loadPointAndGroup(req, res, next) {
  try {
    const point = await PointModel.findById(req.params.id);
    if (!point) return res.status(404).send('Punto non trovato');
    req.point = point;
    req.resourceGroupId = point.groupId; // o come lo chiami nel DB
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send('Errore server');
  }
}

function onlyAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).send('Accesso negato');
}


router.get('/addPoint', isAuthenticated, onlyField, async (req, res) => {
  console.log("🔎 /addPoint SESSIONE:", req.session);
 // console.log("Accesso a /addPoint - sessione utente:", req.session?.user?._id || "Nessuna sessione");

  try {
       // 🔹 Utente field GARANTITO dai middleware
     const currentUser = await User.findById(req.session.user._id);

       // 🔹 Office dello stesso gruppo
    const office = await User.findOne({ role: 'office', groupId: currentUser.groupId });
       // 🔹 Categorie disponibili
    const categorieDisponibili = (office?.categories || []).map(c => ({
  name: c.name,
  icon: c.icon || 'red'
}));

  // 🔹 Fallback se office non ha categorie
if (categorieDisponibili.length === 0) {
  categorieDisponibili.push(
    { name: 'A', icon: 'red' },
    { name: 'B', icon: 'red' },
    { name: 'C', icon: 'red' },
    { name: 'D', icon: 'red' },
    { name: 'E', icon: 'red' }
  );
}

// 🔹 punti normali (già corretto)
const pointsCount = await PointModel.countDocuments({
  user: req.session.user._id
});

// 🔹 parcelle dell’utente
const parcelles = await ParcelleModel.find({
  user: req.session.user._id,
 // groupId: req.session.user.groupId
});

// 🔹 somma dei vertici delle parcelle
let parcellePointsCount = 0;
parcelles.forEach(p => {
  const coords = p.geometry?.coordinates?.[0] || [];
  parcellePointsCount += coords.length;
});

// 🔹 totale finale
const totalPointsCount = pointsCount + parcellePointsCount;

// 🔍 DEBUG (QUESTO È IL CONSOLE.LOG)
console.log(
  "🧮 POINT DEBUG →",
  "points:",
  pointsCount,
  "| parcelle points:",
  parcellePointsCount,
  "| TOTAL:",
  totalPointsCount
);
const planLimit = req.session.user.plan === "free" ? 10 : 80;

    // 🔁 Recupera l’utente field (per il rendering, se ti serve)
     // 🔹 Render
    res.render("ajoute_point", {
      title: 'Point Form Page',
      user: currentUser, // Passi l'oggetto user per usare dati utente nel template
      categories: categorieDisponibili, // ✅ Ora sono quelle dell'office
       pointsCount: totalPointsCount, // 👈 QUI
  planLimit  
    });
  } catch (error) {
    console.error("❌ Errore nel recupero categorie dall’utente office:", error);
    res.status(500).send("Errore interno del server");
  }
});

router.post('/update-categories', isAuthenticated, onlyOffice, async (req, res) => {
  console.log('🟡 [update-categories] INIZIO');
  console.log('📩 Body ricevuto:', JSON.stringify(req.body, null, 2));
console.log("SESSIONE:", req.session);

  try { 
        // ✅ Inizializza la variabile deleteResult all'inizio
    let deleteResult = { deletedCount: 0 };

        if (!req.session || !req.session.user) {
        console.log("❌ Sessione mancante in update-categories");
        return res.status(401).json({
        success: false,
        message: "Sessione scaduta o non autenticato"
  });
}
        if (req.session.user.role !== 'office') {
          return res.status(403).json({
            success: false,
            message: "Accesso riservato agli OFFICE"
          });
        }

  // 2️⃣ RECUPERO UTENTE
    const user = await User.findById(req.session.user._id);
    if (!user || user.role !== 'office') {
  return res.status(403).json({
    success: false,
    message: "Non autorizzato"
  });
}

    let updatedCategories = [];

    // 🧩 CASO 1 — aggiornamento MULTIPLO
    if (req.body.categories && Array.isArray(req.body.categories)) {
      console.log("🔁 Modalità MULTIPLA");
      console.log("📋 Ricevute categorie:", req.body.categories);

      const clean = req.body.categories
        .filter(c => c.name && c.name.trim())
        .map(c => {
          let finalIcon = c.icon || 'red';
          if (c.icon === 'custom' && c.customEmoji && c.customEmoji.trim() !== '') {
            finalIcon = c.customEmoji.trim();
          }
          console.log(`👉 Categoria pulita: ${c.name.trim()} (${finalIcon})`);
          return { name: c.name.trim(), icon: finalIcon };
        });

      user.categories = clean;
      await user.save();
      updatedCategories = user.categories;
      console.log("✅ Salvate su utente:", updatedCategories);

      await User.updateMany(
        { role: 'field', groupId: user.groupId },
        { $set: { categories: user.categories } }
      );
      console.log(`📡 Propagate ai field del gruppo ${user.groupId}`);
   
      // 🔹 Elimina punti orfani con categorie obsolete
const validCategoryNames = updatedCategories.map(c => c.name);

deleteResult = await PointModel.deleteMany({
  groupId: user.groupId,
  category: { $nin: validCategoryNames }
});

console.log(`🧹 Eliminati ${deleteResult.deletedCount} punti con categorie obsolete`);

   
    }
    
    // 🧩 CASO 2 — aggiornamento SINGOLO (vecchia UI)
    else if (req.body.newCategories) {
      console.log("🧩 Modalità SINGOLA");
      console.log("📩 Dati:", req.body);

      const { newCategories, icon, customEmoji } = req.body;
      let finalIcon = icon;
      if (icon === 'custom' && customEmoji && customEmoji.trim() !== '') {
        finalIcon = customEmoji.trim();
      }

      const parsedCategories = newCategories
        .split(',')
        .map(c => c.trim())
        .filter(Boolean)
        .map(c => ({ name: c, icon: finalIcon || 'red' }));

      console.log("👉 Parsed:", parsedCategories);

      user.categories = parsedCategories;
      await user.save();
      updatedCategories = user.categories;

      await User.updateMany(
        { role: 'field', groupId: user.groupId },
        { $set: { categories: user.categories } }
      );
      console.log(`📡 Propagate nuove categorie (singolo set) al gruppo ${user.groupId}`);
    }

    // 🧩 CASO 3 — aggiornamento icona singola
    else if (req.body.category && req.body.icon) {
      console.log("🎯 Modalità SINGOLA ICON UPDATE:", req.body);
      const { category, icon } = req.body;

      const result = await User.updateOne(
        { _id: user._id, "categories.name": category },
        { $set: { "categories.$.icon": icon || "red" } }
      );

      console.log("📌 Aggiornamento singola categoria:", result);
      const updatedUser = await User.findById(user._id);
      updatedCategories = updatedUser.categories;

      await User.updateMany(
        { role: 'field', groupId: user.groupId },
        { $set: { categories: updatedCategories } }
      );
      console.log(`📡 Propagate nuove icone singole ai field del gruppo ${user.groupId}`);
      // Aggiorna category dei punti per il nuovo nome/emoji
      // ⛔ Cancella punti con categorie NON più valide
const validCategoryNames = updatedCategories.map(c => c.name);

deleteResult = await PointModel.deleteMany({
  groupId: user.groupId,
  category: { $nin: validCategoryNames }
});

console.log(
  `🧹 Eliminati ${deleteResult.deletedCount} punti con categorie obsolete`
);

      // 1️⃣ Creiamo una mappa dai vecchi nomi ai nuovi nomi/icone
const oldToNewMap = {};
updatedCategories.forEach(c => {
  // Se hai i vecchi nomi li metti qui, altrimenti mappa nome → stesso nome
  oldToNewMap[c.name] = c.name; // se cambi solo l'emoji ma il nome resta, basta così
});

// 2️⃣ Recuperiamo tutti i punti del gruppo
const pointsToUpdate = await Point.find({ groupId: user.groupId });

// 3️⃣ Aggiorniamo lato JS
for (let p of pointsToUpdate) {
  if (oldToNewMap[p.category]) {
    // assegna il nuovo nome se cambia, e la nuova icona se vuoi
    p.category = oldToNewMap[p.category];
    // Se vuoi aggiornare anche l’icona direttamente:
    const newCat = updatedCategories.find(c => c.name === p.category);
    if (newCat) {
      p.icon = newCat.icon;
    }
    await p.save();
  }
}

console.log(`📌 Aggiornate categorie e icone dei punti per il gruppo ${user.groupId}`);


    }

    else {
      console.warn("⚠️ Formato req.body non riconosciuto:", req.body);
      return res.status(400).json({ success: false, message: "Formato dati non valido" });
    }

    console.log("✅ Categorie aggiornate FINAL:", updatedCategories);
return res.json({ success: true, 
  categories: updatedCategories,
  deletedPoints: deleteResult.deletedCount  // numero punti eliminati
 });


  } catch (err) {
    console.error("❌ Errore update-categories:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
});

// GET addParcelle
router.get("/addParcelle", isAuthenticated, async (req, res) => {
  console.log("Accesso a /addParcelle - sessione utente:", req.session?.user?._id || "Nessuna sessione");

  if (!req.session.user) {
    console.log("Utente non autenticato, reindirizzamento a /login");
    return res.redirect("/login");
  }

  try {
    // Recupera l'utente field attuale per ottenere il suo groupId
    const currentUser = await User.findById(req.session.user._id);

    // Recupera l’utente office dello stesso gruppo del field (per categorie)
    const office = await User.findOne({ role: 'office', groupId: currentUser.groupId });
    const categorieDisponibili = office?.categories || ['A', 'B', 'C', 'D', 'E'];
     
     // 🔁 Recupera l’utente field (per il rendering, se ti serve)
    const user = await User.findById(req.session.user._id);

    res.render("ajoute_parcelle", {
      title: 'Parcelle Form Page',
      user: user,                // Passi l'utente loggato
      categories: categorieDisponibili, // Le categorie collegate all’office
    });
  } catch (error) {
    console.error("❌ Errore in GET /addParcelle:", error);
    res.status(500).send("Errore interno del server");
  }
});
/*
router.use((req, res, next) => {
  console.log("🚨 SESSIONE PRIMA DELLE ROUTE:", req.session);
  next();
});
*/
// Gestisce la ricezione del punto dal form
router.post('/addPoint', isAuthenticated, onlyField, uploadSingle, async (req, res) => {
  
    if (!req.session.user) {
    console.warn("❌ Utente non autenticato nella sessione");
    return res.status(401).json({ message: "Utente non autenticato" });
  }
  try {
    console.log("\n=============================");
    console.log("📍 NUOVA RICHIESTA /addPoint");
    console.log("=============================\n");
    const userId = req.session.user?._id;
    const groupId = req.session.user?.groupId;
    console.log("👤 userId:", userId);
    console.log("🏷️ groupId dalla sessione:", groupId);
    console.log("📷 File ricevuto:", req.file ? req.file.filename : "❌ nessun file");

    const { name, point, category } = req.body;
    console.log("🧾 Tutto il body ricevuto:", req.body);

    // 🔍 Debug categorie
    console.log("📥 Categoria (raw):", category);
   const cleanCategory = (category || "").trim();
    console.log("📥 Categoria pulita:", cleanCategory);

    // Recupera utente field
    const fieldUser = await User.findById(userId);
    if (!fieldUser) {
      console.warn("❌ Nessun utente field trovato");
      return res.status(401).json({ message: "Utente non trovato" });
    }
    console.log("✅ Utente trovato:", fieldUser.email, "| groupId:", fieldUser.groupId);
     
    // 🔍 Recupera il gruppo
const group = await Group.findOne({ groupId: groupId });

if (!group) {
  console.warn("❌ Nessun gruppo trovato con groupId:", groupId);
  return res.status(400).json({ message: "Gruppo non trovato" });
}

console.log("🏷️ Piano del gruppo:", group.plan);
// 🔐 Controllo limite piano (1 punto = 1)
const planCheck = await checkPlanLimit(userId, groupId, 1);

// 🔎 LOG DI DEBUG (fondamentale)
console.log("🧪 PLAN CHECK ADD POINT:", {
  allowed: planCheck.allowed,
  plan: planCheck.plan,
  planLimit: planCheck.planLimit,
  pointsCount: planCheck.pointsCount,
  parcellePointsCount: planCheck.parcellePointsCount,
  totalUsedAfter: planCheck.totalUsed
});

if (!planCheck.allowed) {
  return res.status(403).json({
    success: false,
    message: `Limite de points atteinte pour le plan ${planCheck.plan}.`
  });
}

// const userPointLimit = PLANS[group.plan].maxPoints;
/*
// 🔹 Conta punti normali
const pointsCount = await PointModel.countDocuments({ user: userId });

// 🔹 Recupera parcelle dell'utente
const parcelles = await ParcelleModel.find({ user: userId });

// 🔹 Somma dei vertici delle parcelle
let parcellePointsCount = 0;
parcelles.forEach(p => {
  const coords = p.geometry?.coordinates?.[0] || [];
  parcellePointsCount += coords.length;
});

// 🔹 Totale punti usati
const totalUsed = pointsCount + parcellePointsCount;

console.log(`📦 Punti esistenti: ${pointsCount}, parcelle: ${parcellePointsCount}, TOTAL: ${totalUsed} / Limite piano: ${userPointLimit}`);

if (userPointLimit !== Infinity && totalUsed >= userPointLimit) {
  console.warn("⚠️ Limite de points atteint (punti + parcelle)");
  
  req.session.message = {
    type: "error",
    message: `Vous avez atteint la limite de points de votre plan actuel (${group.plan}). Veuillez demander à votre responsable office de passer au plan supérieur pour ajouter plus de points.`
  };

  return res.status(403).json({
    success: false,
    message: "Limite de points atteinte. Contactez votre office pour mettre à jour le plan."
  });
}
*/
    // Incrementa XP
    fieldUser.xp = (fieldUser.xp || 0) + 1;
    console.log(`XP aggiornati: ${fieldUser.xp}`);
    // Esempio badge: 5 punti -> “Beginner”
    if (fieldUser.xp === 2) {
        fieldUser.badges.push({ name: "Beginner", date: new Date() });
        console.log(`🏆 Nuovo badge assegnato a ${fieldUser.email}: Beginner`);
        var newBadge = "Beginner"; // 👈 aggiungi questa variabile
      }
      await fieldUser.save(); // Salva aggiornamenti XP e badge
    
    // 🔹 Aggiorna anche la sessione con il nuovo XP
req.session.user.xp = fieldUser.xp;
  // Cerca office dello stesso gruppo
    const office = await User.findOne({ role: "office", groupId: fieldUser.groupId });
    if (!office) {
      console.warn("❌ Nessun office trovato per il gruppo:", fieldUser.groupId);
      return res.status(400).json({ message: "Nessun office trovato per il tuo gruppo" });
    }
    console.log("✅ Office trovato:", office.email);

    // Verifica categoria valida
    const allowedCategories = (office.categories || []).map(c => {
      console.log("📌 Categoria office raw:", c); // log completo della categoria
      return c.name.trim();
    });
    console.log("📋 Categorie consentite dall'office:", allowedCategories);

    if (!allowedCategories.includes(cleanCategory)) {
      console.warn("❌ Categoria NON valida:", cleanCategory);
      return res.status(400).json({ message: "Categoria non valida" });
    }
    console.log("✅ Categoria valida:", cleanCategory);


    // Parsing del GeoJSON
    let parsedPoint = point;
    if (typeof parsedPoint === "string") {
      try {
        parsedPoint = JSON.parse(point);
      } catch (err) {
        console.error("❌ Errore parsing GeoJSON:", err.message);
        return res.status(400).json({ success: false, message: "GeoJSON non valido" });
      }
    }

    if (
      !parsedPoint ||
      parsedPoint.type !== "Feature" ||
      parsedPoint.geometry.type !== "Point" ||
      !Array.isArray(parsedPoint.geometry.coordinates) ||
      parsedPoint.geometry.coordinates.length !== 2 ||
      typeof parsedPoint.geometry.coordinates[0] !== "number" ||
      typeof parsedPoint.geometry.coordinates[1] !== "number"
    ) {
      console.error("❌ GeoJSON non valido:", parsedPoint);
      return res.status(400).json({ message: "Il dato GeoJSON deve essere un punto valido" });
    }
    console.log(`XP attuali: ${fieldUser.xp}`);
    const [lng, lat] = parsedPoint.geometry.coordinates;
    console.log("📍 Coordinate salvate:", { lng, lat });
    // Trova l'oggetto categoria corrispondente selezionata
const selectedCategoryObj = office.categories.find(c => c.name.trim() === cleanCategory);

// Usa l'icona della categoria, fallback a '❓' se nulla
const iconToUse = selectedCategoryObj?.icon || '❓';

  // 🔍 LOG EXTRA prima della creazione del punto
console.log("\n=============================");
console.log("📍 PREPARAZIONE NUOVO PUNTO");
console.log("=============================");
console.log("Nome:", name);
console.log("Categoria:", cleanCategory);
console.log("Coordinate [lng, lat]:", [lng, lat]);
console.log("File immagine:", req.file ? req.file.filename : "❌ nessun file");
console.log("GroupId:", groupId || fieldUser.groupId);
console.log("Icon:", iconToUse);

  // ✅ Crea il punto nel DB
  const newPoint = await PointModel.create({
     user: userId, // <--- qui
    name,
    category: cleanCategory,
    coordinates: [lng, lat],
    image: req.file ? `/uploads/${req.file.filename}` : null,
    groupId: groupId || fieldUser.groupId || null,
    icon: iconToUse,
  });
  fieldUser.xp = await PointModel.countDocuments({ user: fieldUser._id, isAnon: { $ne: true } });
await fieldUser.save();
req.session.user.xp = fieldUser.xp;

if (!mongoose.Types.ObjectId.isValid(userId)) {
  console.error("❌ userId non valido:", userId);
  return res.status(400).json({ message: "userId non valido" });
}

  console.log("✅ NUOVO PUNTO CREATO:", {
    id: newPoint._id.toString(),
    name: newPoint.name,
    category: newPoint.category,
    coordinates: newPoint.coordinates,
    groupId: newPoint.groupId,
    user: newPoint.user.toString(),
    image: newPoint.image
  });

// 🔹 Conteggio corretto dei punti del field
const userPointsCount = await PointModel.countDocuments({ user: fieldUser._id });
console.log(`🧮 PUNTI FIELD aggiornati: ${userPointsCount}`);

  // 🔹 Salva la sessione PRIMA della risposta
  req.session.save(err => {
    if (err) {
      console.error("❌ Errore salvataggio sessione:", err);
      return res.status(500).json({ message: "Errore salvataggio sessione" });
    }

    // 🔹 Solo qui puoi rispondere
    return res.status(200).json({
      success: true,
      message: "Point saved!",
      point: newPoint,
      xp: fieldUser.xp,
      newBadge: newBadge || null
    });
  });

} catch (err) {
  console.error("❌ ERRORE GENERALE in /addPoint:", err);
  return res.status(500).json({ message: "Errore interno del server" });
}
});   // <--- CHIUSURA del router.post(...)

router.get("/pricing", (req, res) => {
    const user = req.session.user;

    if (!user) {
        return res.redirect("/login");        // anonimi → login
    }

    if (user.role !== "office") {
        return res.redirect("/");   
    }

      res.render("pricing", { 
        user, 
        session: req.session // ✅ aggiungi session
    });

  });
// routes/articlesGeo.js o groups.js (dove tieni le route office)
router.post('/upgrade-plan', isAuthenticated, onlyOffice, async (req, res) => {
  console.log("🔑 Route /upgrade-plan raggiunta, utente:", req.session.user);
  console.log("📨 req.body:", req.body);

  try {
    const user = req.session.user;
    if (!user) return res.status(401).send("Non authentifié.");

    const group = await Group.findOne({ groupId: user.groupId });
    if (!group) return res.status(404).send("Groupe introuvable.");

    const { newPlan } = req.body;
    if (!newPlan || !["free", "pro", "enterprise"].includes(newPlan)) {
      return res.status(400).send("Plan invalide.");
    }

    // Aggiorna il piano del gruppo
    group.plan = newPlan;
    await group.save();
    console.log(`✅ Groupe ${group.groupId} passé au plan: ${newPlan}`);
    
    // 🔁 sincronizza sessione
    req.session.user.plan = newPlan;
    // Messaggio flash in francese
   
req.session.save(() => {
  res.redirect('/indexOfficeGeo');
});
    // 🔹 Redirect a /pricing (anziché res.json)
   // res.redirect('/indexOfficeGeo');

  } catch (err) {
    console.error("❌ Erreur /upgrade-plan:", err);
    req.session.message = { type: "error", message: "Erreur serveur, réessayez plus tard." };
    res.redirect('/pricing');
  }
});



// ✅ Gestisce la ricezione della parcella dal form
router.post("/ajoute_parcelle", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const { name, polygon, category } = req.body;

    console.log("🧾 Body ricevuto per parcella:", req.body);

    if (!name || !polygon) {
      return res.status(400).json({ message: "Tutti i campi sono obbligatori" });
    }

    // Recupera l’utente field loggato
    const fieldUser = await User.findById(userId);
    if (!fieldUser) {
      return res.status(401).json({ message: "Utente non trovato" });
    }
    // 🔹 Recupera il gruppo
const group = await Group.findOne({ groupId: fieldUser.groupId });

if (!group) {
  return res.status(400).json({ message: "Gruppo non trovato" });
}

console.log("🏷️ Piano del gruppo:", group.plan);
    // Cerca l’office del suo stesso gruppo
    const office = await User.findOne({
      role: "office",
      groupId: fieldUser.groupId
    });
    if (!office) {
      return res.status(400).json({ message: "Nessun office trovato per il tuo gruppo" });
    }
// Ottieni solo i nomi delle categorie dall'office
const allowedCategoryNames = (office?.categories || []).map(c => c.name.trim());

const cleanCategory = (category || "").trim();

if (!allowedCategoryNames.includes(cleanCategory)) {
  console.log("❌ Categoria NON valida:", cleanCategory);
  return res.status(400).json({ message: "Categoria non valida" });
} else {
  console.log("✅ Categoria valida:", cleanCategory);
}

    // (Opzionale) Limita numero parcelle per utente
   // const existingParcels = await ParcelleModel.countDocuments({ user: userId });
       // Parsing del poligono
    let parsedPolygon;
    try {
      parsedPolygon = typeof polygon === "string" ? JSON.parse(polygon) : polygon;
    } catch (err) {
      return res.status(400).json({ success: false, message: "GeoJSON non valido" });
    }

    // Se è solo geometry, trasformala in Feature
    if (parsedPolygon.type === "Polygon" && parsedPolygon.coordinates) {
      parsedPolygon = {
        type: "Feature",
        geometry: parsedPolygon,
        properties: {}
      };
    }

    // ✅ Controllo che sia un poligono valido
    if (
      !parsedPolygon ||
      parsedPolygon.type !== "Feature" ||
      !parsedPolygon.geometry ||
      parsedPolygon.geometry.type !== "Polygon" ||
      !Array.isArray(parsedPolygon.geometry.coordinates)
    ) {
      return res.status(400).json({
        message: "Il dato GeoJSON deve essere un Feature con geometry di tipo Polygon valido"
      });
    }

    // 🔹 Vertici della NUOVA parcella
const newParcelleVertices =
  parsedPolygon.geometry.coordinates?.[0]?.length || 0;

  const planCheck = await checkPlanLimit(
  userId,
  fieldUser.groupId,
  newParcelleVertices
);

console.log("🧪 PLAN CHECK PARCELLE:", planCheck);
if (!planCheck.allowed) {
  return res.status(403).json({
    success: false,
    code: "PLAN_LIMIT_REACHED",
    message:
      `Limite atteint (${planCheck.totalUsed}/${planCheck.planLimit})`
  });
}

  // Trova l'oggetto categoria corrispondente selezionata
const selectedCategoryObj = office.categories.find(c => c.name.trim() === cleanCategory);

// Usa l'icona della categoria, fallback a '❓' se nulla
const iconToUse = selectedCategoryObj?.icon || '❓';

    // Salvataggio nel DB
    await ParcelleModel.create({
      user: userId,
      name,
      category: cleanCategory,
      geometry: parsedPolygon.geometry, // salvo solo la geometry
      groupId: fieldUser.groupId,
       
    });

    console.log("👉 groupId usato per la nuova parcella:", fieldUser.groupId);

    req.session.message = {
      type: "success",
      message: "Parcella aggiunta con successo!"
    };

    res.status(200).json({ success: true, message: "Parcella salvata!" });

  } catch (err) {
    console.error("❌ Errore nel salvataggio della parcella:", err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});
router.get('/delete/:pointId', isAuthenticated, async (req, res) => {
  console.log("\n🌐 MATCHED ROUTE: /delete/:pointId");
  console.log("Param pointId:", req.params.pointId);

  const userId = req.session.user?._id;
  const pointId = req.params.pointId;

  try {
    // Cerca il punto e verifica che appartenga all’utente loggato
    const point = await PointModel.findOne({ _id: pointId, user: userId });

    if (!point) {
      console.warn(`⚠️ Punto non trovato o già eliminato`);
      // Redirigi comunque senza mostrare JSON
      return res.redirect('/indexZoneGeo');
    }

    // Elimina il punto
    await PointModel.deleteOne({ _id: pointId });

    // Ricalcola XP
    const newXp = await PointModel.countDocuments({ user: userId });

    // Aggiorna DB utente
    await User.findByIdAndUpdate(userId, { xp: newXp });

    // Aggiorna la sessione
    req.session.user.xp = newXp;

    req.session.save(err => {
      if (err) {
        console.error("❌ Errore salvataggio sessione:", err);
        // Anche in caso di errore di sessione, redirect comunque
        return res.redirect('/indexZoneGeo');
      }

      console.log(`🗑️ Punto ${pointId} eliminato con successo`);
      // Redirect alla pagina principale dei punti
      return res.redirect('/indexZoneGeo');
    });

  } catch (err) {
    console.error('❌ Errore durante l\'eliminazione del punto:', err);
    // Redirect sempre, anche in caso di errore
    return res.redirect('/indexZoneGeo');
  }
});


router.get('/delete-point/:parcelleId', async (req, res) => {
  console.log("\n🌐 MATCHED ROUTE: /delete-point/:parcelleId");
  console.log("URL richiesto:", req.originalUrl);
  console.log("Param parcelleId:", req.params.parcelleId);
  try {
    const userId = req.session.user?._id;
    const parcelleId = req.params.parcelleId;
   
    console.log(`\n=== INIZIO DELETE POINT ===`);
    console.log(`ID utente: ${userId}`);
    console.log(`Parcelle ID: ${parcelleId}`);
 
    // Trova la parcella
    const parcelle = await ParcelleModel.findOne({ _id: parcelleId, user: userId });

    if (!parcelle) {
      console.log(`Parcella non trovata o non autorizzato`);
      return res.status(404).send('Parcella non trovata o non autorizzato');
    }
// Verifica se il poligono è chiuso (prima == ultima)
const { lat, lng } = req.query;
const coords = parcelle.geometry.coordinates[0];

const indexToRemove = coords.findIndex(
  pt => pt[0] === parseFloat(lng) && pt[1] === parseFloat(lat)
);
if (indexToRemove === -1) {
  console.log(`❌ Punto con lat=${lat}, lng=${lng} non trovato nella parcella.`);
  return res.status(400).send('Punto non trovato');
}
    // Rimuove il punto
    coords.splice(indexToRemove, 1);
        
    const isClosed = JSON.stringify(coords[0]) === JSON.stringify(coords[coords.length - 1]);
    // Crea array di punti distinti
    const uniquePoints = isClosed ? coords.slice(0, -1) : coords;

    if (uniquePoints.length <= 3) {
      await ParcelleModel.deleteOne({ _id: parcelleId });
      console.log(`🗑️ Parcella ${parcelleId} eliminata perché aveva meno di 3 punti.`);
      return res.redirect('/indexZoneParcelle');
    }

    // Ricostruisce il poligono chiuso
    if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
      coords.push(coords[0]); // Chiude il poligono se non è già chiuso
      console.log(`🔄 Poligono chiuso automaticamente.`);
    }

    // Aggiorna la parcella
    await ParcelleModel.updateOne(
      { _id: parcelleId },
      { $set: { 'geometry.coordinates.0': coords } }
    );
console.log(`✅ Punto lat=${lat}, lng=${lng} rimosso da parcella ${parcelleId}`);
    console.log(`Nuove coordinate (${coords.length}):`, coords);
    console.log(`=== FINE DELETE POINT ===\n`);

    res.redirect('/indexZoneParcelle');
  } catch (err) {
    console.error('❌ Errore durante la rimozione del punto:', err);
    res.status(500).send('Errore del server');
  }
});

router.get('/delete-parcelle/:id', isAuthenticated, async (req, res) => {
  
    console.log("\n🌐 MATCHED ROUTE: /delete-parcelle/:id");
  console.log("URL richiesto:", req.originalUrl);
  console.log("Param id:", req.params.id);

  const userId = req.session.user?._id;
  const parcelleId = req.params.id;

  try {
    const parcelle = await ParcelleModel.findOne({ _id: parcelleId, user: userId });

    if (!parcelle) {
      console.warn(`⚠️ Parcelle non trovata o accesso non autorizzato`);
      return res.status(404).send('Parcelle non trovata o accesso non autorizzato');
    }

    await ParcelleModel.deleteOne({ _id: parcelleId });

    console.log(`🗑️ Parcelle ${parcelleId} eliminata con successo`);
    res.redirect('/indexZoneParcelle?view=parcelles');
  } catch (err) {
    console.error('❌ Errore durante l\'eliminazione della parcella:', err);
    res.status(500).send('Errore del server');
  }
});
/*router.post('/users/cleanup-groups', isAdmin, async (req, res) => {
  const officeGroupIds = await User.find({ role: "office" }).distinct("groupId");
  const result = await Group.deleteMany({ groupId: { $nin: officeGroupIds } });
  res.send(`Pulizia completata. Eliminati ${result.deletedCount} gruppi orfani`);
});*/

router.param("pointId", async (req, res, next, pointId) => {
  console.log("\n🔧 router.param('pointId') TRIGGERED");
  console.log("URL:", req.originalUrl);
  console.log("pointId ricevuto:", pointId);

  if (!pointId || pointId === "undefined") {
    return res.status(400).json({ error: "ID punto mancante" });
  }

  try {
    const point = await PointModel.findById(pointId);
    if (!point) {
      return res.status(404).json({ error: "Punto non trovato" });
    }
    req.point = point;
    next();
  } catch (err) {
    console.error("❌ Errore DB:", err);
    res.status(500).json({ error: "Errore server" });
  }
});


function logger(req, res, next) {
  console.log(req.originalUrl)
  next()
}
// ✅ Endpoint per ottenere sempre le categorie aggiornate dell’utente loggato
router.get("/api/categories", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Utente non trovato" });
    }

    res.json({ success: true, categories: user.categories || [] });
  } catch (err) {
    console.error("❌ Errore /api/categories:", err);
    res.status(500).json({ success: false, message: "Errore server" });
  }
});

module.exports = router