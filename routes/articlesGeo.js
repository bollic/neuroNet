const express = require("express");
const router = express.Router();
const fs = require('fs');
const path = require('path');  // <--- aggiungi questa riga
const bcrypt = require('bcrypt'); // Utilisé pour comparer les mots de passe hachés

const mongoose = require('mongoose');
const User = require('../models/users');
const PointModel = require('../models/Point'); 
const ParcelleModel = require('../models/Parcelle'); 

// Ottieni ObjectId da Mongoose
const ObjectId = mongoose.Types.ObjectId;
const multer = require('multer');
router.use(logger);

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

// Configurazione di multer per gestire più immagini
const uploadSingle = multer({ storage }).single("image");
/*
router.get('/', async (req, res) => {
  try {       
    const user = req.session.user || null;
    const userId = user ? user._id : null;

    res.render('index', {
      title: 'La liste des points',
      session: req.session,
      user: user,
    });
  } catch (error) {
    console.error('Errore durante la ricerca degli articoli:', error);
    res.status(500).send('Erreur lors de la récupération des points');
  }
});
*/


router.get('/', async (req, res) => {
  try {
  console.log("➡️ Entrato in / con sessione:", req.session);
  const user = req.session.user || null;
  console.log("👤 Utente:", user);
    // 👇 Redireziona subito in base al ruolo
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
    // 1) Trova tutti i gruppi unici
    const groupIds = await User.distinct("groupId", { groupId: { $ne: null } });

    const groupsPreview = [];

    for (const groupId of groupIds) {
      // 2) Tutti i membri del gruppo
      const members = await User.find({ groupId }).select("email role").lean();

      // 3) Punti del gruppo
      const pointsCount = await PointModel.countDocuments({ groupId });

      // 4) Preview: prendo max 5 membri (puoi cambiare numero)
      const membersPreview = members.slice(0, 5);

      groupsPreview.push({
        groupId,
        totalMembers: members.length,
        pointsCount,
        membersPreview // contiene email e role
      });
    }

    res.render('index', {
      title: 'La liste des points',
      session: req.session,
      user,
      groupsPreview // 🔑 Passiamo i dati alla view
    });

  } catch (error) {
    console.error('❌ Errore durante caricamento index:', error);
    res.status(500).send('Erreur lors de la récupération des groupes');
  }
});

router.get('/groups/:groupId', async (req, res) => {
  const { groupId } = req.params;
  
  const groupMembers = await User.find({ groupId });
  const points = await PointModel.find({ groupId });

  res.render('group-detail', {
    groupId,
    members: groupMembers,
    points
  });
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

    const view = req.query.view;
    if (view === 'parcelles') {
      return res.render('mesParcelles', {
        user,
        parcelles,
        session: req.session
      });
    }

    // Vista standard con mappa
    res.render('indexZoneParcelle', {
      user,
      parcelles,
      session: req.session
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

router.get("/indexOfficeGeo", isAuthenticated, onlyOffice, async (req, res) => {
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

    const categories = currentUser.categories || ["A", "B", "C", "D", "E"];

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

    // Messaggi da sessione
    const message = req.session.message;
    req.session.message = null;

   // render: PASSA SOLO l'array piatto (pointsForClient) al client
res.render("indexOfficeGeo", {
  points,           // già con userEmail e userId
  fieldUsers,       // array field users (utile lato client)
  categories,
  user: req.session.user,
  groupId: currentUser.groupId,
  session: req.session,
  message
});

  } catch (err) {
    console.error("❌ Errore nel recupero punti per office:", err);
    res.status(500).send("Errore interno del server");
  }
});

// ===========================
// GET /groupFeed
// ===========================
router.get("/groupFeed", isAuthenticated, onlyField, async (req, res) => {
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

  const points = await PointModel.find({ groupId: user.groupId }).populate(
    "user"
  );
  console.log("🧾 [groupFeed] Punti trovati:", points.length);

  res.render("partials/groupFeed", { points, user });
});

 router.get('/indexZoneGeo', isAuthenticated, onlyField,  async (req, res) => {

     console.log('📍 ROUTE /indexZoneGeo chiamata');
  console.log('📦 Sessione attuale:', req.session);
  console.log('👤 Utente nella sessione:', req.session.user);

   const userId = req.session.user ? req.session.user._id : null;
      console.log("Session user:", req.session.user);
  const user = await User.findById(req.session.user._id);

  if (!user || !user._id) {
    console.warn('⚠️ user non autenticato o senza _id');
    return res.status(401).send('user non autenticato');
  }
 // const userId = user._id;
  if (!userId) {
    console.warn('⚠️ userId non definito, utente non autenticato');
    return res.status(401).send('userId non autenticato');
  }
  try {
    const points = await PointModel.find({ user: userId }).limit(30).populate('user');
    console.log('🧾 Points caricati:', points.map(p => ({ name: p.name, category: p.category })));
     
    // 👇 Recupera l'office del gruppo corrente
    const referenteOffice = await User.findOne({
      role: 'office',
      groupId: user.groupId
    });

    // 🔽🔽🔽 AGGIUNGI QUESTO BLOCCO QUI
    const view = req.query.view;
    if (view === 'points') {
      return res.render('mesPoints', {
        user,
        points,
        session: req.session,
        referenteOffice   // 🔥 passa l’office anche qui
      });
    }

    // 🎯 Se non è "view=points", carica la vista mappa classica
    res.render('indexZoneGeo', {
      user,
      points,
      categories: user.categories,  // 👈 AGGIUNGI QUESTO
      session: req.session,
      referenteOffice   // 🔥 passa l’office anche qui
     
    });
  } catch (error) {
      console.error(error);
      res.status(500).send('Errore del server');
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
function onlyField(req, res, next) {
  if (req.session.user?.role === 'field') {
    return next();
  }
  return res.status(403).send("Accesso riservato ai FIELD");
}


function onlyOffice(req, res, next) {
  if (!req.session.user) {
    return res.status(403).send("Devi essere loggato");
  }
  if (req.session.user.role !== 'office') {
    return res.status(403).send("Accesso riservato agli OFFICE");
  }
  return next();
}

function isAuthenticated(req, res, next) {
  const user = req.session?.user;
  console.log("🧪 Verifica autenticazione - sessione utente:", user);

  
  if (user?.email && user?.role) {
    return next();
  }

  console.log("❌ Utente non autenticato, reindirizzamento a /login");
  req.session.redirectTo = req.originalUrl;
  return res.redirect('/login');
}
//VADO A: qs e' l indirizzo web , cioe la ROUTE addForm, che vedo nell'internet
// Links http://localhost:4000/addForm

router.get("/addPoint", isAuthenticated, async (req, res) => {
  console.log("Accesso a /addPoint - sessione utente:", req.session?.user?._id || "Nessuna sessione");

  if (!req.session.user) {
    console.log("Utente non autenticato, reindirizzamento a /login");
    return res.redirect("/login");
  }

  try {
     // Recupera l'utente field attuale per prendere il suo groupId
     const currentUser = await User.findById(req.session.user._id);

    // Recupera l’utente office dello stesso gruppo del field
    const office = await User.findOne({ role: 'office', groupId: currentUser.groupId });
    const categorieDisponibili = office?.categories || ['A', 'B', 'C', 'D', 'E'];

    // 🔁 Recupera l’utente field (per il rendering, se ti serve)
    const user = await User.findById(req.session.user._id);

    res.render("ajoute_point", {
      title: 'Point Form Page',
      user: user, // Passi l'oggetto user per usare dati utente nel template
      categories: categorieDisponibili // ✅ Ora sono quelle dell'office
    });
  } catch (error) {
    console.error("❌ Errore nel recupero categorie dall’utente office:", error);
    res.status(500).send("Errore interno del server");
  }
});

// office modifica le categorie "globali"
router.post('/update-categories', async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    if (!user || user.role !== 'office') {
      return res.status(403).send("Non autorizzato");
    }

    const parsedCategories = req.body.newCategories
      .split(',')
      .map(c => c.trim().toUpperCase())
      .filter(Boolean);

    user.categories = parsedCategories;
    await user.save();

    console.log("✅ Categorie globali aggiornate da office:", parsedCategories);
    res.redirect('/indexOfficeGeo');
  } catch (err) {
    console.error("❌ Errore aggiornamento categorie:", err);
    res.status(500).send("Errore del server");
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



// Gestisce la ricezione del punto dal form
router.post("/addPoint", isAuthenticated, uploadSingle, async (req, res) => {
  try {
    const userId = req.session.user?._id;     
      // Qui Multer popola `req.file` se l'immagine è presente
    console.log("📷 File ricevuto:", req.file);
   const { name, point, category } = req.body;
    console.log("🧾 Tutto il body ricevuto:", req.body);

    // 🔍 DEBUG
    console.log("📥 Categorie ricevuta dal form (raw):", category);
    console.log("📥 Categorie pulita:", (category || '').trim().toUpperCase());

    // Verifica la struttura dei dati
    console.log("GeoJSON ricevuto:", point);
    console.log("Type:", typeof point);
    // Controllo campi obbligatori
    if (!name || !point ) {
      return res.status(400).json({ message: "Touts les champs sonts obligoitoires" });
    }
          // Recupera l'utente field loggato
      const fieldUser = await User.findById(userId);
      if (!fieldUser) {
        return res.status(401).json({ message: "Utente non trovato" });
      }
  // Cerca l'office del suo stesso gruppo
    const office = await User.findOne({ role: 'office',
       groupId: fieldUser.groupId
    });
    
    if (!office) {
        return res.status(400).json({ message: "Nessun office trovato per il tuo gruppo" });
      }

    const allowedCategories = office?.categories || ['A', 'B', 'C', 'D', 'E'];
    // ✅ Pulizia: rimuove spazi e uniforma maiuscolo
    const cleanCategory = (category || '').trim().toUpperCase();

      if (!allowedCategories.includes(cleanCategory)) {
        console.log("❌ Categoria NON valida:", cleanCategory);
        return res.status(400).json({ message: "Categoria non valida" });
      } else {
        console.log("✅ Categoria valida:", cleanCategory);
      }

    // (Opzionale) Limita numero punti per utente
    const existingPoints = await PointModel.countDocuments({
      user: userId,
      type: "point",
    
    });

    if (existingPoints >= 5) { 
      return res.status(400).json({ message: "Hai già inserito troppi punti" });
    }
      // Parsing GeoJSON
    let parsedPoint = point;

    if (typeof parsedPoint === "string") {
    try {
      parsedPoint = JSON.parse(point);
    } catch (err) {
      return res.status(400).json({ success: false, message: "GeoJSON non valido" });
    }
    }
    // ✅ Controllo automatico della validità delle coordinate
  if (
    !parsedPoint ||
    parsedPoint.type !== "Feature" ||
    parsedPoint.geometry.type !== "Point" ||
    !Array.isArray(parsedPoint.geometry.coordinates) ||
    parsedPoint.geometry.coordinates.length !== 2 ||
    typeof parsedPoint.geometry.coordinates[0] !== "number" ||
    typeof parsedPoint.geometry.coordinates[1] !== "number"
  ) {
    return res.status(400).json({
      message: "Il dato GeoJSON deve essere un punto valido (type 'Point' con coordinate [lng, lat])"
    });
  }

    const [lng, lat] = parsedPoint.geometry.coordinates;

   // Salva nel DB anche il path dell'immagine
   await PointModel.create({
    user: userId,
    name,
    category: cleanCategory,
    coordinates: [lng, lat],
    image: req.file ? `/uploads/${req.file.filename}` : null, // salvo URL del file
    groupId: req.session.user.groupId // 👈 così il punto è legato al gruppo
  
  });
  
console.log("👉 groupId usato per il nuovo point:", req.session.user.groupId);

    req.session.message = {
      type: "success",
      message: "Point added!"
    };

    res.status(200).json({ success: true, message: "Point saved!" });

  } catch (err) {
    console.error("Error on saving point:", err);
    res.status(500).json({ message: "Errore interno del server" });
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

    // Cerca l’office del suo stesso gruppo
    const office = await User.findOne({
      role: "office",
      groupId: fieldUser.groupId
    });
    if (!office) {
      return res.status(400).json({ message: "Nessun office trovato per il tuo gruppo" });
    }

    const allowedCategories = office?.categories || ["A", "B", "C", "D", "E"];
    const cleanCategory = (category || "").trim().toUpperCase();

    if (!allowedCategories.includes(cleanCategory)) {
      console.log("❌ Categoria NON valida:", cleanCategory);
      return res.status(400).json({ message: "Categoria non valida" });
    } else {
      console.log("✅ Categoria valida:", cleanCategory);
    }

    // (Opzionale) Limita numero parcelle per utente
    const existingParcels = await ParcelleModel.countDocuments({ user: userId });
    if (existingParcels >= 5) {
      return res.status(400).json({ message: "Hai già inserito troppe parcelle" });
    }

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

    // Salvataggio nel DB
    await ParcelleModel.create({
      user: userId,
      name,
      category: cleanCategory,
      geometry: parsedPolygon.geometry, // salvo solo la geometry
      groupId: fieldUser.groupId
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
  const userId = req.session.user?._id;
  const pointId = req.params.pointId;

  try {
    // Cerca il punto e verifica che appartenga all’utente loggato
    const point = await PointModel.findOne({ _id: pointId, user: userId });

    if (!point) {
      console.warn(`⚠️ Punto non trovato o accesso non autorizzato`);
      return res.status(404).send('Punto non trovato o accesso non autorizzato');
    }

    // Elimina il punto
    await PointModel.deleteOne({ _id: pointId });

    console.log(`🗑️ Punto ${pointId} eliminato con successo`);
    res.redirect('/indexZoneGeo?view=points');
  } catch (err) {
    console.error('❌ Errore durante l\'eliminazione del punto:', err);
    res.status(500).send('Errore interno del server');
  }
});

router.get('/delete-point/:parcelleId', async (req, res) => {
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
router.param("pointId", async (req, res, next, pointId) => {
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

module.exports = router