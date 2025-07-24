const express = require("express");
const router = express.Router();
const fs = require('fs');
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
    cb(null, file.originalname); // Nome file originale
  },
});

// Configurazione di multer per gestire più immagini
var upload = multer({
  storage: storage,
}).fields([
  { name: 'image_0', maxCount: 1 },
  { name: 'image_1', maxCount: 1 },
  { name: 'image_2', maxCount: 1 },
]);

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

/*
 router.get('/indexZoneParcelle',  isAuthenticated, onlyField,  async (req, res) => {
  try {
  const userId = req.session.user ? req.session.user._id : null;
      
     if (!userId) {
      // Se non c'è un utente loggato, rimanda alla home o mostra un messaggio di errore
      return res.status(401).send('Utente non autenticato');
    } 

    const parcelles = await ParcelleModel.find({ user: userId }).limit(30).populate('user');
        // 🔽🔽🔽 AGGIUNGI QUESTO BLOCCO QUI
    const view = req.query.view;
    if (view === 'parcelles') {
      return res.render('mesParcelles', {
        userId,
        parcelles,
        session: req.session
      });
    }
       // Passa i dati raggruppati alla vista
    res.render('indexZoneParcelle', { 
      parcelles, // 👈 aggiunto
      session: req.session, // Passer la session à la vue
      user: req.session.user, // Vérifiez si un user est connecté
   
    });
  } catch (error) {
      console.error(error);
      res.status(500).send('Errore del server');
  }
});  
*/

router.get('/indexOfficeParcelle', isAuthenticated, onlyOffice, async (req, res) => {
  try {
    if (req.session.user.role !== 'office') {
      return res.redirect('/');
    }

    // Trova tutti gli utenti con ruolo "field"
    const fieldUsers = await User.find({ role: 'field' }).select('_id');
    const fieldUserIds = fieldUsers.map(user => user._id);

    // Trova tutte le parcelle create da questi utenti
    const parcelles = await ParcelleModel.find({ user: { $in: fieldUserIds } }).populate('user');

    const message = req.session.message;
    req.session.message = null;

    res.render('indexOfficeParcelle', {
      user: req.session.user,
      parcelles,
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
    if (req.session.user.role !== 'office') {
      return res.redirect('/');
    }

    // Recupera tutti gli ID degli utenti field
    const fieldUsers = await User.find({ role: 'field' }).select('_id');
    console.log('Utenti con ruolo "field" trovati:', fieldUsers.length);
    console.log('ID utenti field:', fieldUsers.map(u => u._id.toString()));

    const fieldUserIds = fieldUsers.map(user => user._id);

    // Recupera TUTTI i punti nel DB (debug temporaneo)
    const allPoints = await PointModel.find().populate('user');
    console.log('📦 [DEBUG] Tutti i punti nel DB (grezzi):');
    allPoints.forEach((p, i) => {
       const creatorEmail = p.user?.email || '❓(utente mancante)';
      console.log(`[${i + 1}] Punto: ${p.name}, creato da email : ${creatorEmail}, user: ${p.user?._id}`);
    });

    // Recupera SOLO i punti creati da utenti con ruolo 'field'
    const points = await PointModel.find({ user: { $in: fieldUserIds } }).populate('user');
    console.log('🎯 [DEBUG] Punti filtrati da utenti "field":', points.length);

    const message = req.session.message;
    req.session.message = null;

    res.render('indexOfficeGeo', {
      user: req.session.user,
      points,
      session: req.session,
      message
    });

  } catch (err) {
    console.error('❌ Errore nel recupero dei punti per office:', err);
    res.status(500).send('Errore interno del server');
  }
});


 router.get('/indexZoneGeo', isAuthenticated, onlyField,  async (req, res) => {

     console.log('📍 ROUTE /indexZoneGeo chiamata');
  console.log('📦 Sessione attuale:', req.session);
  console.log('👤 Utente nella sessione:', req.session.user);

   const userId = req.session.user ? req.session.user._id : null;
      console.log("Session user:", req.session.user);
   const user = req.session.user;
  if (!user || !user._id) {
    console.warn('⚠️ user non autenticato o senza _id');
    return res.status(401).send('use non autenticato');
  }
 // const userId = user._id;
  if (!userId) {
    console.warn('⚠️ userId non definito, utente non autenticato');
    return res.status(401).send('userId non autenticato');
  }
  try {
    const points = await PointModel.find({ user: userId }).limit(30).populate('user');
     // 🔽🔽🔽 AGGIUNGI QUESTO BLOCCO QUI
    const view = req.query.view;
    if (view === 'points') {
      return res.render('mesPoints', {
        user,
        points,
        session: req.session
      });
    }

    // 🎯 Se non è "view=points", carica la vista mappa classica
    res.render('indexZoneGeo', {
      user: req.session.user,
      points,
      session: req.session
     
    });
  } catch (error) {
      console.error(error);
      res.status(500).send('Errore del server');
  }
});  

function onlyAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).send('Accesso negato');
}

function onlyField(req, res, next) {
  if (req.session.user && req.session.user.role === 'field') {
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
  next();
}
function isAuthenticated(req, res, next) {
  const user = req.session?.user;
  console.log("🧪 Verifica autenticazione - sessione utente:", user);

  if (user && user.email && user.role) {
    return next();
  } else {
    console.log("❌ Utente non autenticato, reindirizzamento a /login");
    req.session.redirectTo = req.originalUrl;
    return res.redirect('/login');
  }
}
//VADO A: qs e' l indirizzo web , cioe la ROUTE addForm, che vedo nell'internet
// Links http://localhost:4000/addForm
router.get("/addPoint", isAuthenticated, (req, res) => {
  // Log per vedere se l'utente è stato autenticato correttamente e cosa contiene la sessione
  console.log("Accesso a /addPoint - sessione utente:", req.session ? req.session.user._id : "Nessuna sessione");

  if (req.session.user) {
  res.render("ajoute_point", { title: 'Point Form Page', user: req.session.user});
  
} else {
    // Log per verificare se si viene reindirizzati al login
    console.log("Utente non autenticato, reindirizzamento a /login");
  res.redirect("/login");  // Se l'utente non è loggato, reindirizza alla pagina di login
}
});


//VADO A: qs e' l indirizzo web , cioe la ROUTE addForm, che vedo nell'internet
// Links http://localhost:4000/addForm
router.get("/addParcelle", isAuthenticated, (req, res) => {
  // Log per vedere se l'utente è stato autenticato correttamente e cosa contiene la sessione
  console.log("Accesso a /addParcelle - sessione utente:", req.session ? req.session.user._id : "Nessuna sessione");

  if (req.session.user) {
  res.render("ajoute_parcelle", { title: 'Parcelle Form Page', user: req.session.user});
  
} else {
    // Log per verificare se si viene reindirizzati al login
    console.log("Utente non autenticato, reindirizzamento a /login");
  res.redirect("/login");  // Se l'utente non è loggato, reindirizza alla pagina di login
}
});


// Gestisce la ricezione del punto dal form
router.post("/ajoute_point", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user?._id;   
  
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
   const allowedCategories = ['', 'A', 'B', 'C', 'D', 'E'];

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
    // Parsing del GeoJSON
    const parsedPoint = typeof point === 'string' ? JSON.parse(point) : point;
    
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

  
   await PointModel.create({
    user: userId,
    name,
    category: cleanCategory,
    coordinates: [lng, lat]
  });
  

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

router.post("/ajoute_parcelle", isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const { name, polygon } = req.body;

    // Verifica
    console.log("GeoJSON ricevuto:", polygon);
    console.log("Type:", typeof polygon);

    if (!name || !polygon) {
      return res.status(400).json({ message: "Tutti i campi sono obbligatori" });
    }

    // (Opzionale) Limita numero parcelle per utente
    const existingParcels = await ParcelleModel.countDocuments({ user: userId });
    if (existingParcels >= 5) {
      return res.status(400).json({ message: "Hai già inserito troppe parcelle" });
    }

    const parsedPolygon = typeof polygon === 'string' ? JSON.parse(polygon) : polygon;

    // ✅ Controllo che sia un poligono valido
   if (
  !parsedPolygon ||
  parsedPolygon.type !== "Polygon" ||
  !Array.isArray(parsedPolygon.coordinates)
) {
  return res.status(400).json({
    message: "Il dato GeoJSON deve essere un Polygon valido"
  });
}


    // Salvataggio nel DB
    await ParcelleModel.create({
      user: userId,
      name,
      geometry: parsedPolygon
    });

    req.session.message = {
      type: "success",
      message: "Parcella aggiunta con successo!"
    };
    res.redirect('/indexZoneParcelle');

    //res.status(200).json({ success: true, message: "Poligono salvato!" });

  } catch (err) {
    console.error("Errore nel salvataggio della parcella:", err);
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