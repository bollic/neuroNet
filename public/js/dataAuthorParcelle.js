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

  // -------------------
  // 3️⃣ Carica parcelles dall’API
  // -------------------
  const parcelles = await loadParcellesFromApi();
  console.log("🌿 Parcelles caricate:", parcelles);

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