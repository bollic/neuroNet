const express = require("express");
const router = express.Router();
const fs = require('fs');
const bcrypt = require('bcryptjs'); // Utilisé pour comparer les mots de passe hachés
const mongoose = require('mongoose');

const User = require('../models/users');
const PointModel = require('../models/Point'); // aggiorna il path se necessario
const Group = require('../models/Group');
const PLANS = require('../config/plans');
router.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});


// Questo è l'unico utente ammesso
const SINGLE_USER = {
  email: 'coucou@gmail.com',  // username predefinito
  passwordHash: '$2b$06$GtC0vGOQhPdDKClVdMOLXuYhO54UTzDoahZrPDYNH.HPdAjiLCrP6'
    // Hash della password predefinita (es. "password123")
};
// Middleware pour vérifier si l'user est connecté
function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.email === SINGLE_USER.email) {

    return next(); // Si l'admin est connecté, continuer l'exécution
  } else {
    // Memorizza la route originaria nella sessione per redirigere dopo il lgin
    req.session.redirectTo = req.originalUrl;
    return res.redirect('/login'); 
   }
}

//VADO A: qs e' l indirizzo web ed event. Links http://localhost:3000/login
router.get("/login", (req, res) => {
  //recupero qs file da ejs
  res.render("login", { title: 'Form Page', error: null, success: req.session.success || null })
});
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Tentativo di login con:', email);
  console.log('🧪 Password in chiaro dal form:', password);

  // Caso 1: SINGLE_USER (admin hardcoded)
  if (email === SINGLE_USER.email) {
    const passwordMatch = await bcrypt.compare(password, SINGLE_USER.passwordHash);

    if (!passwordMatch) {
      return res.status(401).send('Login: Email o password errata.');
    }

    // Rigenera sessione per sicurezza
    req.session.regenerate((err) => {
      if (err) {
        console.error('Errore nel rigenerare la sessione (SINGLE_USER):', err);
        return res.status(500).send('Errore di sessione');
      }

      req.session.user = {
        email: SINGLE_USER.email,
        isAdmin: true,
        role: 'admin'
      };

      // Salva e redirect (unico save)
      const redirectTo = req.session.redirectTo || '/users';
      req.session.save((err) => {
        if (err) {
          console.error('Errore nel salvataggio della sessione (SINGLE_USER):', err);
          return res.status(500).send("Errore nel salvataggio della sessione");
        }
        delete req.session.redirectTo;
        console.log('Redirect effettuato verso (SINGLE_USER):', redirectTo);
        return res.redirect(redirectTo);
      });
    });

    return; // importante: esci qui
  }

  // Caso 2: utente dal DB
  try {
    const userFromDb = await User.findOne({ email });
    if (!userFromDb) {
      console.log('Email non trovata nel DB');
      return res.status(401).send('Login: Email o password non corretta.');
    }

    // debug password
    console.log('🔑 Password nel DB (userFromDb.password):', userFromDb.password);
    const passwordMatch = await bcrypt.compare(password, userFromDb.password);
    console.log('🧪 Match bcrypt? →', passwordMatch);

    if (!passwordMatch) {
      console.log('Password errata nel DB');
      return res.status(401).send('Email o password errata.');
    }

    // calcola XP prima di rigenerare la sessione
 const userXp = await PointModel.countDocuments({ user: userFromDb._id, isAnon: { $ne: true } });

console.log("🧮 PUNTI FIELD:", userXp);

    console.log("🔥 XP calcolato al login:", userXp);
   
    let groupPlan = 'free';

if (userFromDb.role === 'office' && userFromDb.groupId) {
  const group = await Group.findOne({ groupId: userFromDb.groupId });
  if (group) {
    groupPlan = group.plan;
  }
}

    // rigenera sessione
    req.session.regenerate(function (err) {
      if (err) {
        console.error('Errore nel rigenerare la sessione:', err);
        return res.status(500).send("Errore di sessione");
      }

  // 1️⃣ imposta user in sessione
      req.session.user = {
        _id: userFromDb._id,
        email: userFromDb.email,
        role: userFromDb.role,
        groupId: userFromDb.groupId,
        isAdmin: userFromDb.role === 'admin',
        xp: userXp,
       plan: groupPlan        // ⭐ QUI
      };

     // 2️⃣ calcola redirect PRIMA del save
      let redirectTo = req.session.redirectTo;
      if (!redirectTo) {
        switch (userFromDb.role) {
          case 'field':
            redirectTo = '/indexZoneGeo';
            break;
          case 'office':
            redirectTo = '/indexOfficeGeo';
            break;
          case 'admin':
            redirectTo = '/users';
            break;
          default:
            redirectTo = '/';
        }
      }

 // 3️⃣ salva UNA VOLTA SOLA e poi redirect
      req.session.save((err) => {
        if (err) {
          console.error('❌ Errore nel salvataggio della sessione:', err);
          return res.status(500).send("Errore nel salvataggio della sessione");
        }
        delete req.session.redirectTo;
        console.log('Redirect effettuato verso:', redirectTo);
        return res.redirect(redirectTo);
      });

    }); // fine regenerate

  } catch (err) {
    console.error('Errore nel login DB:', err);
    return res.status(500).send('Errore del server');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Errore durante la distruzione della sessione:', err);
      return res.status(500).send("Errore durante il logout.");
    }
    res.clearCookie('connect.sid');
    console.log('✅ Logout completato, sessione distrutta.');
    res.redirect('/');
  });
});
// DELETE ACCOUNT
router.post('/delete_account', async (req, res) => {
  try {
    const userId = req.session.user._id;
    const role = req.session.user.role;
    const groupId = req.session.user.groupId;

    if (role === "office") {
      // 1. Elimina tutti i punti del gruppo
      await PointModel.deleteMany({ groupId });

      // 2. Elimina tutti i field del gruppo
      await User.deleteMany({ role: "field", groupId });

      // 3. Elimina se stesso (office)
      await User.findByIdAndDelete(userId);

      // 4. Elimina il documento del gruppo (pulizia DB)
      await Group.findOneAndDelete({ groupId });

      console.log(`🔥 Office, gruppo "${groupId}" e tutti i field eliminati.`);
    } 
    else if (role === "field") {
      // Elimina solo i punti personali
      await PointModel.deleteMany({ userId });

      // Elimina l'utente field
      await User.findByIdAndDelete(userId);

      console.log(`🔥 Field eliminato: ${userId}`);
    } 
    else {
      // fallback per sessioni anonime
      await PointModel.deleteMany({ sessionId: req.sessionID });
    }

    // Logout pulito
    req.session.user = null;

    // Distruggi sessione
    req.session.destroy(err => {
      if (err) {
        console.error('❌ Errore distruzione sessione:', err);
        return res.status(500).send("Errore durante logout.");
      }

      res.clearCookie('connect.sid');
      console.log('✅ Utente eliminato e sessione distrutta.');
      res.redirect('/');
    });

  } catch (err) {
    console.error('❌ Errore delete_account:', err);
    res.status(500).send("Errore interno server.");
  }
});

router.get("/signup", async (req, res) => {
  const role = req.query.role || "office";
  const group = req.query.group || null;
  // 🔐 Se field → il gruppo deve esistere
if (role === "field" && group) {
  const groupExists = await Group.findOne({ groupId: group });
  if (!groupExists) {
    return res.status(400).send("Groupe inexistant");
  }
}

  try {
    // ✳️ AUTO-SIGNUP per FIELD
 /*   if (role === "field" && group) {
        const groupExists = await Group.findOne({ groupId: group });
      if (!groupExists) {
        return res.status(400).send("Groupe inexistant");
      }
      console.log("⚡ Auto-signup attivato per field nel gruppo:", group);

      // 1️⃣ Email e password random
      const rand = Math.floor(1000 + Math.random() * 9000);
      const email = `field${rand}@local.test`;
      const password = "test1234";
      const bcrypt = require("bcryptjs");
      const hashedPassword = await bcrypt.hash(password, 6);

      // 2️⃣ Inherit categories
      const officeUser = await User.findOne({ role: "office", groupId: group });
      let inheritedCategories = [
        { name: "A", icon: "🟥" },
        { name: "B", icon: "🟧" },
      ];
      if (officeUser && Array.isArray(officeUser.categories)) {
        inheritedCategories = officeUser.categories;
      }

      // 3️⃣ Create new user
      const newUser = new User({
        email,
        password: hashedPassword,
        role: "field",
        groupId: group,
        categories: inheritedCategories,
      });
      await newUser.save();
      console.log("✅ Auto-user creato:", newUser.email);

      // 4️⃣ Sessione immediata
      req.session.regenerate((err) => {
        if (err) {
          console.error("❌ Errore rigenerazione sessione:", err);
          return res.status(500).send("Erreur session");
        }

        req.session.user = {
          _id: newUser._id,
          email: newUser.email,
          role: newUser.role,
          groupId: newUser.groupId,
        };

        req.session.save((err) => {
          if (err) {
            console.error("❌ Errore salvataggio sessione:", err);
            return res.status(500).send("Erreur session");
          }
          console.log("🚀 Login automatico completato per:", newUser.email);
          return res.redirect("/indexZoneGeo");
        });
      });

      return; // STOP
    }
*/
    // 🟦 FORM NORMALE: recupera lista gruppi
    const groups = await Group.find({}, 'groupId name').lean();
    console.log("📋 Gruppi disponibili per la select:", groups);

    // 🟦 Render singolo, corretto
    return res.render("signup", {
      title: "Form Page",
      error: null,
      role,
      group,
      groups,
      user: req.session.user || null,
    });

  } catch (err) {
    console.error("❌ Errore durante il recupero gruppi:", err);

    return res.render("signup", {
      title: "Form Page",
      error: "Erreur serveur",
      role,
      group,
      groups: [],
      user: req.session.user || null,
    });
  }
});

// Traitement du formulaire de signup
router.post('/signup', async (req, res) => {
  const { email, password, role, group, groupName} = req.body;
  const groupId = (group || "").trim();


    // 🔹 Log del gruppo ricevuto
  console.log('🔹 POST signup, gruppo scelto:', group);
  console.log('📨 [SIGNUP] Richiesta ricevuta');
  console.log('📨 [SIGNUP] Email:', email);
  console.log('📨 [SIGNUP] Password in chiaro dal form:', password);
  console.log('📨 [SIGNUP] Ruolo scelto:', role);
  /*
  if (role === 'admin') {
  return res.status(403).send('Registration impossible');
}
*/
  try {

      // 🔐 FIELD → gruppo obbligatorio
if (role === 'field') {
    if (!groupId) {
    return res.status(400).send("Un groupe est requis pour les membres field");
  }

// Recupera il limite dal piano del gruppo
const groupDoc = await Group.findOne({ groupId });
if (!groupDoc) {
  return res.status(400).send("Groupe inexistant");
}
 const currentFields = await User.countDocuments({
    groupId,
    role: 'field'
  });
const planName = groupDoc.plan || "free";
const maxFields = PLANS[planName]?.maxFields ?? Infinity;
console.log('📌 Plan gruppo:', planName, '→ maxFields:', maxFields, '→ currentFields:', currentFields);

if (currentFields >= maxFields) {
 return res.render('signup', {
    error: `Le nombre maximum de membres pour le plan ${planName} a été atteint.`,
    role: 'field',
   group: req.body.group || req.query.group || '' // prende il gruppo dalla richiesta // così il campo gruppo rimane precompilato
  });
}

}
    // Vérifier si l'user existe déjà
    const existingUser = await User.findOne({ email });
    console.log('🔍 [SIGNUP] Controllo utente esistente per:', email);
    if (existingUser) {
       console.log('⚠️ [SIGNUP] Email già presente nel DB:', email);
    return res.render('signup', {
      error: 'Cet email est déjà utilisé.',
      role: role || 'field',
         group,
        groups: await User.find({ role: 'office' }).distinct('groupId')
    });
  }
    // Si l'user n'existe pas, créer un nouvel user
    const hashedPassword = await bcrypt.hash(password, 6); // Hacher le mot de passe avec bcrypt
    console.log('🔐 [SIGNUP] Password criptata con bcrypt:', hashedPassword);
 // let inheritedCategories = ['A', 'B', 'C', 'D', 'E']; // fallback
// Prepara le categorie come array di oggetti, non stringhe
    let inheritedCategories = [
      { name: 'A', icon: '🟥' },
      { name: 'B', icon: '🟧' },
      
    ];
     // Se è field, eredita le categorie dall'office dello stesso gruppo
if (role === 'field') {
  const officeUser = await User.findOne({ role: 'office', groupId: group });
  if (officeUser && Array.isArray(officeUser.categories)) {
    inheritedCategories = officeUser.categories;
  }
}
const generatedGroupId = role === 'office'
  ? `group-${Date.now()}-${Math.floor(Math.random() * 1000)}`
  : group || null;

const newUser = new User({
 
  email: email,
  password: hashedPassword,
  role: ['office', 'field'].includes(role) ? role : 'field',
  categories: inheritedCategories,
  groupId: generatedGroupId,
});

      // lo salvo
    await newUser.save(); // Enregistrer le nouvel user dans la base de données
   
console.log('✅ [SIGNUP] Utente creato e salvato nel DB:', newUser);

// 🔹 CREAZIONE/AGGIORNAMENTO AUTOMATICA DEL GROUP SE È OFFICE
    if (role === "office") {
   await Group.findOneAndUpdate(
     { groupId: generatedGroupId },
     {
        groupId: generatedGroupId,
        name: groupName,
        plan: "free"
     },
     { upsert: true }
   );
}


    console.log('✅ [SIGNUP] Utente creato e salvato nel DB:', newUser);
    console.log('🧪 [SIGNUP] Verifica bcrypt.compare(password, hash):', await bcrypt.compare(password, newUser.password));
    console.log("🧪 Password da form:", password);    
    // 🔁 Rigenera la sessione come nel login
    req.session.regenerate(function(err) {
      if (err) {
         console.error('❌ [SIGNUP] Errore nel rigenerare la sessione:', err);
        return res.status(500).send("Errore di sessione");
      }
    // Stocker les informations user dans la session
    req.session.user = {
    _id: newUser._id,  
    email: newUser.email,
    role: newUser.role,
    groupId: newUser.groupId,
    isAdmin: newUser.role === 'admin',
     
   };
   console.log('Sessione al User:', req.session);
   console.log('📦 [SIGNUP] Sessione impostata:', req.session.user);
   
      // 🔁 Redirezione in base al ruolo
      let redirectTo;
      switch (newUser.role) {
        case 'field':
          redirectTo = '/indexZoneGeo';
          break;
        case 'office':
          redirectTo = '/indexOfficeGeo';
          break;
        case 'admin':
          redirectTo = '/users';
          break;
        default:
          redirectTo = '/';
      }
   //   console.log('➡️ [SIGNUP] Redirect verso:', redirectTo);
  req.session.save((err) => {
  if (err) return console.error('❌ Errore salvataggio sessione:', err);
  console.log('✅ Sessione salvata, user:', req.session.user);
  return res.redirect(redirectTo);
});

    });

  } catch (error) {
    console.error('🔥 [SIGNUP] Errore server:', error);
    res.render('signup', {
      error: 'Erreur serveur : ' + error.message,
      role: role || 'office',
      group,
      groups: await User.find({ role: 'office' }).distinct('groupId')
    });
   }
});

async function ensureAdminExists(req, res, next) {
  const adminEmail = SINGLE_USER.email; // Admin email
  const adminPasswordHash = SINGLE_USER.passwordHash; // Use the pre-hashed password from SINGLE_USER

  try {
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
        const adminUser = new User({
        email: adminEmail,
        password: adminPasswordHash,
        role: 'admin',  // <- così sarà corretto
      });
      await adminUser.save();
      console.log("Admin user created:", adminUser);
    }

    next(); // Proceed to the next middleware
  } catch (error) {
    console.error('Error ensuring admin user exists:', error);
    return res.status(500).send('Erreur serveur');
  }
}

router.post('/users/:id/groupId', isAdmin, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.params.id, { groupId: req.body.groupId });
    res.sendStatus(200); // Risponde 200 OK senza redirect
  } catch (err) {
    console.error('Errore aggiornamento groupId:', err);
    res.status(500).send('Errore server');
  }
});

// Use this middleware on a route or globally
router.use(ensureAdminExists);

// Affichage de la liste des users inscrits

router.get('/users', isAdmin, async (req, res) => {
  try {
    const users  = await User.find(); // Récupère tous les users de la base de données
     
    // 🔹 Conteggio field per gruppo
    const groups = [...new Set(users.map(u => u.groupId).filter(Boolean))];
    for (const g of groups) {
      const count = await User.countDocuments({ groupId: g, role: 'field' });
      console.log(`📊 Gruppo "${g}" ha ${count} field.`);
    }
         res.render('indexSignup', 
           { title:'la liste des users',  // Passe les users récupérés à la vue
            users: users, // Passe les users récupérés à la vue
            user: req.session.user, // Passe l'user connecté à la vue
           // password: req.session.password
          });
             } catch (error) {
               res.status(500).send('Erreur lors de la récupération des users');
             }
 });
 
// In cima al file, importa il modello Article
//const Article = require('../models/articles');

// DELETE UN user (in routes/users.js)
router.get('/del/:id', async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    console.log('ID non valido:', id);
    return res.status(404).send('ID non valido');
  }

  try {
    // 1) Elimina l'utente
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      console.log('user non trovato per ID:', id);
      return res.status(404).send('user non trovato');
    }
    console.log('User eliminato:', deletedUser.email);
    // 2) Elimina tutti gli articoli di quell'utente
    const result = await PointModel.deleteMany({ user: id });
    console.log(`Eliminati ${result.deletedCount} articoli di ${deletedUser.email}`);

    // 3) Redirect alla lista utenti
    return res.redirect('/users');

  } catch (err) {
    console.error('Errore durante la cancellazione dell\'user e dei suoi articoli:', err);
    return res.status(500).send('Errore server');
  }
});

router.param("id", async (req, res, next, id) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).send('user non trouvé');
    }
    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur lors de la récupération de l\'user');
  }
});

// Assicurati di esportare il router e altre funzioni se necessario
module.exports = router;  // <-- Questo esporta correttamente il router

module.exports.isAdmin = isAdmin;  //  Se vuoi esportare anche la funzione isAdmin

