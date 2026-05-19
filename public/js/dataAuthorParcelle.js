// dataAuthorParcelle.js
import { loadCategories } from "./mapCommon.js";
import { initializeMap } from "./mapCore.js";
import { updateMap, setParcellesDeps } from "./parcelleUtils.js";
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
function highlightTableRow(parcelleId) {
  const drawer = document.getElementById("my-drawer");

  // 1️⃣ Apri drawer
  if (drawer && !drawer.checked) {
    drawer.checked = true;
  }

  const table = $('#main-table').DataTable();

  // 2️⃣ Reset highlight
  table.rows().nodes().to$().removeClass("highlight-row");

  console.log("CERCO:", parcelleId);

  // 3️⃣ Trova righe via DataTables
  const rows = table.rows().nodes().to$().filter(function () {
    const id = $(this).attr("data-id");
    return id && id == parcelleId;
  });

  console.log("ROWS TROVATE:", rows.length);

  if (rows.length > 0) {
    // 4️⃣ Highlight
    rows.addClass("highlight-row");

    // 5️⃣ Vai alla pagina giusta
    const rowIndex = table.row(rows[0]).index();

    table.page(Math.floor(rowIndex / table.page.len())).draw(false);

    // 6️⃣ Scroll corretto (DataTables scroll container)
    setTimeout(() => {
      const container = $('.dataTables_scrollBody');

      if (container.length) {
        container.animate({
          scrollTop: rows.first().position().top + container.scrollTop() - 100
        }, 300);
      } else {
        rows[0].scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
      }
    }, 150);
  }
}
  // -------------------
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

document.querySelectorAll(".parcelle-item").forEach(el => {
  const id = el.dataset.id;

  el.addEventListener("mouseenter", () => {
    //const row = 
    document.querySelectorAll(`[data-id="${id}"]`)
  .forEach(r => r.classList.add("highlight-row"));
  });

  el.addEventListener("mouseleave", () => {
   document
  .querySelectorAll(`[data-id="${id}"]`)
  .forEach(r => r.classList.remove("highlight-row"));
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

if (drawerToggle && !drawerToggle.checked) {
  drawerToggle.checked = true;

  setTimeout(() => {
    map.invalidateSize();
  }, 300);
}

  // 7️⃣ DataTables

    // 1. INIZIALIZZA DATATABLES - SPOSTATO IN FONDO
    const table = $('#main-table').DataTable({
        pageLength: 20,
        
         rowCallback: function(row, data) {
        $(row).attr('data-id', data._id);
    },
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