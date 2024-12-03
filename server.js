// npm run devStart
require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require('mongoose')
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const Article = require('./models/articles');
const User = require('./models/users');

// Abilita il debug di Mongoose
mongoose.set('debug', true);

//import connectDB from './connectDB/connectDB.js'
//         mongodb+srv://soniaBoss:KLP59dnH8@cluster0.cvr9g5a.mongodb.net/?retryWrites=true&w=majority
mongoose.connect(process.env.DATABASE_URL, {
   // useNewUrlParser: true,
   // useUnifiedTopology: true
    })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));


// Route per caricare gli articoli
/* app.get('/api/grouped-by-user', async (req, res) => {
  try {
      // Esegui la query per ottenere gli articoli dove 'user' esiste
      const articles = await Article.find({ 'user': { $exists: true } });

      // Raggruppa gli articoli per 'user._id'
      const groupedByUser = articles.reduce((acc, article) => {
          const userId = article.user._id.toString();  // Assicurati di avere un valore valido per userId
          if (!acc[userId]) {
              acc[userId] = { bon: [], moyen: [], bas: [] };  // Inizializza le categorie
          }
          // Aggiungi l'articolo alla categoria appropriata
          if (article.category) {
              acc[userId][article.category].push({
                  _id: article._id,
                  name: article.name,
                  latitude: article.latitudeSelectionee,
                  longitude: article.longitudeSelectionee,
                  image: article.image
              });
          }
          return acc;
      }, {});

      // Restituisci i dati come JSON
      res.json(groupedByUser);
  } catch (err) {
      console.error('Errore nella query degli articoli:', err);
      res.status(500).json({ error: 'Errore interno del server' });
  }
});
*/
// Assurez-vous que votre application sait où se trouve le répertoire 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


//app.use(express.static("uploads")); 
app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(session({
  secret: 'tonia', // Remplace par une clé secrète sécurisée
  resave: false,
  saveUninitialized: true, 
  store: MongoStore.create({
      mongoUrl: process.env.DATABASE_URL
  }),
  cookie: { 
    secure: false, // Imposta su 'false' per testare senza HTTPS
  // secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 }, // Imposta il cookie per 24 ore
 //cookie: { secure: false } // 'false' pour le développement, à passer à 'true' en production avec HTTPS
}));
console.log('Ambiente di esecuzione:', process.env.NODE_ENV);

app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
})

app.use(express.static(path.join(__dirname, 'js')));
// Setting EJS as templating engine
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");

const articleRouter = require("./routes/articles")
const userRouter = require("./routes/users")
//const postRouter = require("./routes/posts")

//app.use("/users", userRouter)
app.use("/", articleRouter)
app.use("/", userRouter)
//app.use("/posts", postRouter)
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//app.listen(4000)
