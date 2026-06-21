// public/js/dataAuthorGeo.js
import { loadCategories } from "./mapCommon.js";
import { initializeMap, map } from "./mapCore.js";
import { updateMap, updateTable, resetMarkersMap, setUpdateMapDeps } from "./pointUtils.js";
import { getMarker } from "./pointUtils.js";
const points = window.points || [];
const currentUserId = window.currentUserId;

let currentEditPoint = null;

setUpdateMapDeps({
  map: window.map,
  points: window.points,
  currentUserId: window.currentUserId,
  pointsLayer: window.pointsLayer,
  layerGroup: window.layerGroup,
  drawnItems: window.drawnItems,
  showGroupPoints: document.getElementById("toggleGroupPoints")?.checked
});
window.editPoint = function (id) {
  const point = window.points.find(p => p._id === id);
  if (!point) return;

  currentEditPoint = point;

  document.getElementById("edit-name").value = point.name || "";
    document.getElementById("edit-category").value = point.category || "";
  document.getElementById("edit-description").value = point.description || "";

  document.getElementById("edit-modal").checked = true;
};


window.mapState = {
  isSelectingPoint: false,
  plan: window.planUX || null
};

window.mapState.quickAddMode = false;

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
    category: document.getElementById("edit-category").value,

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



// 👇 FORZA globale (sicuro al 100%)
window.closeForm = function () {
  const panel = document.getElementById("form-panel");
  if (!panel) return;
  document.getElementById("open-add-point")
    ?.classList.remove("hidden");

  document.getElementById("quick-add-point")
    ?.classList.remove("hidden");

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


document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("open-add-point");

  if (!btn) {
    console.log("❌ bottone add non trovato");
    return;
  }

  btn.addEventListener("click", () => {
   
    console.log("🟢 CLICK ADD POINT");
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

                   // 👇 NUOVO (al posto di alert)
      const hint = document.querySelector("#map-hint");
        if (hint) {
          hint.textContent = "Cliquez sur la carte pour placer le point";
          hint.classList.remove("hidden");

      
        }
  window.mapState.isSelectingPoint = true;
          console.log(
          "STATE =",
          window.mapState.isSelectingPoint
        );
    document.body.style.cursor = "crosshair";

    const panel = document.getElementById("form-panel");
    if (panel) {
      panel.classList.remove("hidden");
    }

    document.getElementById("open-add-point")
  ?.classList.add("hidden");

document.getElementById("quick-add-point")
  ?.classList.add("hidden");

  });
  
    // 👇 AGGIUNGI QUI
  const closeBtn = document.getElementById("close-form-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      window.closeForm();
    });
  }

});

const quickBtn = document.getElementById("quick-add-point");

if (quickBtn) {
  quickBtn.addEventListener("click", () => {

    window.mapState.quickAddMode = true;

    const hint = document.getElementById("map-hint");
    if (hint) {
      hint.textContent =
        "Cliquez sur la carte pour ajouter un point rapide";
      hint.classList.remove("hidden");
    }

    console.log("⚡ QUICK MODE ON");
  });
}



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
    paging: false,
  //pageLength: 20,


  scrollX: false,
  autoWidth: false,
  responsive: false,
  columnDefs: [
   {
    targets: 0,
    orderable: false
  }
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

  map.on('click', async (e) => {
    const hint = document.getElementById("map-hint");
if (hint) hint.classList.add("hidden");
      if (window.mapState.quickAddMode) {
        const marker = L.marker([
          e.latlng.lat,
          e.latlng.lng
        ]);

      marker.addTo(map);
        marker.setOpacity(0.5);
      marker.bindTooltip("⚡", {
        permanent: false
      }).openTooltip();

 //   console.log("Categorie disponibili:", window.CATEGORIES);
const defaultCategory = window.CATEGORIES?.[0]?.name;

const formData = new FormData();

formData.append("name", "📍 Point rapide");
formData.append("category", defaultCategory);
formData.append("description", "");

formData.append(
  "point",
  JSON.stringify(marker.toGeoJSON())
);

    try {

  const response = await fetch("/addPoint", {
    method: "POST",
    body: formData,
    credentials: "include"
  });

  const result = await response.json();

  console.log("🚀 QUICK RESULT", result);

  if (result.success) {

  if (typeof result.point.user === "string") {
    result.point.user = { _id: result.point.user };
  }

  points.push(result.point);

  marker.bindTooltip("✅", {
       permanent: false
  }).openTooltip();

  updateMap();

setTimeout(() => {
  marker.remove();
}, 1000);
}


} catch (err) {

  console.error("❌ QUICK ERROR", err);

}
    // QUI ARRIVERÀ IL FETCH

    window.mapState.quickAddMode = false;

    return;
  }
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
    /*      document.getElementById("open-add-point")
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
            window.mapState.isSelectingPoint = true;

            console.log("🟡 Modalità selezione attiva");

            // opzionale UX
            document.body.style.cursor = "crosshair";
        
        // 👇 NUOVO (al posto di alert)

         //  alert("📍 Clique sur la carte pour ajouter un point");
   });*/

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
  console.log("🧪 CHIAMO updateTable");
updateTable();


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
      console.log("🧪 CHIAMO updateTable per toggleGroupPoints");
updateTable();
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
  
 
