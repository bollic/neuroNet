const express = require("express");
const router = express.Router();
const fs = require('fs');
const bcrypt = require('bcrypt'); // Utilisé pour comparer les mots de passe hachés

const mongoose = require('mongoose');
const Article = require('../models/articles');
const User = require('../models/users');

const multer = require('multer');
router.use(logger);
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

//image upload
var storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, './uploads');
  },
  filename: function(req, file, cb){
   // cb(null, file.fieldname+"_"+Date.now()+"_"+file.originalname)
   cb(null, file.originalname)

  },
});

var upload = multer({
   storage: storage,
}).single('image');

// Utiliser le middleware pour protéger la route des articles

router.get('/',  async (req, res) => {
 try {
       // Recupera tutti gli articoli di tutti gli utenti
      const articles = await Article.find().populate('user'); // Popola il campo user per avere accesso a userID
     
      // Log per vedere tutti gli articoli prima del raggruppamento
    console.log("All articles:", articles);

    // Raggruppa gli articoli per userID
    const groupedByUser = articles.reduce((acc, article) => {
      const userId = article.user._id.toString(); // ottieni l'ID dell'utente
  
      // Log per ogni articolo in fase di elaborazione
      console.log("Processing article:", article);
      console.log("UserID:", userId);
      
      if (!acc[userId]) {
        acc[userId] = {
          user: article.user, // Dettagli utente per identificare chi ha creato la rete
          articles: [],       // Array dei marker dell'utente
        };
        console.log(`Created new group for user ${userId}`);
      }
    // Aggiungi l'articolo al gruppo dell'utente
    acc[userId].articles.push(article);
     console.log(`Article added to user ${userId}:`, article.name);

      return acc;
    }, {});

     // Log finale per verificare il risultato del raggruppamento
     console.log("Grouped articles by user:", groupedByUser);

       // Rendi la pagina con gli articoli e l'user connesso
        res.render('index',  {
            title:'la liste des points',
              session: req.session, // Passer la session à la vue
              user: req.session ? req.session.user : null, // Vérifiez si un user est connecté, sinon null
              articles: articles,
              groupedByUser: groupedByUser,             
             })
            } catch (error) {
              console.error('Errore durante la ricerca degli articoli:', error);
              res.status(500).send('Erreur lors de la récupération des articles');
            }
});

router.get('/indexZoneAuthor',  isAuthenticated,  async (req, res) => {
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
    const articles = await Article.find({ user: userId });
      // Aggiungi un log per il debug
    console.log('Articoli trovati per l\'utente:', userId, articles);

    // Aggiungi log dettagliato
    console.log('ID utente loggato:', userId);
    articles.forEach((article, index) => {
      console.log(`Articolo ${index + 1} - User ID: ${article.user}, Nome: ${article.name}`);
    });

     // Rendre la page avec les articles et l'user connecté
         res.render('indexZoneAuthor',  {
             title:'la liste tes points',
               session: req.session, // Passer la session à la vue
               user: req.session.user, // Vérifiez si un user est connecté
                //id: userId,
               articles: articles, // Passe les articles à la vue             
              })
             } catch (error) {
              console.error('Errore durante la ricerca degli articoli:', error);

               res.status(500).send('Erreur lors de la récupération des articles');
             }
 });
// groupedByUser come variabile lato server
//let groupedByUser = {}; // Popolalo con i tuoi dati, per esempio da un database
// Rotta per restituire groupedByUser al client
// In routes/articles.js o simile
router.get('/api/grouped-by-user', async (req, res) => {
  try {
    const articles = await Article.find().populate('user'); // Recupera articoli e popola il campo 'user'
    
    // Raggruppa gli articoli per userID
    const groupedByUser = articles.reduce((acc, article) => {
      const userId = article.user._id.toString();

      if (!acc[userId]) {
        acc[userId] = {
          user: article.user,  // Dettagli dell'utente
          articles: [],        // Array per gli articoli
        };
      }
      acc[userId].articles.push({
        _id: article._id,
        name: article.name,
        latitude: article.latitudeSelectionee,
        longitude: article.longitudeSelectionee,
        category: article.category,
        image: article.image
      });
      return acc;
    }, {});


    if (!groupedByUser) {
      console.error('Dati mancanti o non validi per groupedByUser');
      return res.status(500).json({ error: 'Dati non trovati' });
  }
  console.log('Dati raggruppati da inviare:', groupedByUser);
    res.json(groupedByUser); // Restituisci il risultato in formato JSON
  } catch (error) {
    console.error('Errore nel recupero degli articoli:', error);
    res.status(500).send('Errore nel recupero degli articoli');
  }
});


// Route per aggiornare la posizione dell'articolo
router.put('/api/articles/:id', async (req, res) => {
  try {
      const { latitudeSelectionee, longitudeSelectionee } = req.body;
      const updatedArticle = await Article.findByIdAndUpdate(
        req.params.id,  // Id dell'articolo da aggiornare
        { latitudeSelectionee, longitudeSelectionee },  // Campi da aggiornare
        { new: true }  // Opzione per restituire l'articolo aggiornato
      );

      if (!updatedArticle) {
          return res.status(404).json({ success: false, message: "Articolo non trovato." });
      }

      res.json({ success: true, article: updatedArticle });
  } catch (error) {
      console.error("Errore nell'aggiornamento:", error);
      res.status(500).json({ success: false, message: "Errore del server." });
  }
});


// Route de déconnexion
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/'); // Rediriger vers la page articles après déconnexion
  });
});




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
router.get("/addForm", isAuthenticated, (req, res) => {
  // Log per vedere se l'utente è stato autenticato correttamente e cosa contiene la sessione
  console.log("Accesso a /addForm - sessione utente:", req.session ? req.session.user._id : "Nessuna sessione");

  if (req.session.user) {
  res.render("ajoute_articles", { title: 'Article Form Page', user: req.session.user});
  
} else {
    // Log per verificare se si viene reindirizzati al login
    console.log("Utente non autenticato, reindirizzamento a /login");
  res.redirect("/login");  // Se l'utente non è loggato, reindirizza alla pagina di login
}
});

router.post("/ajoute_articles", upload, async(req, res) => {
  // Log del corpo della richiesta e della sessione
  console.log("Dati del form ricevuti:", req.body);
  console.log("Sessione utente:", req.session ? req.session.user : "Nessuna sessione");
  const articles = new Article({
 
    user: req.body.id,
    name: req.body.name,
    category: req.body.category,
    vertex: req.body.vertex,
    image: req.file.filename,
    latitudeSelectionee: req.body.latitudeSelectionee,
    longitudeSelectionee: req.body.longitudeSelectionee,
    user: req.session.user,
    session: req.session, // Passer la session à la vue
   // message: req.session.message  // Passe l'user connecté à la vue
  });
  try {
    await articles.save();
    req.session.message = {
      type: "success",
      message: "Article ajouté avec succes!",
     
    }
    res.redirect('/');
    console.log("Articolo aggiunto con successo:", req.session.message)
  } catch (err) {
    console.error("Errore durante l'aggiunta dell'articolo:", err);
    res.status(500).send('Erreur lors de l enregistrement de l user');
  }
 
});

// delete a product
 // Assurez-vous que 'fs' est inclus

router.get('/delete/:id', async (req, res) => {
  try {
   // Récupérer l'ID de l'article depuis les paramètres de l'URL
    const articleId = req.params.id;
    //const userId = req.session.user._id;
     const userId = req.session.user ? req.session.user._id : null;
   
     console.log("ID articolo:", articleId); // Per controllare se l'ID è corretto
     console.log("ID utente:", userId);

     let result;  // Dichiarare result all'esterno del blocco try
  
     try {
    // Trouver l'article par ID et user loggé
    const result = await Article.findOne({ _id: articleId,  user: userId });
   
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
        // Controlla se l'immagine esiste
        // Construire le chemin de l'image
        const imagePath = './uploads/' + result.image;

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
      res.redirect('/');
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


router.post("/edit/:id", upload, async (req, res) => {
  try {
    let articleId = req.params.id;
    console.log("ID dell'articolo passato:", req.params.id);
    //image: req.file.filename,
    // Trouver l'user par son ID
    let article = await Article.findById(articleId);
    console.log("Articolo passato:", req.params.id);

    if (article) {
      // Mettre à jour les informations de l'user
      article.name = req.body.name;
      article.latitudeSelectionee = req.body.latitudeSelectionee;
      article.longitudeSelectionee = req.body.longitudeSelectionee;
     // article.image = req.file.filename
      // Vérifiez si une nouvelle image a été uploadée
      if (req.file) {
        // Supprimer l'ancienne image si elle existe
        if (article.image) {
          console.log(article.image)
          const oldImagePath = './uploads/' + article.image;
          try {
            fs.unlinkSync(oldImagePath);
            console.log('Ancienne image supprimée avec succès');
          } catch (err) {
            console.error('Erreur lors de la suppression de l\'ancienne image:', err);
          }
        }
        // Mettre à jour le chemin de la nouvelle image
        article.image = req.file.filename;
      }

      // Sauvegarder les modifications dans la base de données
      await article.save();

      // Rediriger vers la page principale avec un message de succès
      res.redirect('/');
    } else {
      res.status(404).send('user non trouvé');
    }
  } catch (err) {
    console.error('Erreur lors de la mise à jour de l\'article:', err);
    res.status(500).send('Erreur lors de la mise à jour de l\'article');
  }
});


/*
// Route per aggiornare la posizione dell'articolo
router.put("/api/articles/:id", async (req, res) => {
  try {
    const articleId = req.params.id;
    
    console.log("ID dell'articolo passato:", req.params.id);
    //image: req.file.filename,
    // Trouver l'user par son ID
    const updatedArticle  = await Article.findByIdAndUpdate(
      articleId,
    
    );
    console.log("Articolo passato:", req.params.id);

    if (updatedArticle) {
      // Mettre à jour les informations de l'user
      article.name = req.body.name;
      article.latitudeSelectionee = req.body.latitudeSelectionee;
      article.longitudeSelectionee = req.body.longitudeSelectionee;
     // article.image = req.file.filename
      // Vérifiez si une nouvelle image a été uploadée
      if (req.file) {
        // Supprimer l'ancienne image si elle existe
        if (article.image) {
          console.log(article.image)
          const oldImagePath = './uploads/' + article.image;
          try {
            fs.unlinkSync(oldImagePath);
            console.log('Ancienne image supprimée avec succès');
          } catch (err) {
            console.error('Erreur lors de la suppression de l\'ancienne image:', err);
          }
        }
        // Mettre à jour le chemin de la nouvelle image
        article.image = req.file.filename;
      }

      // Sauvegarder les modifications dans la base de données
      await article.save();

      // Rediriger vers la page principale avec un message de succès
      res.redirect('/');
    } else {
      res.status(404).send('user non trouvé');
    }
  } catch (err) {
    console.error('Erreur lors de la mise à jour de l\'article:', err);
    res.status(500).send('Erreur lors de la mise à jour de l\'article');
  }
});*/

/*
router
  .route("/:id")
  .get((req, res) => {
    console.log(req.user)
    res.send(`Get User With ID ${req.params.id}`)
  })
  .put((req, res) => {
    res.send(`Update User With ID ${req.params.id}`)
  })
  .delete((req, res) => {
    res.send(`Delete User With ID ${req.params.id}`)
  })
*/
/*
router.param("id", (req, res, next, id) => {
  req.user = users[id]
  next()
})*/
router.param("id", async (req, res, next, id) => {
  try {
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).send('Article non trouvé');
    }
    req.article = article;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur lors de la récupération de l\'article');
  }
});

function logger(req, res, next) {
  console.log(req.originalUrl)
  next()
}

module.exports = router