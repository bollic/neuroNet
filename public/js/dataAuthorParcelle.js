// dataAuthorParcelle.js
import { loadCategories } from "./mapCommon.js";
import { initializeMap } from "./mapCore.js";
import { updateMap, setParcellesDeps } from "./parcelleUtils.js";
// esempio


async function loadParcellesFromApi() {
  const res = await fetch('/api/parcelles');
  const data = await res.json();
  return data.parcelles || [];
}

console.log("🔥 FILE dataAuthorParcelle.js CARICATO");

document.addEventListener("DOMContentLoaded", async function() { 
      // 1️⃣ Carica le categorie
    await loadCategories();
   console.log("CATEGORIES caricate:", window.CATEGORIES);

  // -------------------
  // 2️⃣ Inizializza la mappa
  // -------------------
  const res = initializeMap();
  const map = res.map;
  const drawnItems = res.drawnItems;
  const parcellesLayer = res.parcellesLayer;
  const pointsLayer = res.pointsLayer;
   // 3️⃣ Usa parcelles già passate dalla route
let parcelles = window.parcelles;
if (!parcelles) {
  // Se non ci sono parcelles dalla route, chiama API
  parcelles = await loadParcellesFromApi();
}
  console.log("🌿 Parcelles dalla view:", parcelles);

 // const parcelles = await loadParcellesFromApi();
  //console.log("🌿 Parcelles caricate:", parcelles);

  // -------------------
  // 4️⃣ Passa dipendenze a parcelleUtils
  // -------------------
  setParcellesDeps({
    map,
    parcelles,
    drawnItems,
    parcellesLayer
  });

  // -------------------
  // 5️⃣ Disegna sulla mappa
  // -------------------
  updateMap();
    // -------------------
// 5.1️⃣ DISEGNA POINTS (solo combined)
// -------------------
const points = window.points || [];
const categories = window.CATEGORIES || [];   // ⭐ aggiungi questa riga

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
  map.invalidateSize();

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
  const drawerToggle = document.getElementById("my-drawer");
  if (drawerToggle) {
    drawerToggle.addEventListener("change", () => {
      setTimeout(() => map.invalidateSize(), 300);
    });
  }

  // 7️⃣ DataTables

    // 1. INIZIALIZZA DATATABLES - SPOSTATO IN FONDO
    const table = $('#main-table').DataTable({
        pageLength: 20,
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.11.5/i18n/it-IT.json'
        }
    });

    // 2. GESTIONE CAMBIO ELEMENTI PER PAGINA
    $('#page-length').on('change', function() {
        table.page.len($(this).val()).draw();
    });

    // 3. AGGIORNA SELECT CON VALORE CORRENTE
    table.on('length.dt', function(e, settings, len) {
        $('#page-length').val(len);
    });

    // Aggiungi questi console.log per debug
    console.log("DataTables inizializzato:", table);
    console.log("Elementi nella tabella:", table.rows().count());

});