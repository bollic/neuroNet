const express = require("express");
const router = express.Router();
//const Stripe = require("stripe");
//const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // chiave privata dal .env

router.post("/create-checkout-session", async (req, res) => {
  const { priceId } = req.body;
  if (!priceId) {
    return res.status(400).json({ error: "priceId mancante" });
  }

  // Simulazione
  console.log("Simulazione pagamento per priceId:", priceId);
    // ✅ Redirect temporaneo direttamente alla pagina di signup
  res.redirect("/signup?role=field");
//  return res.json({ url: "/success" }); // redirige a success senza Stripe
});
/*
// 👉 Route per creare una sessione di pagamento
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { priceId } = req.body; // arriva dal frontend

    if (!priceId) {
      return res.status(400).json({ error: "priceId mancante" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription", // abbonamento (oppure "payment" per una tantum)
      line_items: [
        {
          price: priceId, // ID del piano definito su Stripe
          quantity: 1,
        },
      ],
      success_url: "http://localhost:3000/success", // redirect se OK
      cancel_url: "http://localhost:3000/cancel",   // redirect se annulla
    });

    // Restituisco l'URL della sessione
    res.json({ url: session.url });
  } catch (err) {
    console.error("Errore Stripe:", err);
    res.status(500).json({ error: "Errore durante la creazione della sessione" });
  }
});
*/
module.exports = router;
