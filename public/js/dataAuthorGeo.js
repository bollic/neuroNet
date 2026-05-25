// public/js/dataAuthorGeo.js
import { loadCategories } from "./mapCommon.js";
import { initializeMap, map } from "./mapCore.js";
import { updateMap, resetMarkersMap, setUpdateMapDeps } from "./pointUtils.js";
import { getMarker } from "./pointUtils.js";
const points = window.points || [];
const currentUserId = window.currentUserId;

let currentEditPoint = null;

window.editPoint = function (id) {
  const point = window.points.find(p => p._id === id);
  if (!point) return;

  currentEditPoint = point;

  document.getElementById("edit-name").value = point.name || "";
  document.getElementById("edit-description").value = point.description || "";

  document.getElementById("edit-modal").checked = true;
};

let overlayLock = false;
// 👇 AGGIUNGI QUI
window.isSelectingPoint = false;
window.deletePointById = async function (id) {
  if (!confirm("Supprimer ce point ?")) return;

  try {
    const res = await fetch(`/points/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      console.log("❌ delete failed");
      return;
    }
    
    // 🔥 rimuovi dal frontend
    const index = window.points.findIndex(p => p._id === id);
    if (index !== -1) {
      window.points.splice(index, 1);
    }

    // refresh mappa
    updateMap();

    console.log("✅ point supprimé");

  } catch (err) {
    console.error("❌ erreur delete:", err);
  }
};
// ✅ QUI
window.saveEdit = async function () {
  if (!currentEditPoint) return;

  const updatedData = {
    name: document.getElementById("edit-name").value,
    description: document.getElementById("edit-description").value,
    category: currentEditPoint.category,

      point: JSON.stringify({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: currentEditPoint.coordinates
      }
     })


  };

  const res = await fetch(`/points/${currentEditPoint._id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(updatedData)
  });

const data = await res.json();
if (!data.success) {
  console.log("❌ update failed:", data.message);
  return;
}

const updatedPoint = data.point;

  // aggiorna array locale
  const index = points.findIndex(p => p._id === updatedPoint._id);
  if (index !== -1) {
    points[index] = updatedPoint;
  }

  // chiudi modal
  document.getElementById("edit-modal").checked = false;
// pulizia globale DaisyUI
document.body.classList.remove("modal-open");
document.querySelectorAll(".modal").forEach(m => {
  m.classList.remove("modal-open");
});


// 🔥 QUESTO È QUELLO CHE TI MANCAVA
// overlay vecchio sistema
document.getElementById("map-overlay")?.classList.add("hidden");

// panel nuovo sistema
const panel = document.getElementById("form-panel");
if (panel) {
  panel.classList.add("hidden");
  panel.classList.remove("active");
}

// sicurezza scroll / blocchi
document.body.style.overflow = "auto";
document.body.style.pointerEvents = "auto";

  resetMarkersMap();
  // refresh UI
  updateMap();
};


/*
function openOverlay(lat = null, lng = null, resetPoint = false) {
  const overlay = document.getElementById("map-overlay");
  if (overlay) overlay.classList.remove("hidden");

  // resetta il campo point SOLO se richiesto
  if (resetPoint) {
    const pointInput = document.getElementById("point");
    if (pointInput) pointInput.value = "";
  }

  const latInput = document.getElementById("form-lat");
  const lngInput = document.getElementById("form-lat");

  if (lat && lng) {
    if (latInput) latInput.value = lat;
    if (lngInput) lngInput.value = lng;
  }

  const title = document.getElementById("overlay-title");
  if (title) title.innerText = "Nuovo Signalement";
}
*/

// 👇 FORZA globale (sicuro al 100%)
window.closeForm = function () {
  const panel = document.getElementById("form-panel");
  if (!panel) return;

  panel.classList.add("hidden");
  panel.classList.remove("active");

  console.log("CLOSE CLICK OK");
};
function getPointIdFromURL() {
  const path = window.location.pathname;
  const match = path.match(/\/point\/([a-zA-Z0-9]+)/);
  if(match){
    return match[1];
  }
  return null;
}


function openOverlay(lat = null, lng = null, resetPoint = false) {
 
  console.log("OPEN OVERLAY lat/lng:", lat, lng);

  const overlay = document.getElementById("map-overlay");
  if (overlay) overlay.classList.remove("hidden");

  const form = document.getElementById("add-point");
  const submitBtn = form.querySelector("button[type='submit']");
  const hiddenPoint = document.getElementById("point");

  // 🟢 Modalità CREATE
  form.dataset.mode = "create";
  if (submitBtn) submitBtn.innerText = "AJOUTER";
  if (hiddenPoint) hiddenPoint.value = "";
    // ✅ SE abbiamo coordinate, crea il GeoJSON
  if (lat !== null && lng !== null && hiddenPoint) {
    hiddenPoint.value = JSON.stringify({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: [lng, lat]
      }
    });
  }

    const nameInput = document.getElementById("form-name");
    // 👇 SOLO se clic su mappa (lat/lng) + campo vuoto
    if (lat !== null && lng !== null && nameInput && !nameInput.value) {
      //nameInput.placeholder = "Signalement rapide";
      nameInput.value = "Signalement rapide";
      nameInput.focus();
// ❌ niente select()
    }
  const title = document.getElementById("overlay-title");
  if (title) title.innerText = "Nouveau Signalement";

        // 👇 AUTO-FOCUS sul campo nome
    setTimeout(() => {
        const nameInput = document.getElementById("form-name");

        if (nameInput) {
          nameInput.focus();
         // nameInput.select();

          // 🔥 QUESTA È LA DIFFERENZA VERA
          nameInput.onkeydown = null;
          nameInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
              e.preventDefault();
              document.getElementById("add-point").requestSubmit();
            }
          }, { once: true });
        }
      }, 100);

}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("open-add-point");

  if (!btn) {
    console.log("❌ bottone add non trovato");
    return;
  }

  btn.addEventListener("click", () => {
    console.log("🟢 CLICK ADD POINT");

    window.isSelectingPoint = true;
    document.body.style.cursor = "crosshair";

    const panel = document.getElementById("form-panel");
    if (panel) {
      panel.classList.remove("hidden");
    }
  });

    // 👇 AGGIUNGI QUI
  const closeBtn = document.getElementById("close-form-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      window.closeForm();
    });
  }

});
//window.openOverlay = openOverlay;
function openOverlayView(pointData) {
  console.log("🟢 OPEN EDIT VIEW");

  // 👉 NUOVO CONTAINER (NON overlay)
  const panel = document.getElementById("form-panel");
  if (!panel) return;

  panel.classList.remove("hidden");
  panel.classList.add("active");

  const form = document.getElementById("add-point");
  const hiddenPoint = document.getElementById("point");
  const hiddenPointId = document.getElementById("pointId");

  const nameInput = document.getElementById("form-name");
  const descInput = document.getElementById("form-description");
  const catInput  = document.getElementById("form-category");
  const submitBtn = form?.querySelector("button[type='submit']");

  // 🟦 MODE EDIT
  form.dataset.mode = "edit";

  if (hiddenPointId) hiddenPointId.value = pointData._id;

  if (hiddenPoint) {
    hiddenPoint.value = JSON.stringify({
      type: "Feature",
      properties: {},
      geometry: {
        type: "Point",
        coordinates: [
          pointData.coordinates[0],
          pointData.coordinates[1]
        ]
      }
    });
  }

  if (nameInput) nameInput.value = pointData.name || "";
  if (descInput) descInput.value = pointData.description || "";
  if (catInput)  catInput.value  = pointData.category || "";

  // titolo (se lo hai nel panel)
  const title = document.getElementById("overlay-title");
  if (title) title.innerText = "MODIFIER Signalement";

  if (submitBtn) submitBtn.innerText = "MODIFIER";
}

window.openOverlayView = openOverlayView;
/*function openOverlay(lat = null, lng = null) {
  const overlay = document.getElementById("map-overlay");
  if (overlay) overlay.classList.remove("hidden");

  const latInput = document.getElementById("form-lat");
  const lngInput = document.getElementById("form-lng");
  if (lat && lng) {
    if (latInput) latInput.value = lat;
    if (lngInput) lngInput.value = lng;
  }


  const title = document.getElementById("overlay-title");
  if (title) title.innerText = "Nuovo Signalement";
}
window.openOverlay = openOverlay;

*/



async function loadPointsFromApi() {
  const res = await fetch('/api/points');
  const data = await res.json();

  console.log("📡 Points caricati dalla API:", data.length, data);
  return data;
}

// 🔥 LOG DI TEST
console.log("🔥 FILE CARICATO");

let table;
document.addEventListener("DOMContentLoaded", async function() { 
      console.log("🤖 DOM CONTENT LOADED callback ESEGUITA");
  table = $('#main-table').DataTable({
  pageLength: 20,
  scrollX: true,
  autoWidth: false,
  responsive: false,
  columnDefs: [
    { targets: 0, width: "30px" },
    { targets: 1, width: "40px" },
    { targets: 2, width: "40px", className: "text-center", orderable: false },
    { targets: 3, width: "40px", className: "text-center", orderable: false },
        { targets: 4, width: "40px", className: "text-center", orderable: false }
  ],
  language: {
    url: 'https://cdn.datatables.net/plug-ins/1.11.5/i18n/fr-FR.json'
  }
});

    // ⬇️⬇️⬇️ SOLO QUI ⬇️⬇️⬇️
  $('#main-table tbody').on('submit', '.delete-point-form', function (e) {
    const btn = this.querySelector('button');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳';
    }
  });

    // 1️⃣ Carica le categorie
    await loadCategories();

    // -------------------
    // 2️⃣ Inizializza la mappa
    const res = initializeMap();
    let map = res.map;

  map.on('click', () => {
  console.log("MAP CLICK OK");
});
    setTimeout(() => {
      map.invalidateSize();
    }, 300);

    let pointsLayer = res.pointsLayer;
    let parcellesLayer = res.parcellesLayer;        
    let layerGroup = res.layerGroup;
    let drawnItems = res.drawnItems;
    let userUsedGeolocation = false;


  // ✅ QUI
   /*     map.on("click", function (e) {
       // openOverlay(e.latlng.lat, e.latlng.lng, true);

        // 👇 attiva modalità ultra-rapida
          window.isSelectingPoint = true;
        });
        */
        document.getElementById("open-add-point")
        ?.addEventListener("click", () => {

            const planLimit = window.PLAN_LIMIT;

           const myPointsCount = points.filter(p => {
                const userId = typeof p.user === "object" ? p.user._id : p.user;
                return String(userId) === String(currentUserId);
              }).length;
           
               // 🚫 BLOCCO REALE
            if (myPointsCount  >= planLimit) {
                alert("Limite de points atteint pour le plan free");
                return; // 👈 QUESTO È IL FIX
            }

            window.isSelectingPoint = true;

            console.log("🟡 Modalità selezione attiva");

            // opzionale UX
            document.body.style.cursor = "crosshair";
        
        // 👇 NUOVO (al posto di alert)
        const hint = document.getElementById("map-hint");
        if (hint) {
          hint.classList.remove("hidden");

          setTimeout(() => {
            hint.classList.add("hidden");
          }, 1500);
        }
         //  alert("📍 Clique sur la carte pour ajouter un point");
   });

    // -------------------
    // 3️⃣ Carica i punti dall’API
 //   const apiPoints = await loadPointsFromApi();
    // points.length = 0;
  //  points.push(...apiPoints);

    console.log("🧪 points dopo API:", points);
    

    // -------------------
    // 4️⃣ Passa le dipendenze a pointUtils
    setUpdateMapDeps({
        map,
        points,
        currentUserId,
        pointsLayer,
        parcellesLayer,
        layerGroup,
        drawnItems,     
        userUsedGeolocation,
        showGroupPoints: false
    });
    
    // -------------------
    // 5️⃣ Aggiorna mappa e tabella
    updateMap();
   // updateTable();


const sharedPointId = getPointIdFromURL();
if(sharedPointId){
  const sharedPoint = points.find(p => p._id === sharedPointId);
  if(sharedPoint){
    console.log("📍 Point partagé détecté:", sharedPoint);
    map.setView(
      [sharedPoint.coordinates[1], sharedPoint.coordinates[0]],
      17
    );

    setTimeout(() => {
      const marker = markersMap[sharedPoint._id];
      if(marker){
        marker.openPopup();
            // 🔵 apri il drawer della tabella
        
            
      }

    }, 300);
  }
}


    
    // 🔄 Aggiorna le categorie all’avvio
    // 🔧 Funzione per ottenere l'icona associata a una categoria
    // Controlla se siamo arrivati da onboarding
    const params = new URLSearchParams(window.location.search);
  
    // -------------------
    // FUNZIONE INIZIALIZZA MAPPA
 // <-- chiude if(locationButton)
// Aggiorna mappa + tabella quando cambio lo switch
const toggleGroupPoints = document.getElementById("toggleGroupPoints");

if (toggleGroupPoints) {
       // stato iniziale
    setUpdateMapDeps({
        showGroupPoints: toggleGroupPoints.checked
    });

    toggleGroupPoints.addEventListener("change", () => {
        console.log("🔄 toggle cambiato — showGroupPoints:", toggleGroupPoints.checked);
        setUpdateMapDeps({
            showGroupPoints: toggleGroupPoints.checked
        });
       
        updateMap();   // la funzione interna fa già il filtraggio
      //  updateTable(); // idem per la tabella
    });
}

function isMobile() {
  return window.innerWidth < 768;
}
function highlightTableRow(pointId) {
     // 👉 Apri automaticamente il drawer se è chiuso


   /* if (drawerToggle && !drawerToggle.checked) {
        drawerToggle.checked = true;
        setTimeout(() => map.invalidateSize(), 300);
    }*/
    // Rimuove evidenziazione da tutte le righe
    $('#main-table tbody tr').removeClass('highlight-row');
    // Trova la riga corrispondente
    const row = $(`#main-table tbody tr[data-point-id='${pointId}']`);
    // Se esiste, evidenziale e scrolla fino a lei
    if (row.length > 0) {
        row.addClass('highlight-row');
        // Scroll automatico dentro la tabella
        const container = $('.dataTables_scrollBody');
        if (container.length) {
            container.animate({
                scrollTop: row.position().top + container.scrollTop() - 100
            }, 300);
        }
    }
}

    // -------------------
    // FUNZIONE AGGIORNA MAPPA
    // -------------------
    // -------------------
// AGGIORNA LA TABELLA IN BASE AL TOGGLE
// -------------------
  
      document.addEventListener('click', (e) => {
  console.log("⛈️ CLICK SU:", e.target);
});
 // -------------------
    // DATATABLES
    // -------------------

// 🔧 Riaggiusta colonne quando apri/chiudi il drawer

    $('#page-length').on('change', function() {
        table.page.len($(this).val()).draw();
    });
    table.on('length.dt', function(e, settings, len) {
        $('#page-length').val(len);
    });
    console.log("DataTables inizializzato:", table);
    console.log("Elementi nella tabella:", table.rows().count());

});

    // -------------------
    // DAISYUI DRAWER RESIZE
    // -------------------
  
 
