const express = require("express");
const router = express.Router();
const fs = require('fs');
const bcrypt = require('bcrypt'); // Utilisé pour comparer les mots de passe hachés

const mongoose = require('mongoose');
const Article = require('../models/articles');
const User = require('../models/users');

// Ottieni ObjectId da Mongoose
const ObjectId = mongoose.Types.ObjectId;
const multer = require('multer');
router.use(logger);


router.get('/api/grouped-by-type', async (req, res) => {
  try {
    console.log("Inizio recupero articoli raggruppati per tipo");

    // Verifica che la connessione al database sia stabile
    if (!mongoose.connection.readyState) {
      throw new Error('Database non connesso');
    }

    const userId = req.session.user ? req.session.user._id : null;
    console.log('ID utente loggato:', userId); // Log per verificare l'ID utente

    if (!userId) {
      return res.status(401).send('Utente non autenticato');
    }

    // Recupera tutti gli articoli dell'utente con il tipo e il popolamento del campo 'user'
    const articles = await Article.find({ user: userId }).populate('user');
    console.log("Tutti gli articoli per l'utente:", articles);

    // Raggruppa gli articoli per tipo
    const groupedByType = articles.reduce((acc, article) => {
      const type = article.type || 'Sconosciuto'; // Default se manca il tipo
      // Log per ogni articolo in fase di elaborazione
     
      console.log("Type:", type);

      if (!acc[type]) {
        acc[type] = {
          type: type, // Tipo dell'articolo
          articles: []   // Inizializza l'array degli articoli di quel tipo
        };
        console.log(`Creato nuovo gruppo per il tipo ${type}`);
      }

      // Aggiungi l'articolo al gruppo per tipo
      acc[type].articles.push(article);
      console.log(`Articolo aggiunto al tipo ${type}:`, article.name);

      return acc;
    }, {});

    // Log finale per vedere come è stato raggruppato
    console.log("Articoli raggruppati per tipo:", groupedByType);

    // Rispondi con gli articoli raggruppati
    res.json(Object.values(groupedByType));

  } catch (error) {
    console.error('Errore nel recupero degli articoli per tipo:', error);
    res.status(500).send('Errore nel recupero degli articoli per tipo');
  }
});


//VADO A: qs e' l indirizzo web ed event. Links http://localhost:4000/login
router.get("/login", (req, res) => {
  //recupero qs file da ejs
  res.render("login", { title: 'Page de login', error: null })
});
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user) {
      console.log('user trouvé:', user);

      if (bcrypt.compareSync(password, user.password)) {
             // Authentification réussie
        // Stocker seulement l'ID et l'email de l'user dans la session
        req.session.user = {
          _id: user._id,
          email: user.email
        }; // Stocker les informations user dans la session
        const redirectTo = req.session.redirectTo || '/';
     delete req.session.redirectTo;  // Elimina la variabile di sessione dopo il reindirizzamento
    
     console.log('Redirection vers:', redirectTo)
     // Redirige alla route originaria o a '/users'
    res.redirect(redirectTo);
      
      //  console.log('Connexion réussie, redirection vers /');
       // res.redirect('/addForm'); // Rediriger vers la page d'accueil
      } else {
        console.log('Mot de passe incorrect');
        res.render('login', { error: 'Email ou mot de passe incorrect' });
      }
    } else {
      console.log('user non trouvé');
      res.render('login', { error: 'Email ou mot de passe incorrect' });
    }
  } catch (error) {
    console.error('Erreur serveur lors de la connexion:', error);
    res.status(500).send('Erreur serveur');
  }
});

// Utiliser le middleware pour protéger la route des articles
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

function groupArticles(articles) {
  // si scorrono  gli articoli uno a uno con REDUCE
  // si crea un accumulatore vuoto con acc 
  // dove si accumulano userId, type e group
  return      articles.reduce((acc, article) => {
    const userId = article.user._id.toString();
    const type = article.type || 'Sconosciuto';
    const group = article.group || 'ungrouped';
    
 //   console.log(`Articolo elaborato - UserId: ${userId}, Tipo: ${type}, Gruppo: ${group}`);  // Aggiungi log

  
    // Se l'utente non è ancora presente, lo inizializziamo
    if (!acc[userId]) {
      acc[userId] = { 
        articles: [], 
        groupedByType: {} // Aggiungiamo il raggruppamento per tipo!
      };
    }

    acc[userId].articles.push(article); // Manteniamo la lista di articoli "piatta"

    // Ora raggruppiamo anche per tipo e gruppo
    if (!acc[userId].groupedByType[type]) {
      acc[userId].groupedByType[type] = {};
    }
    if (!acc[userId].groupedByType[type][group]) {
      acc[userId].groupedByType[type][group] = [];
    }
    
    // Aggiungiamo l'articolo dentro il raggruppamento
    acc[userId].groupedByType[type][group].push({
      id: article._id,
      coordinates: [article.latitudeSelectionee, article.longitudeSelectionee],
      category: article.category
    });

    return acc;
  }, {});
}

function gruppoArticles(articles) {
  // si scorrono  gli articoli uno a uno con REDUCE
  // si crea un accumulatore vuoto con acc 
  // dove si accumulano userId, type e group
  //console.log("🚀 Chiamata a gruppoArticles() con", articles.length, "articoli");
  
  return      articles.reduce((acc, article) => {
 //   console.log(`🔹 Articolo ID: ${article._id}, Type: ${article.type}, Group: ${article.group}`);
    
    const userId = article.user._id.toString();
    const type = article.type || 'Sconosciuto';
    const group = article.group || 'ungrouped';
    
 //   console.log(`Articolo elaborato - UserId: ${userId}, Tipo: ${type}, Gruppo: ${group}`);  // Aggiungi log

  
    // Se l'utente non è ancora presente, lo inizializziamo
    if (!acc[userId]) {
      acc[userId] = { 
        articles: [], 
        groupedByType: {} // Aggiungiamo il raggruppamento per tipo!
      };
    }

    acc[userId].articles.push(article); // Manteniamo la lista di articoli "piatta"

    // Ora raggruppiamo anche per tipo e gruppo
    if (!acc[userId].groupedByType[type]) {
      acc[userId].groupedByType[type] = {};
    }
    if (!acc[userId].groupedByType[type][group]) {
      acc[userId].groupedByType[type][group] = [];
    }
    
    // Aggiungiamo l'articolo dentro il raggruppamento
    acc[userId].groupedByType[type][group].push({
      id: article._id,
      coordinates: [article.latitudeSelectionee, article.longitudeSelectionee],
      category: article.category, 
      name: article.name,
      image: article.image
    });

    return acc;
  }, {});
}

router.get('/', isAuthenticated, isOffice,  async (req, res) => {
  try {       
    const userId = req.session.user ? req.session.user._id : null;
      
     if (!userId) {
      // Se non c'è un utente loggato, rimanda alla home o mostra un messaggio di errore
      return res.status(401).send('Utente non autenticato');
    } 
    //  console.log("Sto per eseguire la query...");
     const articles = await Article.find().populate('user'); // Popola il campo user per avere accesso a userID    
   //  console.log("Articoli recuperati:", articles); // Verifica i dati degli articoli
     const groupedByUser = groupArticles(articles);    
    // Raggruppa gli articoli per tipo
       // const groupedArticlesT = groupedByType(articles);
 const originalTriangles = groupedByUser['6783c76b4369bb079de8d01a']?.groupedByType['triangle']?.['original'] || [];
const scaled1Triangles = groupedByUser['6783c76b4369bb079de8d01a']?.groupedByType['triangle']?.['scaled1'] || [];
const scaled2Triangles = groupedByUser['6783c76b4369bb079de8d01a']?.groupedByType['triangle']?.['scaled2'] || [];
const singleTriangle = groupedByUser['6783c76b4369bb079de8d01a']?.groupedByType['trepunti']?.['trePunti'] || [];

     res.render('index',  {
             title:'la liste des points',
               session: req.session, // Passer la session à la vue
               user: req.session ? req.session.user : null, // Vérifiez si un user est connecté, sinon null
               articles: articles || [], // Passa gli articoli         
               groupedByUser: groupedByUser,  
       
               singleTriangle, 
               scaled1Triangles,
               scaled2Triangles,
               originalTriangles,                        
       })
             } catch (error) {
               console.error('Errore durante la ricerca degli articoli:', error);
               res.status(500).send('Erreur lors de la récupération des articles');
             }
 });
 
/*
router.get('/',  async (req, res) => {
  try {       
    //  console.log("Sto per eseguire la query...");
     const articles = await Article.find().populate('user'); // Popola il campo user per avere accesso a userID    
   //  console.log("Articoli recuperati:", articles); // Verifica i dati degli articoli
     const groupedByUser = groupArticles(articles);    
    // Raggruppa gli articoli per tipo
       // const groupedArticlesT = groupedByType(articles);
 const originalTriangles = groupedByUser['6783c76b4369bb079de8d01a']?.groupedByType['triangle']?.['original'] || [];
const scaled1Triangles = groupedByUser['6783c76b4369bb079de8d01a']?.groupedByType['triangle']?.['scaled1'] || [];
const scaled2Triangles = groupedByUser['6783c76b4369bb079de8d01a']?.groupedByType['triangle']?.['scaled2'] || [];
const singleTriangle = groupedByUser['6783c76b4369bb079de8d01a']?.groupedByType['trepunti']?.['trePunti'] || [];

     res.render('index',  {
             title:'la liste des points',
               session: req.session, // Passer la session à la vue
               user: req.session ? req.session.user : null, // Vérifiez si un user est connecté, sinon null
               articles: articles || [], // Passa gli articoli         
               groupedByUser: groupedByUser,  
       
               singleTriangle, 
               scaled1Triangles,
               scaled2Triangles,
               originalTriangles,                        
       })
             } catch (error) {
               console.error('Errore durante la ricerca degli articoli:', error);
               res.status(500).send('Erreur lors de la récupération des articles');
             }
 });
 */
 function groupedByType(articles) {
  return articles.reduce((acc, article) => {
    const userId = article.user._id.toString();
    const type = article.type || 'Sconosciuto';
    const group = article.group || 'ungrouped';

    acc[userId] = acc[userId] || {};
    acc[userId][type] = acc[userId][type] || {};
    acc[userId][type][group] = acc[userId][type][group] || [];
    console.log("Tipo:", type, "Gruppo:", group, "ID:", article._id); // ✅ Log utile

    acc[userId][type][group].push({
      id: article._id,
      coordinates: [article.latitudeSelectionee, article.longitudeSelectionee],
      category: article.category,
      name: article.name,  // ✅ Aggiunto
      image: article.image // ✅ Aggiunto
    });
    
    return acc;
  }, {});
}
//console.log("Grouped Articles with name & image:", JSON.stringify(groupedByType, null, 2));

// Esempio nel tuo file server.js o simile
const categoryColors = {
  bon: 'blue',
  moyen: 'gray',
  bas: 'red'
};
 router.get('/indexZoneAuthor',  isAuthenticated, isField, async (req, res) => {
  try {
    // Recupera l'ID dell'utente autenticato
    //const userId = req.session.user._id;
  //  const articles = await Article.find();  // Récupère les articles depuis la base de données
 //const articleId = req.params.id;
  const userId = req.session.user ? req.session.user._id : null;
      
     if (!userId) {
      // Se non c'è un utente loggato, rimanda alla home o mostra un messaggio di errore
      return res.status(401).send('Utente non autenticato');
    } 
    const articles = await Article.find({ user: userId }).limit(30).populate('user');
    
 router.get('/indexZoneAuthor',  isAuthenticated, isField, async (req, res) => {
  try {
    // Recupera l'ID dell'utente autenticato
    //const userId = req.session.user._id;
  //  const articles = await Article.find();  // Récupère les articles depuis la base de données
 //const articleId = req.params.id;
  const userId = req.session.user ? req.session.user._id : null;
      
     if (!userId) {
      // Se non c'è un utente loggato, rimanda alla home o mostra un messaggio di errore
      return res.status(401).send('Utente non autenticato');
    } 
    const articles = await Article.find({ user: userId }).limit(30).populate('user');
    
    // console.log("Articles from DB:", articles);
  //console.log("Articles prima del raggruppamento:", JSON.stringify(articles, null, 2));

    // Raggruppa gli articoli per utente e poi per tipo
    const groupedByUser = gruppoArticles(articles);
    const groupedByType = groupedByUser[userId]?.groupedByType || {};

const originalTriangles = groupedByType['triangle']?.['original'] || [];
const scaled1Triangles = groupedByType['triangle']?.['scaled1'] || [];
const scaled2Triangles = groupedByType['triangle']?.['scaled2'] || [];
const singleTriangle = groupedByType['trepunti']?.['trePunti'] || [];

   // Log per debug
   //console.log("Grouped Articles (con name & image):", JSON.stringify(groupedByUser, null, 2));
   //console.log("Grouped by Type:", JSON.stringify(groupedByType, null, 2));
  // console.log("Original Triangles:", originalTriangles);
  // console.log("Scaled1 Triangles:", scaled1Triangles);
  // console.log("Scaled2 Triangles:", scaled2Triangles);
   // console.log("Single Triangle:", singleTriangle);

    // Passa i dati raggruppati alla vista
    res.render('indexZoneAuthor', { 
      articles: articles || [], // Passa gli articoli
      filteredUsers: [],
      groupedArticles: groupedByType, 
      scaled1Triangles, // Passa i triangoli specifici del gruppo 'scaled1'
      scaled2Triangles,
      originalTriangles,
      singleTriangle,
      session: req.session, // Passer la session à la vue
      user: req.session.user, // Vérifiez si un user est connecté
      categoryColors: categoryColors 
      
    });
  } catch (error) {
      console.error(error);
      res.status(500).send('Errore del server');
  }
});  

   // console.log("Articles from DB:", articles);
 // console.log("Articles prima del raggruppamento:", JSON.stringify(articles, null, 2));

    // Raggruppa gli articoli per utente e poi per tipo
    const groupedByUser = gruppoArticles(articles);
    const groupedByType = groupedByUser[userId]?.groupedByType || {};

const originalTriangles = groupedByType['triangle']?.['original'] || [];
const scaled1Triangles = groupedByType['triangle']?.['scaled1'] || [];
const scaled2Triangles = groupedByType['triangle']?.['scaled2'] || [];
const singleTriangle = groupedByType['trepunti']?.['trePunti'] || [];

   // Log per debug
   //console.log("Grouped Articles (con name & image):", JSON.stringify(groupedByUser, null, 2));
   //console.log("Grouped by Type:", JSON.stringify(groupedByType, null, 2));
  // console.log("Original Triangles:", originalTriangles);
  // console.log("Scaled1 Triangles:", scaled1Triangles);
  // console.log("Scaled2 Triangles:", scaled2Triangles);
   //console.log("Single Triangle:", singleTriangle);

    // Passa i dati raggruppati alla vista
    res.render('indexZoneAuthor', { 
      articles: articles || [], // Passa gli articoli
      filteredUsers: [],
      groupedArticles: groupedByType, 
      scaled1Triangles, // Passa i triangoli specifici del gruppo 'scaled1'
      scaled2Triangles,
      originalTriangles,
      singleTriangle,
      session: req.session, // Passer la session à la vue
      user: req.session.user, // Vérifiez si un user est connecté
      categoryColors: categoryColors 
      
    });
  } catch (error) {
      console.error(error);
      res.status(500).send('Errore del server');
  }
});  


router.get('/api/grouped-by-user', async (req, res) => {
  try {
    const articles = await Article.find().populate('user');
    
    // Usa la STESSA logica di raggruppamento del route principale /
    const groupedByUser = articles.reduce((acc, article) => {
      const userId = article.user._id.toString();
      if (!acc[userId]) {
        acc[userId] = {
          user: article.user,
          articles: [],
          groupedByType: groupedByType([article]) // Inizializza subito il groupedByType
        };
      } else {
        acc[userId].articles.push(article);
        acc[userId].groupedByType = groupedByType(acc[userId].articles); // Aggiorna il groupedByType
      }
      return acc;
    }, {});

    res.json(groupedByUser);
  } catch (error) {
    console.error('Errore:', error);
    res.status(500).json({ error: 'Errore nel recupero dati' });
  }
});

// Route modificata per gestire SOLO i dati testuali
router.post('/edit/:id', async (req, res) => {
  try {
       const updatedArticle = await Article.findByIdAndUpdate(
          req.params.id,
          {
              $set: {
                  name: req.body.name,
                  category: req.body.category,
                //  latitudeSelectionee: req.body.latitudeSelectionee,
                 // longitudeSelectionee: req.body.longitudeSelectionee
              }
          },
          { new: true }
      );

      console.log("✅ Aggiornato:", updatedArticle.name);
      console.log("✅ Aggiornato:", updatedArticle.category);
      res.json({ success: true,
                 newName: updatedArticle.name,
                 newCategory: updatedArticle.category
                });
     } catch (err) {
      console.error("❌ Errore DB:", err);
      res.status(500).json({ success: false });
  }
});
// Route per aggiornare la posizione
router.post('/api/update-polygon-coords', async (req, res) => {
  try {
      const article = await Article.findOne({ 
          latitudeSelectionee: req.body.lat,
          longitudeSelectionee: req.body.lng 
      });
      await Article.updateMany(
          { group: article.group }, 
          { $set: { 
              latitudeSelectionee: req.body.newCoordinates[0][0],
              longitudeSelectionee: req.body.newCoordinates[0][1],
          }}
      );
      res.json({ success: true });
  } catch (err) {
      console.error("Errore DB:", err);
      res.status(500).json({ success: false });
  }
});
// Route per aggiornare la posizione dell'articolo
router.put('/api/articles/:id', async (req, res) => {
  try {
      const updatedArticle = await Article.findByIdAndUpdate(
          req.params.id,
          {
              name: req.body.name,
              category: req.body.category,
              latitudeSelectionee: req.body.latitudeSelectionee,
              longitudeSelectionee: req.body.longitudeSelectionee
          },
          { new: true }
      );

      if (!updatedArticle) {
          return res.status(404).json({ 
              success: false, 
              message: "Articolo non trovato" 
          });
      }

      res.json({
          success: true,
          updatedArticle: {
              name: updatedArticle.name,
              category: updatedArticle.category,
              latitudeSelectionee: updatedArticle.latitudeSelectionee,
              longitudeSelectionee: updatedArticle.longitudeSelectionee
          }
      });

  } catch (error) {
      console.error("Errore nell'aggiornamento:", error);
      res.status(500).json({ 
          success: false, 
          message: "Errore interno del server" 
      });
  }
});

// Route de déconnexion
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/'); // Rediriger vers la page articles après déconnexion
  });
});
const officeEmails = ['office1@gmail.com', 'office2@gmail.com'];
const fieldEmails = ['field1@gmail.com', 'field2@gmail.com'];

function isOffice(req, res, next) {
  const user = req.session.user;

  if (officeEmails.includes(user.email)) {
    return next();
  }

  return res.status(403).send("Accesso riservato agli impiegati d'ufficio");
}

function isField(req, res, next) {
  const user = req.session.user;

  if (fieldEmails.includes(user.email)) {
    return next();
  }

  return res.status(403).send("Accesso riservato agli utenti FIELD");
}


// Middleware pour vérifier si l'user est connecté
function isAuthenticated(req, res, next) {
   // Log per vedere cosa contiene la sessione
   console.log("Verifica autenticazione - sessione utente:", req.session ? req.session.user : "Nessuna sessione");

  if (req.session && req.session.user) {
    return next(); // Si l'user est connecté, continuer l'exécution
  } else {
     // Log per vedere se l'utente non è autenticato e viene reindirizzato al login
     console.log("Utente non autenticato, reindirizzamento a /login");
    req.session.redirectTo = req.originalUrl;
    return res.redirect('/login'); // Sinon, rediriger vers la page de login
  }
}
async function isAuthor(req, res, next) {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).send('Articolo non trovato');
    }

    // Verifica se l'utente autenticato è l'autore dell'articolo
    if (!req.session.user || !req.session.user._id) {
      return res.status(401).send('Utente non autenticato');
    }

    if (article.user.toString() !== req.session.user._id.toString()) {
      return res.status(403).send("Tu n' est pas autorisé à changer cet element");
    }

    // Se l'utente è l'autore, procedi con la richiesta
    next();

  } catch (err) {
    console.error('Errore durante la verifica dell\'autore:', err);
    return res.status(500).send('Errore del server');
  }
}

//VADO A: qs e' l indirizzo web , cioe la ROUTE addForm, che vedo nell'internet
// Links http://localhost:4000/addForm
router.get("/addTriangle", isAuthenticated, (req, res) => {
  // Log per vedere se l'utente è stato autenticato correttamente e cosa contiene la sessione
  console.log("Accesso a /addTriangle - sessione utente:", req.session ? req.session.user._id : "Nessuna sessione");

  if (req.session.user) {
  res.render("ajoute_triangle", { title: 'Article Triangle Form Page', user: req.session.user});
  
} else {
    // Log per verificare se si viene reindirizzati al login
    console.log("Utente non autenticato, reindirizzamento a /login");
  res.redirect("/login");  // Se l'utente non è loggato, reindirizza alla pagina di login
}
});

//VADO A: qs e' l indirizzo web , cioe la ROUTE addForm, che vedo nell'internet
// Links http://localhost:4000/addForm
router.get("/addTroisMarker", isAuthenticated, (req, res) => {
  // Log per vedere se l'utente è stato autenticato correttamente e cosa contiene la sessione
  console.log("Accesso a /addTroisMarker - sessione utente:", req.session ? req.session.user._id : "Nessuna sessione");

  if (req.session.user) {
  res.render("ajoute_trois_marker", { title: 'Article addTroisMarker Form Page', user: req.session.user});
  
} else {
    // Log per verificare se si viene reindirizzati al login
    console.log("Utente non autenticato, reindirizzamento a /login");
  res.redirect("/login");  // Se l'utente non è loggato, reindirizza alla pagina di login
}
});

//VADO A: qs e' l indirizzo web , cioe la ROUTE addForm, che vedo nell'internet
// Links http://localhost:4000/addToileTriangle
router.get("/addToileTriangle", isAuthenticated, (req, res) => {
  // Log per vedere se l'utente è stato autenticato correttamente e cosa contiene la sessione
  console.log("Accesso a /addTriangle - sessione utente:", req.session ? req.session.user._id : "Nessuna sessione");

  if (req.session.user) {
  res.render("ajoute_toileTriangle", { title: 'Toile à Triangle Form Page', user: req.session.user});
  
} else {
    // Log per verificare se si viene reindirizzati al login
    console.log("Utente non autenticato, reindirizzamento a /login");
  res.redirect("/login");  // Se l'utente non è loggato, reindirizza alla pagina di login
}
});

router.get("/addPentagone", isAuthenticated, (req, res) => {
  // Log per vedere se l'utente è stato autenticato correttamente e cosa contiene la sessione
  console.log("Accesso a /addPentagone - sessione utente:", req.session ? req.session.user._id : "Nessuna sessione");

  if (req.session.user) {
  res.render("ajoute_pentagone", { title: 'Article Form Page', user: req.session.user});
  
} else {
    // Log per verificare se si viene reindirizzati al login
    console.log("Utente non autenticato, reindirizzamento a /login");
  res.redirect("/login");  // Se l'utente non è loggato, reindirizza alla pagina di login
}
});

router.get('/api/check-articles', async (req, res) => {
  try {
      const userId = req.session.user._id;  // Ottieni l'ID dell'utente dalla sessione
      const count = await Article.countDocuments({ user: userId });
      res.json({ count });  // Restituisci il numero di articoli
  } catch (err) {
      console.error("Errore nel recupero degli articoli:", err);
      res.status(500).send("Errore nel recupero degli articoli");
  }
});

router.post("/ajoute_toileTriangle", upload, async (req, res) => {  
  try { 
    console.log("Dati ricevuti dal form:", req.body); 
    const userId = req.body.id || req.session.user._id; // Recupera l'ID dell'utente
    const type = req.body.type; // Es: "triangle" o "pentagone"
    // Conta gli articoli già aggiunti dall'utente

// Definisci il numero massimo di articoli per tipo
let maxArticles = 0;
if (type === "triangle") {
  maxArticles = 3;
} else if (type === "pentagone") {
  maxArticles = 5;
} else {
  return res.status(400).send("Tipo di articolo non valido.");
}
    const existingTriangles  = await Article.countDocuments({ 
      user: userId,
      type: type, // Aggiunge un campo specifico per distinguere le figure
    });
    console.log(`existingTriangles: ${existingTriangles}:`);
      console.log(`MaxArticles: ${maxArticles}:`);
    if (existingTriangles >= maxArticles) {
      // Se l'utente ha già 3 articoli, blocca l'aggiunta
      return res.status(400).send(`Puoi aggiungere al massimo  ${maxArticles} articoli di tipo ${type}`);
    }

    const { body } = req;
    const trianglePoints = [];
    const trianglePointsDue = [];
    const trianglePointsTre = [];

    let i = 0;
    // Ciclo per ciascun articolo basato sugli indici delle coordinate (da 0 a 2)
    while (body[`latitudeSelectioneeInput_${i}`]) {
     // console.log(`Trovato articolo ${i}:`);
      // Recupera e controlla le coordinate
      const latitude = parseFloat(body[`latitudeSelectioneeInput_${i}`]);
      const longitude = parseFloat(body[`longitudeSelectioneeInput_${i}`]);

      // Verifica che le coordinate siano numeriche
      if (isNaN(latitude) || isNaN(longitude)) {
        console.log("Errore: Coordinate non valide");
        return res.status(400).send("Le coordinate devono essere numeriche.");
      }
      // Recupera il file caricato per questo articolo
      const imageField = `image_${i}`;
      const imageFile = body[imageField] || "image_3.png"; // Usa il valore da req.body
      
      // Creazione dei dati per l'articolo
      const articleData = {
        name: body.name && body.name.trim() !== "" ? body.name : "Default Name",  // Usa il valore di 'name' dal form
        category: body.category && body.category.trim() !== "" ? body.category : "bon",  // Usa 'category' dal form
        latitudeSelectionee: latitude,  // Latitudine
        longitudeSelectionee: longitude,  // Longitudine
        type: "triangle",
        image: imageFile,  
        group: "original", // Aggiungi il gruppo iniziale
     };
      
      console.log(`Articolo ${i} dati:`, articleData);

      // Verifica che tutti i campi obbligatori siano presenti
      if (!articleData.name || !articleData.category || !articleData.latitudeSelectionee || !articleData.longitudeSelectionee) {
        console.log("Errore: Manca uno dei campi obbligatori");
        return res.status(400).send("Tutti i campi sono obbligatori");
      }

  // Logica di aggiunta degli articoli agli array
      trianglePoints.push(articleData);
      trianglePointsDue.push(articleData);
      trianglePointsTre.push(articleData);

      i++; // Incrementa l'indice per il prossimo articolo
}

    // Verifica che siano stati trovati articoli
    if (trianglePoints.length === 0) {
      return res.status(400).send("Nessun articolo da aggiungere.");
    }

    // Calcola il centroide del triangolo originale
   const calculateCentroid = (points) => {
        const centerLat = points.reduce((sum, p) => sum + p.latitudeSelectionee, 0) / points.length;
        const centerLng = points.reduce((sum, p) => sum + p.longitudeSelectionee, 0) / points.length;
        return { centerLat, centerLng };
   };
// Espandi i punti rispetto al centroide
const scaleTriangle = (points, scale) => {
  const { centerLat, centerLng } = calculateCentroid(points);
  console.log("Centroide:", centerLat, centerLng);
  return points.map((point) => {
    const newPoint = {
      ...point,
      latitudeSelectionee: centerLat + (point.latitudeSelectionee - centerLat) * scale,
      longitudeSelectionee: centerLng + (point.longitudeSelectionee - centerLng) * scale,
    };
    console.log("Punto originale:", point);
    console.log("Punto scalato:", newPoint);
    return newPoint;
  });
};
    // 1.Salva tutti gli articoli triangleData nel database
    for (const triangleData of trianglePoints ) {
      console.log('Triangle Points:', trianglePoints);
      const newTriangle = new Article({
        user: userId,
        group: "original",
        name: triangleData.name,
        category: "bon",      
        latitudeSelectionee: triangleData.latitudeSelectionee,
        longitudeSelectionee: triangleData.longitudeSelectionee,
        type: triangleData.type,
        image: triangleData.image,
      });
      console.log(triangleData);
      await newTriangle.save();
    }

    console.log("Articoli salvati nel database:", trianglePoints);

// 2. Calcola e salva il secondo triangolo (ingrandito)
// Crea una copia profonda prima di eseguire lo scaling
const scaledTrianglePointsDue = scaleTriangle(JSON.parse(JSON.stringify(trianglePoints)), 1.5);
console.log('Scaled Triangle Points Due:', scaledTrianglePointsDue);
//const scaledTrianglePointsDue = scaleTriangle(trianglePointsDue, 1.5);
for (const triangleData of scaledTrianglePointsDue) {
  const newTriangle = new Article({
    user: userId,
    group: "scaled1",
    name: triangleData.name,
    category: "moyen",
    latitudeSelectionee: triangleData.latitudeSelectionee,
    longitudeSelectionee: triangleData.longitudeSelectionee,
    type: triangleData.type,
    image: triangleData.image,
  });

  await newTriangle.save();
}
console.log("Articoli salvati nel database:", scaledTrianglePointsDue);

    // 3. Salva tutti gli articoli triangleDataTre nel database
    const scaledTrianglePointsTre = scaleTriangle(JSON.parse(JSON.stringify(trianglePoints)), 2.0);
    console.log('Scaled Triangle Points Tre:', scaledTrianglePointsTre);
  
    for (const triangleData of scaledTrianglePointsTre ) {
      const newTriangle = new Article({
        user: userId,
        group: "scaled2",
        name: triangleData.name,
        category: "bas",
      
        latitudeSelectionee: triangleData.latitudeSelectionee,
        longitudeSelectionee: triangleData.longitudeSelectionee,
        type: triangleData.type,
        image: triangleData.image,
      });

      await newTriangle.save();
    }
 
    console.log("Articoli salvati nel database:", scaledTrianglePointsTre);
    // Impostazione del messaggio di successo nella sessione
    req.session.message = {
      type: "success",
      message: "Articoli aggiunti con successo!",
    };

    const allTriangles = [...trianglePoints, ...scaledTrianglePointsDue, ...scaledTrianglePointsTre];

    const groupedTriangles = allTriangles.reduce((acc, triangle) => {
      if (!acc[triangle.group]) acc[triangle.group] = [];
      acc[triangle.group].push(triangle);
      return acc;
    }, {});
    
    console.log("Grouped Triangles by Group:", groupedTriangles);

    // Redirect alla home dopo il salvataggio degli articoli
    return res.redirect("/indexZoneAuthor");

  } catch (err) {
    console.error("Errore durante l'aggiunta degli articoli:", err);
    res.status(500).send("Errore durante l'invio degli articoli");
  }
});
router.post("/ajoute_triangle", async (req, res) => {
  try {
    const userId = req.session.user?._id;
    const articles = req.body.articles;
       
    // Validazione
    if (!Array.isArray(articles)) { // Parentesi mancante aggiunta
      return res.status(400).json({ message: "Formato dati non valido" });
    }
    // Anche la riga successiva va corretta
  if (articles.length !== 3) {
    return res.status(400).json({ message: "Richiesti esattamente 3 articoli" });
  }
    // Controllo articoli esistenti
    const existingCount = await Article.countDocuments({ 
      user: userId, 
      type: "trepunti"
    });
    
    if (existingCount >= 3) {
      return res.status(400).json({ message: "Limite massimo di 3 articoli raggiunto" });
    }

    // Salvataggio
    const savedArticles = await Article.insertMany(
      articles.map(article => ({
        user: userId,
        ...article,
        latitudeSelectionee: parseFloat(article.latitudeSelectionee),
        longitudeSelectionee: parseFloat(article.longitudeSelectionee)
      }))
    );

    req.session.message = {
      type: "success",
      message: "Articoli aggiunti con successo!"
    };

    res.status(200).json({ success: true });

  } catch (err) {
    console.error("Errore:", err);
    res.status(500).json({ message: "Errore interno del server" });
  }
});

router.post("/ajoute_trois_marker", upload, async (req, res) => {
  try {

    console.log("📥 Dati ricevuti:", req.body);
    // Assicurati che group sia incluso
    const userId = req.body.id || req.session.user._id; // Recupera l'ID dell'utente
    const type = req.body.type; // Es: "triangle" o "pentagone"
    // Conta gli articoli già aggiunti dall'utente


// Definisci il numero massimo di articoli per tipo
let maxArticles = 0;
if (type === "troismarker") {
  maxArticles = 3;
} else if (type === "pentagone") {
  maxArticles = 5;
} else {
  return res.status(400).send("Tipo di articolo non valido.");
}
    const existingTriangles  = await Article.countDocuments({ 
      user: userId,
      type: type, // Aggiunge un campo specifico per distinguere le figure
    });
    console.log(`existingTriangles: ${existingTriangles}:`);
      console.log(`MaxArticles: ${maxArticles}:`);
    if (existingTriangles >= maxArticles) {
      // Se l'utente ha già 3 articoli, blocca l'aggiunta
      return res.status(400).send(`Puoi aggiungere al massimo  ${maxArticles} articoli di tipo ${type}`);
    }

    const { body, files } = req;
    const trianglePoints = [];
    
    let i = 0;
    // Ciclo per ciascun articolo basato sugli indici delle coordinate (da 0 a 2)
    while (body[`latitudeSelectioneeInput_${i}`]) {
      console.log(`Trovato articolo ${i}:`);
      // Recupera e controlla le coordinate
      const latitude = parseFloat(body[`latitudeSelectioneeInput_${i}`]);
      const longitude = parseFloat(body[`longitudeSelectioneeInput_${i}`]);

      // Verifica che le coordinate siano numeriche
      if (isNaN(latitude) || isNaN(longitude)) {
        console.log("Errore: Coordinate non valide");
        return res.status(400).send("Le coordinate devono essere numeriche.");
      }
      // Recupera il file caricato per questo articolo
      const imageField = `image_${i}`;
      const imageFile = body[imageField] || "image_3.png"; // Usa il valore da req.body
      
      // Creazione dei dati per l'articolo
      const articleData = {
        name: body.name && body.name.trim() !== "" ? body.name : "Default Name",  // Usa il valore di 'name' dal form
        category: body.category && body.category.trim() !== "" ? body.category : "bon",  // Usa 'category' dal form
        latitudeSelectionee: latitude,  // Latitudine
        longitudeSelectionee: longitude,  // Longitudine
        type: "troismarker",
        group: "trePunti", // Aggiungi il gruppo iniziale
         image: imageFile,  
     };
      
      console.log(`Articolo ${i} dati:`, articleData);

      // Verifica che tutti i campi obbligatori siano presenti
      if (!articleData.name || !articleData.category || !articleData.latitudeSelectionee || !articleData.longitudeSelectionee) {
        console.log("Errore: Manca uno dei campi obbligatori");
        return res.status(400).send("Tutti i campi sono obbligatori");
      }

      // Aggiungi l'articolo all'array
      trianglePoints.push(articleData);
      i++; // Incrementa l'indice per il prossimo articolo
    }

    // Verifica che siano stati trovati articoli
    if (trianglePoints.length === 0) {
      return res.status(400).send("Nessun articolo da aggiungere.");
    }

    // 1.Salva tutti gli articoli triangleData nel database
    for (const triangleData of trianglePoints ) {
      const newTriangle = new Article({
        user: userId,
        name: triangleData.name,
        category: triangleData.category,
      
        latitudeSelectionee: triangleData.latitudeSelectionee,
        longitudeSelectionee: triangleData.longitudeSelectionee,
        type: triangleData.type,
         group: 'trePunti', 
        image: triangleData.image,
      });

      await newTriangle.save();
    }
 
    console.log("Articoli salvati nel database:", trianglePoints);

    // Impostazione del messaggio di successo nella sessione
    req.session.message = {
      type: "success",
      message: "Articoli aggiunti con successo!",
    };

    // Redirect alla home dopo il salvataggio degli articoli
    return res.redirect("/indexZoneAuthor");

  } catch (err) {
    console.error("Errore durante l'aggiunta degli articoli:", err);
    res.status(500).send("Errore durante l'invio degli articoli");
  }
});
// ROUTE PER IL PENTAGONO
router.post("/ajoute_pentagone", upload, async (req, res) => {
  try {
    console.log(req.body);
 
    const userId = req.body.id || req.session.user._id; // Recupera l'ID dell'utente
    const type = req.body.type; // Es: "triangle" o "pentagone"
  
    // Conta gli articoli già aggiunti dall'utente
    const existingPentagone = await Article.countDocuments({ 
      user: userId,
      type: type,
     });
     console.log(req.body.type);
// Definisci il numero massimo di articoli per tipo
let maxArticles = 0;
if (type === "triangle") {
  maxArticles = 3;
} else if (type === "pentagone") {
  maxArticles = 5;
} else {
  return res.status(400).send("Tipo di articolo non valido.");
}
    if (existingPentagone >= maxArticles) {
      // Se l'utente ha già 3 articoli, blocca l'aggiunta
      return res.status(400).send("Puoi aggiungere al massimo 5 articoli.");
    }

    const { body, files } = req;
    const pentagonePoints = [];

    let i = 0;
    // Ciclo per ciascun articolo basato sugli indici delle coordinate (da 0 a 2)
    while (body[`latitudeSelectioneeInput_${i}`]) {
      console.log(`Trovato articolo ${i}:`);
      // Recupera e controlla le coordinate
      const latitude = parseFloat(body[`latitudeSelectioneeInput_${i}`]);
      const longitude = parseFloat(body[`longitudeSelectioneeInput_${i}`]);

      // Verifica che le coordinate siano numeriche
      if (isNaN(latitude) || isNaN(longitude)) {
        console.log("Errore: Coordinate non valide");
        return res.status(400).send("Le coordinate devono essere numeriche.");
      }
      // Recupera il file caricato per questo articolo
      const imageField = `image_${i}`;
      const imageFile = body[imageField] || "image_3.png"; // Usa il valore da req.body
      
      // Creazione dei dati per l'articolo
      const pentagoneData = {
        name: body.name && body.name.trim() !== "" ? body.name : "Default Name",  // Usa il valore di 'name' dal form
        category: body.category && body.category.trim() !== "" ? body.category : "bon",  // Usa 'category' dal form
       latitudeSelectionee: latitude,  // Latitudine
        longitudeSelectionee: longitude,  // Longitudine
        type: "pentagone",
        image: imageFile,  
     };
      
      console.log(`Articolo ${i} dati:`, pentagoneData);

      // Verifica che tutti i campi obbligatori siano presenti
      if (!pentagoneData.name || !pentagoneData.category || !pentagoneData.latitudeSelectionee || !pentagoneData.longitudeSelectionee) {
        console.log("Errore: Manca uno dei campi obbligatori");
        return res.status(400).send("Tutti i campi sono obbligatori");
      }

      // Aggiungi l'articolo all'array
      pentagonePoints.push(pentagoneData);
      i++; // Incrementa l'indice per il prossimo articolo
    }

    // Verifica che siano stati trovati articoli
    if (pentagonePoints.length === 0) {
      return res.status(400).send("Nessun articolo da aggiungere.");
    }

    // Salva tutti gli articoli nel database
    for (const pentagoneData of pentagonePoints) {
      const newPentagone = new Article({
        user: userId,
        name: pentagoneData.name,
        category: pentagoneData.category,
      
        latitudeSelectionee: pentagoneData.latitudeSelectionee,
        longitudeSelectionee: pentagoneData.longitudeSelectionee,
        type: pentagoneData.type, // Usa il valore dinamico
   
          image: pentagoneData.image,
      });

      await newPentagone.save();
    }
  
    console.log("Articoli salvati nel database:", pentagonePoints);

    // Impostazione del messaggio di successo nella sessione
    req.session.message = {
      type: "success",
      message: "Articoli aggiunti con successo!",
    };

    // Redirect alla home dopo il salvataggio degli articoli
    return res.redirect("/indexZoneAuthor");

  } catch (err) {
    console.error("Errore durante l'aggiunta degli articoli:", err);
    res.status(500).send("Errore durante l'invio degli articoli");
  }
});

// delete a product
 // Assurez-vous que 'fs' est inclus

router.get('/delete/:id', async (req, res) => {
  try {
    const articleId = req.params.id;
    const userId = req.session.user ? req.session.user._id : null;
    const isAdmin = req.session.user && req.session.user.email === 'coucou0@gmail.com';

    console.log("ID articolo:", articleId);
    console.log("ID utente:", userId);
    console.log("Admin calcolato:", isAdmin);

    let result;

    try {
      // Se l'utente è admin, cerca solo per `_id`
      if (isAdmin) {
        // L'admin può eliminare qualsiasi articolo, non dipende dal campo `user`
        result = await Article.findOne({ _id: articleId });
      } else {
        // Gli utenti normali possono eliminare solo i propri articoli
        result = await Article.findOne({ _id: articleId, user: userId });
      }

  // Vérifiez si l'article existe et appartient à l'user loggé
    if (!result) {
      console.log("Articolo non trovato o non autorizzato");
      return res.status(404).send('Article non trouvé ou non autorisé à être supprimé');
    }

     // Supprimer l'article
     await Article.findByIdAndDelete(articleId)
    } catch (err) {
      console.error('Errore MongoDB:', err);
      res.status(500).send('Errore del server');
    }  
      // Si l'article a une image associée, supprimer l'image
      if (result && result.image) {  
        // Construire le chemin de l'image
           // Supprimer le fichier image de manière synchrone
         try {
          fs.unlinkSync(imagePath);
        const imagePath = './uploads/' + result.image;
          console.log(imagePath);
          console.log('Image supprimée avec succès');
        } catch (err) {
          console.error('Erreur lors de la suppression de l\'image:', err);
        }
      }

      // Afficher un message de succès dans la console
      console.log('Article supprimé avec succès');

      // Rediriger vers la page principale après suppression
      res.redirect('/indexZoneAuthor');
    } catch (err) {
    // Gérer les erreurs et les afficher dans la console
    console.error('Erreur lors de la suppression de l\'article:', err);
    res.status(500).send('Erreur lors de la suppression de l\'article');
  }
});

router.get("/edit/:id", isAuthenticated, isAuthor, async(req, res) => {
  try {
     let id = req.params.id;

    // Recupera tutti gli articoli di quell'utente (presupponendo che ci sia un campo 'author' che salva l'ID dell'utente)
    const article = await Article.findById(id);

    if ( article) {
      res.render("edit_article", {
        title: 'Edit Page',

        article: article,   // L'articolo che l'utente sta modificando
       // articles: userArticles    // Tutti gli articoli dell'utente per mostrare i marker
     
      });
    } else {
      res.status(404).send('Articoli non trovati');
    }
  } catch (err) {
     // Gérer les erreurs et les afficher dans la console
     console.error('Erreur lors de la suppression de l\'article:', err);
     res.status(500).send('Erreur lors de la suppression de l\'article');
    }
});



router.param("id", async (req, res, next, id) => {
  if (!id || id === "undefined") {
    return res.status(400).json({ error: "ID articolo mancante" });
}

  try {
    const article = await Article.findById(id);
    if (!article) {
        return res.status(404).json({ error: "Articolo non trovato" });
    }
    req.article = article;
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
module.exports = groupedByType;
module.exports = router