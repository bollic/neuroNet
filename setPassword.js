const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("./models/User"); // path corretto al tuo modello

mongoose.connect("mongodb://127.0.0.1:27017/zone", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function resetPassword(email, newPassword) {
  const user = await User.findOne({ email });
  if(!user) return console.log("Utente non trovato");

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  console.log(`✅ Password aggiornata per ${email}`);
  mongoose.disconnect();
}

resetPassword("field-group-1759609148362@fake.local", "test123");
