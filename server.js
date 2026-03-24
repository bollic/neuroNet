// server.js
// npm run devStart
require("dotenv").config();
const express = require("express");
const app = express();
//const User = require('./models/users');
//const PointModel = require('./models/Point');
//const Group = require('./models/Group');
const mongoose = require('mongoose')
const path = require('path');
const session = require('express-session');

//import connectDB from './connectDB/connectDB.js'
//         mongodb+srv://soniaBoss:KLP59dnH8@cluster0.cvr9g5a.mongodb.net/?retryWrites=true&w=majority
mongoose.connect(process.env.DATABASE_URL)
  .then(() => {
    console.log('Connexion à MongoDB réussie !');
  

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
   /* // Per eliminare tuuti i punti indistintamente
const deletedPoints = await PointModel.deleteMany({});
    console.log(`🧹 Pulizia completa. Punti eliminati: ${deletedPoints.deletedCount}`);
    */ /*(async () => {
  try {
    const groupsResult = await Group.deleteMany({});
    const usersResult = await User.deleteMany({});
    const pointsResult = await PointModel.deleteMany({});

    console.log('☢️ RESET TOTALE COMPLETATO');
    console.log(`- Gruppi eliminati: ${groupsResult.deletedCount}`);
    console.log(`- Utenti eliminati: ${usersResult.deletedCount}`);
    console.log(`- Punti eliminati: ${pointsResult.deletedCount}`);

  } catch (error) {
    console.error('❌ ERRORE DURANTE RESET TOTALE:', error);
  }
})();
*/
   // BLOCCO PRONTO PER ELIMINARE I PINTI CON CAMPO isAnon
 /* (async () => {
      try {
        const result = await Group.deleteMany({ groupId: { $nin: await User.find({ 
        role: 'office' }).distinct('groupId') } });
    console.log(`🧹 Gruppi orfani  eliminati: ${result.deletedCount}`);
      } catch (error) {
        console.error('Errore durante l\'eliminazione dei punti anonimi:', error);
      }
    })();
    */
     // elimina gruppi orfani
  /*  (async () => {
      try {
        console.log("🔍 Cerco gruppi orfani...");
        const officeGroupIds = await User.find({ role: "office" }).distinct("groupId");
        const result = await Group.deleteMany({ groupId: { $nin: officeGroupIds } });
        console.log(`🧹 Gruppi orfani eliminati: ${result.deletedCount}`);
      } catch (err) {
        console.error("❌ Errore durante l'eliminazione dei gruppi orfani:", err);
      }
    })();
*/
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
//app.set('trust proxy', 1);
// SESSIONE OK
app.use(session({
  name: 'sid',          // 👈 opzionale ma consigliato
  secret: 'tonia',
  resave: true,
  saveUninitialized: false,
 
  cookie: {
    secure: process.env.NODE_ENV === 'production', // mettilo su render
    // secure: false, // toglilo su render
    //secure: process.env.NODE_ENV === 'production', // mettilo in localhost
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// 🔐 1 SOLO middleware per user
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  req.user = req.session.user || null;
  next();
});

// 💬 1 SOLO middleware per flash messages
app.use((req, res, next) => {
  res.locals.flashMessage = req.session.flashMessage || null;
  delete req.session.flashMessage;
  next();
});

// LOG USER (non tocca la sessione)
app.use((req, res, next) => {
  console.log("💡 User loggato:", req.session.user?.email || "NO");
  next();
});

// LOG REQUEST
app.use((req, res, next) => {
  console.log(`➡️  REQUEST: ${req.method} ${req.originalUrl}`);
  next();
});


// Setting EJS as templating engine
app.set('views', path.join(__dirname, 'views'));
app.set("view engine", "ejs");

app.use((req, res, next) => {
  console.log(`➡️  REQUEST: ${req.method} ${req.originalUrl}`);
  next();
});
/*
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
 // res.locals.flashMessage = req.session.flashMessage || null;

  // dopo il render il messaggio scompare
  //delete req.session.flashMessage;

  next();
});*/

const pricingRouter = require('./routes/pricing');
const checkoutRoutes = require('./routes/checkout');
const userRouter = require("./routes/users");
const pointsApi = require('./routes/api/points.api');
const parcellesApi = require('./routes/api/parcelles.api');
const articlesGeoRoutes = require('./routes/articlesGeo');


app.use('/', pricingRouter);
app.use('/', checkoutRoutes);
app.use('/', userRouter);
app.use('/api/points', pointsApi);
app.use('/api/parcelles', parcellesApi);
app.use('/', articlesGeoRoutes);


//app.use("/posts", postRouter)
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

