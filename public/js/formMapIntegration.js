// js/formMapIntegration.js
import { map, drawnItems } from "./mapCore.js"; // map già inizializzata in dataAuthorGeo.js
import { updateMap } from "./pointUtils.js";
import { points } from "./pointUtils.js";
document.addEventListener("mapReady", () => {
   console.log("📌 formMapIntegration caricato"); // <-- log per capire se maReady viene triggerato più volte

 /* function openOverlay() {
  const overlay = document.getElementById("map-overlay");
  if (overlay) overlay.classList.remove("hidden");

  // resettare il campo 'point' senza errori
  const pointInput = document.getElementById("point");
  if (pointInput) pointInput.value = "";
}
document.getElementById("open-add-point")?.addEventListener("click", () => {
  openOverlay();
});
*/

  const form = document.getElementById("add-point");
    // 🌍 OPEN MODE
  if (!form) {
  console.log("🌍 OPEN MODE → no form");
  return;
}
  // 👇 DISABILITA SUBMIT ALL'INIZIO
  const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
  // -----------------------
  // CLICK SULLA MAPPA
  // -----------------------
  map.on("click", e => {
     // 🚫 BLOCCO PLAN (QUI!!!)
  if (window.planUX?.blocked) {
    alert("🚫 Limite de points atteint pour votre plan");
    return;
  }

     if (!window.mapState.isSelectingPoint) return; // 👈 BLOCCA se non stai aggiungendo
    //  openOverlay(e.latlng.lat, e.latlng.lng, true); // 👈 QUI
    // 1️⃣ pulizia
    drawnItems.clearLayers();

    // 2️⃣ crea marker
    const marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
   
    // 3️⃣ 🔥 feedback immediato (SUBITO dopo creazione)
    marker.bindTooltip("📍 OK", { permanent: false }).openTooltip();
    setTimeout(() => marker.closeTooltip(), 900);

      // 4️⃣ aggiungi al layer
      drawnItems.addLayer(marker);

      // 5️⃣ salva GeoJSON
      document.getElementById("point").value = JSON.stringify(marker.toGeoJSON());
        
      // 6️⃣ reset stato UX
      window.mapState.isSelectingPoint = false;
      document.body.style.cursor = "default"; 
     
     // 7️⃣ apri overlay (con micro delay 👇)
      setTimeout(() => {
      //  openOverlay(e.latlng.lat, e.latlng.lng, true);
      }, 100);
        // 👇 RIATTIVA IL BOTTONE
      submitBtn.disabled = false;
  /*
  const pointInput = document.getElementById("point");
    if (pointInput) {
        pointInput.value = JSON.stringify(marker.toGeoJSON());
    } else {
        console.warn("⚠️ Input #point non trovato");
    }
  */
  });



    // -----------------------
  // GEOLOCALIZZAZIONE
  // -----------------------
  document.getElementById("use-my-location")?.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        drawnItems.clearLayers();
        const marker = L.marker([pos.coords.latitude, pos.coords.longitude]).addTo(map);
          marker.bindTooltip("📍 OK", { permanent: false }).openTooltip();
          setTimeout(() => marker.closeTooltip(), 800);
        drawnItems.addLayer(marker);
        document.getElementById("point").value = JSON.stringify(marker.toGeoJSON());
        map.setView([pos.coords.latitude, pos.coords.longitude], 8);
   

      });
    }
  });
  // -----------------------
  // SUBMIT AJAX (NUOVO)
  // -----------------------
 form?.addEventListener("submit", async e => {
  console.log("🔥 submit handler triggered");
  e.preventDefault();

  const mode = form.dataset.mode || "create";
  const pointId = document.getElementById("pointId").value;

  const formData = new FormData(form);

  try {
    let response;

    // 🟦 MODALITÀ EDIT
    if (mode === "edit" && pointId) {

      response = await fetch(`/points/${pointId}`, {
        method: "PUT",
        body: formData,
        credentials: "include"
      });
      
    } else {
      // 🟢 MODALITÀ CREATE

      const pointValue = document.getElementById("point").value;
      if (!pointValue) {
        alert("Ajoute un point avant d'envoyer!");
        return;
      }

      response = await fetch("/addPoint", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
    }


    // 🔥 QUI METTI LA PROTEZIONE
// 🔥 PROTEZIONE PLAN LIMIT / messaggi backend
let result;
try {
  result = await response.json(); // tenta di leggere il JSON
} catch {
  const text = await response.text(); // fallback se non è JSON
  console.error("Server error (non-JSON):", text);
  alert("Erreur serveur");
  return;
}


if (!response.ok || !result.success) {
  console.error("Server error:", result);
  alert(result?.message || "Erreur serveur");
  return;
}

alert("✅ Signalement ajouté");
    console.log("✅ Success:", result.point);
    // Chiusura automatica overlay dopo submit
    //closeOverlay();
    // DOPO SUCCESS
    form.reset();
    document.getElementById("point").value = "";
  if (mode === "edit" && pointId) {
  // 🔹 Normalizza _id
//   if (!result.point._id && result.point.id) result.point._id = result.point.id;
  if (!result.point._id && result.point.id) {
    result.point._id = result.point.id;
  }
/*
  if (typeof result.point.user === "string") {
    result.point.user = { _id: result.point.user };
  }
 */

  // 🔹 Aggiorna array globale
  const index = points.findIndex(p => String(p._id) === String(result.point._id));
  if (index !== -1) {
    points[index] = result.point;
  } else {
    points.push(result.point); // fallback
  }

  alert("✅ Point modifié avec succès !");
} else {
  // 🟢 CREATE
  if (typeof result.point.user === "string") result.point.user = { _id: result.point.user };

  points.push(result.point);
  alert("✅ Point ajouté avec succès !");
}
updateMap();

drawnItems.clearLayers();

form.reset();
document.getElementById("point").value = "";

window.closeForm();

  } catch (err) {
    console.error(err);
    alert("Errore di connessione");
  }
});



});
