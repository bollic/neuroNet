// dataAuthorParcelle.js
import { loadCategories } from "./mapCommon.js";
import { initializeMap } from "./mapCore.js";
import { loadBaseLayers,  getLayer } from "./mapLayers.js";
import { updateMap, setParcellesDeps, highlightParcelleOnMap } from "./parcelleUtils.js";
// esempio

function updateStatusButtonsUI(popupNode, activeStatus) {
  const buttons = popupNode.querySelectorAll(".btn-status");

  buttons.forEach(btn => {
    const btnStatus = btn.dataset.status;

    // reset testo (sempre uguale)
    if (btnStatus === "OK") btn.innerHTML = "🟢 OK";
    if (btnStatus === "NON_CONFORME") btn.innerHTML = "🔴 NON";
    if (btnStatus === "A_VERIFIER") btn.innerHTML = "🟡 VERIFY";

    // stile attivo / inattivo
    if (btnStatus === activeStatus) {
      btn.style.opacity = "1";
      btn.style.fontWeight = "bold";
    } else {
      btn.style.opacity = "0.5";
      btn.style.fontWeight = "normal";
    }
  });
}
async function loadParcellesFromApi() {
  const res = await fetch('/api/parcelles');
  const data = await res.json();
  return data.parcelles || [];
}

  function updatePopupUI(popupNode, newStatus) {
  const label = popupNode.querySelector(".status-label");
  if (label) {
    label.textContent = newStatus;
  }
}

console.log("🔥 FILE dataAuthorParcelle.js CARICATO");
 // 🔥 GESTIONE CLICK BOTTONI POPUP (STATUS)
  export function attachPopupEvents({ parcelles, map}) {
    map.off("popupopen"); // reset pulito

    map.on("popupopen", function (e) {
      const popupNode = e.popup.getElement();
      if (!popupNode) return;

  
  const buttons = popupNode.querySelectorAll(".btn-status");

  buttons.forEach(btn => {
    btn.addEventListener("click", async function (event) {
     event.preventDefault(); // ✅
        event.stopPropagation(); // ⭐ QUESTA
      const id = this.dataset.id;
      const status = this.dataset.status;
      //  const originalHTML = this.innerHTML; // ✅ QUI (mancava!)
      console.log("✅ CLICK STATUS:", id, status);
      //this.innerHTML = "⏳";
      try {
        const res = await fetch(`/parcelles/${id}/status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status })
        });

        const data = await res.json();
        console.log("✅ RISPOSTA SERVER:", data);

          // 👉 DOPO RISPOSTA SERVER
   // this.innerHTML = originalHTML;
// ✅ SOLUZIONE STABILE
//map.closePopup();

const parcelle = parcelles.find(p => String(p._id) === String(id));
if (parcelle) {
  parcelle.status = status;
}
// aggiorna SOLO UI popup
updatePopupUI(popupNode, status);
updateStatusButtonsUI(popupNode, status);
// ridisegna tutto pulito
//updateMap();
//attachPopupEvents({ parcelles, map });
//updateParcelleStyle(id, status);
       // location.reload();

      } catch (err) {
        console.error("❌ ERRORE UPDATE:", err);
          // 👉 errore visivo
   // this.innerHTML = originalHTML;
      }
    });
  });
});
}
// 🟦 BLOCCO 1 — Avvio: categorie → mappa → dati
document.addEventListener("DOMContentLoaded", async function() { 
 
  // 1️⃣ Carica le categorie
    await loadCategories();
   console.log("CATEGORIES caricate:", window.CATEGORIES);

  // -------------------
  // 2️⃣ Inizializza la mappa
  // -------------------
  const res = initializeMap();
  const map = res.map;
  await loadBaseLayers(map);
  const drawnItems = res.drawnItems;
  const parcellesLayer = res.parcellesLayer;
  const pointsLayer = res.pointsLayer;
  // 3️⃣ Recupera i dati
      let parcelles = window.parcelles;
      if (!parcelles) {
        // Se non ci sono parcelles dalla route, chiama API
        parcelles = await loadParcellesFromApi();
      }
        console.log("🌿 Parcelles dalla view:", parcelles);

      // const parcelles = await loadParcellesFromApi();
        //console.log("🌿 Parcelles caricate:", parcelles);
function highlightTableRow(parcelleId) {
/*
  const drawer = document.getElementById("my-drawer");

  // Apri il drawer se necessario
  if (drawer && !drawer.checked) {
    drawer.checked = true;
  }
*/
  console.log("CERCO PARCELLE:", parcelleId);

  // Rimuovi highlight precedente
  document
    .querySelectorAll(".parcelle-item")
    .forEach(el => {
      el.classList.remove("highlight-row");
    });

  // Cerca la parcelle nella nuova lista
  const item = document.querySelector(
    `.parcelle-item[data-id="${parcelleId}"]`
  );

  if (!item) {
    console.log("❌ PARCELLE NON TROVATA:", parcelleId);
    return;
  }

  console.log("✅ PARCELLE TROVATA:", item);

  // Evidenzia
  item.classList.add("highlight-row");

  // Scroll verso la parcelle
  setTimeout(() => {
    item.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }, 150);
}

  // 🟩 BLOCCO 2 — Passaggio delle dipendenze → aggiornamento della mappa-------------------
  // 4️⃣ Passa dipendenze a parcelleUtils
  // -------------------
  setParcellesDeps({
    map,
    parcelles,
    drawnItems,
    parcellesLayer,
    highlightTableRow
  });

  // -------------------
  // 5️⃣ Disegna sulla mappa
  // -------------------
updateMap();
attachPopupEvents({ parcelles, map });

// 🟧 BLOCCO 3 — Interazione lista ↔ mappa
document.querySelectorAll(".parcelle-item").forEach(el => {
  const id = el.dataset.id;

  el.addEventListener("mouseenter", () => {
    el.classList.add("highlight-row");
    highlightParcelleOnMap(id, true);
  });

  el.addEventListener("mouseleave", () => {
    el.classList.remove("highlight-row");
    highlightParcelleOnMap(id, false);
  });
});

 
    // -------------------
// 5.1️⃣ DISEGNA POINTS (solo combined)
// -------------------
const points = window.points || [];
const categories = window.CATEGORIES || [];   // ⭐ aggiungi questa riga
const statuses = window.STATUS || [];   // ⭐ aggiungi questa riga
if (points.length && map) {
  console.log("📍 Disegno points:", points.length);
  // ⭐ pulisce i marker precedenti
  pointsLayer.clearLayers();

  points.forEach(pt => {
     const coords = pt.coordinates || pt.geometry?.coordinates;
    if (!coords) return;

    const [lng, lat] = coords;

    // trova categoria
    const category = categories.find(c => c.name === pt.category);
    const currentStatus = statuses.find(s => s === pt.status);
 
    const iconEmoji = category?.icon || "📍";

  const emojiIcon = L.divIcon({
    className: "custom-marker",
    html: `<div style="font-size:22px">${iconEmoji}</div>`,
    iconSize: [24,24],
    iconAnchor: [12,12]
  });

  L.marker([lat, lng], { icon: emojiIcon })
    .addTo(pointsLayer)
    .bindPopup(pt.name || "Point");
  });
 // map.invalidateSize();

// Zoom automatico su tutti gli elementi
setTimeout(() => {
  const bounds = L.latLngBounds([]);

  // parcelles
  parcelles.forEach(p => {
    if (p.geometry?.coordinates) {
      const coords = p.geometry.coordinates[0];
      coords.forEach(c => bounds.extend([c[1], c[0]]));
    }
  });

  // points
  points.forEach(pt => {
    const coords = pt.coordinates || pt.geometry?.coordinates;
    if (!coords) return;

    const [lng, lat] = coords;
    bounds.extend([lat, lng]);
  });

  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [40,40] });
  }
}, 200);


}
// -------------------
// 6️⃣ Drawer resize
// -------------------
// const drawerToggle = document.getElementById("my-drawer");

setTimeout(() => {
  map.invalidateSize();
}, 300);


});