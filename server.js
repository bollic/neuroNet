// npm run devStart
require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require('mongoose')
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo');


// Abilita il debug di Mongoose
mongoose.set('debug', true);

//import connectDB from './connectDB/connectDB.js'
//         mongodb+srv://soniaBoss:KLP59dnH8@cluster0.cvr9g5a.mongodb.net/?retryWrites=true&w=majority
mongoose.connect(process.env.DATABASE_URL)
  .then(() => {
    console.log('Connexion à MongoDB réussie !');

    (async () => {
      try {
    /*    PointModel.deleteMany({
  user: { $in: ['683a1e037fdec5305b3c0cf2', '683b4242c4bc1d2fd38df94a'] }
}).then(result => {
  console.log(`🧹 Pulizia completata. Punti eliminati: ${result.deletedCount}`);
});
*/
/*
        const coucouUserId = new mongoose.Types.ObjectId('675185f9fe88f5f41b5a40e9');

        const deletedPoints = await PointModel.deleteMany({ user: coucouUserId });
        const deletedParcelles = await ParcelleModel.deleteMany({ user: coucouUserId });

        console.log(`${deletedPoints.deletedCount} punti eliminati per Coucou.`);
        console.log(`${deletedParcelles.deletedCount} parcelle eliminate per Coucou.`);
    */  
   /*const deletedPoints = await PointModel.deleteMany({});
    console.log(`🧹 Pulizia completa. Punti eliminati: ${deletedPoints.deletedCount}`);
*/

      } catch (error) {
        console.error('Errore durante l\'eliminazione dei dati di Coucou:', error);
      }
    })();
  })
  .catch(() => console.log('Connexion à MongoDB échouée !'));


// Assurez-vous que votre application sait où se trouve le répertoire 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

//app.use(express.static("uploads")); 
app.use(express.static("public"))
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// 🔒 Indispensabile per cookie "secure" dietro proxy come Render
app.set('trust proxy', 1);
app.use(session({
  secret: 'tonia', // Remplace par une clé secrète sécurisée
  resave: false,
  saveUninitialized: false, 
  store: MongoStore.create({
      mongoUrl: process.env.DATABASE_URL
  }),
  cookie: {
  //secure: false, // ✅ Solo true se in produzione reale
  secure: process.env.NODE_ENV === 'production', // ✅ solo HTTPS in prod
  httpOnly: true,
  sameSite: 'lax',
  maxAge: 24 * 60 * 60 * 1000 // 24 ore
}

 //cookie: { secure: false } // 'false' pour le développement, à passer à 'true' en production avec HTTPS
}));
console.log('Ambiente di esecuzione:', process.env.NODE_ENV);

app.use((req, res, next) => {
  console.log('🔎 Sessione corrente:', req.session);
  next();
});
app.use((req, res, next) => {
    res.locals.message = req.session.message;
    delete req.session.message;
    next();
})


// Setting EJS as templating engine
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");

const userRouter = require("./routes/users")
const articlesGeoRoutes = require('./routes/articlesGeo');

app.use('/', articlesGeoRoutes);
app.use("/", userRouter)


//app.use("/posts", postRouter)
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

