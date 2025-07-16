const express = require("express");
const router = express.Router();
const fs = require('fs');
const bcrypt = require('bcryptjs'); // Utilisé pour comparer les mots de passe hachés
const mongoose = require('mongoose');

const User = require('../models/users');
const Point = require('../models/Point'); // aggiorna il path se necessario

router.use(logger);

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
    // Memorizza la route originaria nella sessione per redirigere dopo il login
    req.session.redirectTo = req.originalUrl;
    return res.redirect('/login'); 
   }
}

//VADO A: qs e' l indirizzo web ed event. Links http://localhost:3000/login
router.get("/login", (req, res) => {
  //recupero qs file da ejs
  res.render("login", { title: 'Form Page', error: null })
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Tentativo di login con:', email);
  console.log('🧪 Password in chiaro dal form:', password);
  // Caso 1: login con SINGLE_USER (admin hardcoded)
  if (email === SINGLE_USER.email) {
    const passwordMatch = await bcrypt.compare(password, SINGLE_USER.passwordHash);
    console.log('Rigenerazione sessione completata.');

    if (passwordMatch) {
      req.session.user = {
        email: SINGLE_USER.email,
        isAdmin: true,
        role: 'admin'
      };
      console.log('📦 Sessione prima del salvataggio:', req.session);
      console.log('🧠 Sessione impostata:', req.session.user);

      console.log('Login riuscito (SINGLE_USER):', req.session.user);
      const redirectTo = req.session.redirectTo || '/users';
       req.session.save((err) => {
    if (err) {
      console.error('Errore nel salvataggio della sessione:', err);
      return res.status(500).send("Errore nel salvataggio della sessione");
    }
    delete req.session.redirectTo;
     console.log('Redirect effettuato verso:', redirectTo);
    return res.redirect(redirectTo);
  });
     // 🛑 Aggiungi return per evitare di proseguire
    return;
    }
     //console.log('Ruolo utente nel DB:', userFromDb.role);
    return res.status(401).send('Login:Email o password errata.');
  }

  // Caso 2: login con utente dal DB (User collection)
  try {
    const userFromDb = await User.findOne({ email });
    if (!userFromDb) {
      console.log('Email non trovata nel DB');
      return res.status(401).send('Login:Email o password non corretta.');
    }
    // 👇 AGGIUNGI QUESTO
  console.log('🔑 Password nel DB (userFromDb.password):', userFromDb.password);
  console.log('Utente trovato:', userFromDb);
    console.log('🧪 Password salvata nel DB:', userFromDb.password);
console.log('🧪 Match bcrypt? →', await bcrypt.compare(password, userFromDb.password));
console.log("🧪 bcrypt.compare (TEST) →", await bcrypt.compare("field1", "$2b$06$KHcUwrna5LV25h3VDXmC.eeubbsx5m9tIAHaOKOgn7cQqEU8zqe5a"));

    const passwordMatch = await bcrypt.compare(password, userFromDb.password);
    if (!passwordMatch) {
      console.log('Password errata nel DB');
      return res.status(401).send('Email o password errata.');
    }
      // 🔁 Rigenera sessione per evitare problemi tra login diversi
 req.session.regenerate(function(err) {
    if (err) {
      console.error('Errore nel rigenerare la sessione:', err);
      return res.status(500).send("Errore di sessione");
    }
    // ✅ Imposta nuova sessione
    req.session.user = {
      _id: userFromDb._id, // 👈 AGGIUNGI QUESTO!
      email: userFromDb.email,
      role: userFromDb.role,
      isAdmin: userFromDb.role === 'admin'
    };
    console.log('📦 Sessione prima del salvataggio:', req.session);
    console.log('🧠 Sessione impostata:', req.session.user);
    // 🔁 Decidi il redirect finale
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
 console.log(`Ruolo utente: ${userFromDb.role}`);
  console.log(`Redirect finale: ${redirectTo}`);
  // Questo è il punto esatto dove aggiungere il log finale:
console.log('Redirect effettuato verso:', redirectTo);
    // ✅ SALVA LA SESSIONE PRIMA DEL REDIRECT!
  req.session.save((err) => {
    if (err) {
      console.error('❌ Errore nel salvataggio della sessione:', err);
      return res.status(500).send("Errore nel salvataggio della sessione");
    } 
    console.log('✅ Sessione salvata correttamente.');
    delete req.session.redirectTo;
    console.log('Redirect effettuato verso:', redirectTo);
    return res.redirect(redirectTo);
    //return res.redirect(redirectTo);
  });
   
})
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


router.get("/signup", (req, res) => {
   const role = req.query.role || 'office'; // se non arriva dalla query, imposta 'field' come default
  //recupero qs file da ejs
  res.render("signup", { title: 'Form Page', error: null, role })
});
// Traitement du formulaire de signup
router.post('/signup', async (req, res) => {
  const { email, password, role } = req.body;
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
    // Vérifier si l'user existe déjà
    const existingUser = await User.findOne({ email });
    console.log('🔍 [SIGNUP] Controllo utente esistente per:', email);
    if (existingUser) {
       console.log('⚠️ [SIGNUP] Email già presente nel DB:', email);
    return res.render('signup', {
      error: 'Cet email est déjà utilisé.',
      role: role || 'field'  // 👈 Aggiunto
    });
  }
    // Si l'user n'existe pas, créer un nouvel user
    const hashedPassword = await bcrypt.hash(password, 6); // Hacher le mot de passe avec bcrypt
    console.log('🔐 [SIGNUP] Password criptata con bcrypt:', hashedPassword);
    const newUser = new User({
      email: email,
      password: hashedPassword,
      role: ['office', 'field'].includes(role) ? role : 'field'
    });
      // lo salvo
    await newUser.save(); // Enregistrer le nouvel user dans la base de données
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
    isAdmin: newUser.role === 'admin'
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
      console.log('➡️ [SIGNUP] Redirect verso:', redirectTo);
      req.session.save((err) => {
        if (err) {
           console.error('❌ [SIGNUP] Errore nel salvataggio della sessione:', err);
           return res.status(500).send("Errore nel salvataggio della sessione");
        }
        console.log('✅ [SIGNUP] Sessione salvata correttamente.');
        return res.redirect(redirectTo);
      });
    });

  } catch (error) {
    console.error('🔥 [SIGNUP] Errore server:', error);
    res.render('signup', {
      error: 'Erreur serveur : ' + error.message,
      role: role || 'office'
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

// Use this middleware on a route or globally
router.use(ensureAdminExists);

// Affichage de la liste des users inscrits

router.get('/users', isAdmin, async (req, res) => {
  try {
    const users  = await User.find(); // Récupère tous les users de la base de données
     
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
    const result = await Point.deleteMany({ user: id });
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
//req.session.redirectTo = req.originalUrl;
//const redirectTo = req.session.redirectTo || '/users';
//delete req.session.redirectTo; 
function logger(req, res, next) {
  console.log(req.originalUrl)
  next()
}

// Assicurati di esportare il router e altre funzioni se necessario
module.exports = router;  // <-- Questo esporta correttamente il router

module.exports.isAdmin = isAdmin;  //  Se vuoi esportare anche la funzione isAdmin
// Esporta il middleware isAdmin per poterlo usare in altri file
/*
module.exports = {
  router,
  isAdmin
};
*/
