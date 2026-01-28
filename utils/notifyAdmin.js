// utils/notifyAdmin.js

const nodemailer = require("nodemailer");

async function notifyAdminUpgrade({ groupId, userEmail, newPlan }) {
     console.log("📣 UPGRADE PRO");
  console.log("Gruppo:", groupId);
  console.log("Utente:", userEmail);
  console.log("Piano:", newPlan);
  console.log("Data:", new Date().toISOString());
  // 🔎 Debug minimo (utile in dev)
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_EMAIL_PASS) {
    console.warn("⚠️ EMAIL NON INVIATA: credenziali SMTP mancanti");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.ADMIN_EMAIL,
      pass: process.env.ADMIN_EMAIL_PASS, // ⚠️ APP PASSWORD
    },
  });

  const mailOptions = {
    from: `"System" <${process.env.ADMIN_EMAIL}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `🚀 Upgrade PRO – Gruppo ${groupId}`,
    text: `
Upgrade piano effettuato

Gruppo: ${groupId}
Utente: ${userEmail}
Nuovo piano: ${newPlan}
Data: ${new Date().toLocaleString()}
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email admin inviata:", info.messageId);
  } catch (err) {
    console.error("❌ Errore invio email admin:", err.message);
  }
    
}

module.exports = { notifyAdminUpgrade };
