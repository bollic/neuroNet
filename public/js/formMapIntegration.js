// js/formMapIntegration.js
import { map, drawnItems } from "./mapCore.js"; // map già inizializzata in dataAuthorGeo.js
import { updateMap, updateTable } from "./pointUtils.js";
import { points } from "./pointUtils.js";
document.addEventListener("mapReady", () => {
   console.log("📌 formMapIntegration caricato"); // <-- log per capire se mapReady viene triggerato più volte

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
  
  // -----------------------
  // CLICK SULLA MAPPA
  // -----------------------
  map.on("click", e => {
     if (!window.isSelectingPoint) return; // 👈 BLOCCA se non stai aggiungendo
    drawnItems.clearLayers();
    const marker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
    drawnItems.addLayer(marker);

     document.getElementById("point").value = JSON.stringify(marker.toGeoJSON());

  window.isSelectingPoint = false; // 👈 STOP dopo un click
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
    if (!response.ok) {
      const text = await response.text();
      console.error("Server error:", text);
      alert("Erreur serveur");
      return;
    }
    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result?.message || "Erreur serveur");
      return;
    }

    console.log("✅ Success:", result.point);
    
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
    updateTable();

    document.getElementById("map-overlay")?.classList.add("hidden");
    form.reset();
    drawnItems.clearLayers();

   

  } catch (err) {
    console.error(err);
    alert("Errore di connessione");
  }
});



});
