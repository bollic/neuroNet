const express = require("express");
const router = express.Router();
const fs = require('fs');
const bcrypt = require('bcrypt'); // Utilisé pour comparer les mots de passe hachés
const mongoose = require('mongoose');

const Signup = require('../models/users');
router.use(logger);


// Questo è l'unico utente ammesso
const SINGLE_USER = {
  email: 'coucou@gmail.com',  // username predefinito
  passwordHash: '$2b$06$GtC0vGOQhPdDKClVdMOLXuYhO54UTzDoahZrPDYNH.HPdAjiLCrP6'
    // Hash della password predefinita (es. "password123")
};

//const Login = require('../models/login'); // Assurez-vous que ce chemin correspond à votre modèle user
// Middleware pour vérifier si l'user est connecté
function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.email === SINGLE_USER.email) {

    return next(); // Si l'user est connecté, continuer l'exécution
  } else {
    // Memorizza la route originaria nella sessione per redirigere dopo il login
    req.session.redirectTo = req.originalUrl;
    return res.redirect('/login'); 
   }
}
//VADO A: qs e' l indirizzo web ed event. Links http://localhost:4000/login
router.get("/users/login", (req, res) => {
  //recupero qs file da ejs
  res.render("login", { title: 'Form Page', error: null })
});


// Login route - per gestire il login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Verifica se l'email è quella del SINGLE_USER
  if (email === SINGLE_USER.email) {
    // Verifica la password con bcrypt
    const passwordMatch = await bcrypt.compare(password, SINGLE_USER.passwordHash);
    
    if (passwordMatch) {
      // Se la password è corretta, salva l'utente nella sessione
      req.session.user = { 
        email: SINGLE_USER.email,  // Usa l'email dell'utente corrente
        isAdmin: true               // Puoi anche impostare un flag per l'amministratore se necessario
   };
   console.log('Login riuscito, utente salvato nella sessione:', req.session.user);
  
      // Reindirizza l'utente alla route salvata o alla homepage
      const redirectTo = req.session.redirectTo || '/users';
      delete req.session.redirectTo;
      return res.redirect(redirectTo);
    } else {
      console.log('Password errata');
      return res.status(401).send('Email o password errata.');
    }
  } else {
    console.log('Email non trovata');
    return res.status(401).send('Email o password errata.'); 
   }
});


// Route de déconnexion
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login'); // Rediriger vers la page de login après déconnexion
  });
});



//VADO A: qs e' l indirizzo web ed event. Links http://localhost:4000/login
router.get("/signup", (req, res) => {
  //recupero qs file da ejs
  res.render("signup", { title: 'Form Page', error: null })
});
// Traitement du formulaire de signup
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Vérifier si l'user existe déjà
    const existingUser = await Signup.findOne({ email });

    if (existingUser) {
      // Si l'user existe déjà, retourner une erreur
      return res.render('signup', { error: 'Cet email est déjà utilisé.' });
    }

    // Si l'user n'existe pas, créer un nouvel user
    const hashedPassword = bcrypt.hashSync(password, 6); // Hacher le mot de passe avec bcrypt

    const newUser = new Signup({
      email: email,
      password: hashedPassword
    });

    await newUser.save(); // Enregistrer le nouvel user dans la base de données

    // Stocker les informations user dans la session
    req.session.user = newUser;

    // Rediriger vers la page d'accueil ou une autre page
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.status(500).send('Erreur serveur : ' + error.message);
  }
});

async function ensureAdminExists(req, res, next) {
  const adminEmail = SINGLE_USER.email; // Admin email
  const adminPasswordHash = SINGLE_USER.passwordHash; // Use the pre-hashed password from SINGLE_USER

  try {
    const existingAdmin = await Signup.findOne({ email: adminEmail });

    if (!existingAdmin) {
        const adminUser = new Signup({
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
    const users  = await Signup.find(); // Récupère tous les users de la base de données
     
         res.render('indexSignup', 
           { title:'la liste des users',  // Passe les users récupérés à la vue
            users: users, // Passe les users récupérés à la vue
            user: req.session.user, // Passe l'user connecté à la vue
            password: req.session.password
          });
             } catch (error) {
               res.status(500).send('Erreur lors de la récupération des users');
             }
 });
 

//DELETE UN user
router.get('/del/:id', async (req, res) => {
  try {
    // Récupérer l'ID de l'user depuis les paramètres de l'URL
    let id = req.params.id;
     // Vérifier si l'ID est un ObjectId valide
     if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('ID non valide:', id);
      return res.status(404).send('ID non valide');
    }
    console.log('Tentative de suppression de l\'user avec ID:', id);
     // Trouver et supprimer l'user
    const result = await Signup.findByIdAndDelete(id);


    if (result) {   
      // Afficher un message de succès dans la console
      console.log('user supprimé avec succès:', result);

      // Rediriger vers la page principale après suppression
      res.redirect('/users');
    } else {
      // Si l'user n'a pas été trouvé, renvoyer une erreur 404
      console.log('user non trouvé pour ID:', id);
       res.status(404).send('user non trouvé');
    }
  } catch (err) {
    // Gérer les erreurs et les afficher dans la console
    console.error('Erreur lors de la suppression de l\'user:', err);
    res.status(500).send('Erreur lors de la suppression de l\'user');
  }
});

router.param("id", async (req, res, next, id) => {
  try {
    const user = await Signup.findById(id);
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
