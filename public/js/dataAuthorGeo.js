// public/js/dataAuthorGeo.js
import { loadCategories } from "./mapCommon.js";
import { initializeMap, map } from "./mapCore.js";
import { loadBaseLayers } from "./mapLayers.js";
import { updateMap, updateTable, resetMarkersMap, setUpdateMapDeps } from "./pointUtils.js";
import { initMobileServiceTracking } from "./mobileService.js";
import { initObservation } from "./observation.js";
import { initPointForm } from "./pointForm.js";
import { getMarker } from "./pointUtils.js";
const points = window.points || [];
const currentUserId = window.currentUserId;

function getPointUserId(point) {
  if (!point.user) return null;

  return typeof point.user === "object"
    ? point.user._id
    : point.user;
}



setUpdateMapDeps({
  map: window.map,
  points: window.points,
  currentUserId: window.currentUserId,
  pointsLayer: window.pointsLayer,
  layerGroup: window.layerGroup,
  drawnItems: window.drawnItems,
  showGroupPoints: document.getElementById("toggleGroupPoints")?.checked
});


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
    updateTable();
    console.log("✅ point supprimé");

  } catch (err) {
    console.error("❌ erreur delete:", err);
  }
};
// ✅ QUI
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

                    const userId = p.user?._id ?? p.user;

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
// 🟦 BLOCCO 1 — Avvio: categorie → mappa → dati

document.addEventListener("DOMContentLoaded", async function() { 
      console.log("🤖 DOM CONTENT LOADED callback ESEGUITA");
const tableOptions = {
  paging: false,
  scrollX: false,
  autoWidth: false,
  responsive: false,
  columnDefs: [{ targets: 0, orderable: false }],
  language: {
    url: 'https://cdn.datatables.net/plug-ins/1.11.5/i18n/fr-FR.json'
  }
};

$('#main-table-mobile').DataTable(tableOptions);
$('#main-table-desktop').DataTable(tableOptions);
    // ⬇️⬇️⬇️ SOLO QUI ⬇️⬇️⬇️
$('#main-table-mobile tbody, #main-table-desktop tbody')
  .on('submit', '.delete-point-form', function (e) {
    const btn = this.querySelector('button');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳';
    }
  });



// -------------------
// 1️⃣ Carica le categorie
// -------------------
    await loadCategories();

 // -------------------
  // 2️⃣ Inizializza la mappa
  // -------------------
    const res = initializeMap();
    const map = res.map;

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
      updateTable(); 

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

      const pointsLayer = res.pointsLayer;
      const parcellesLayer = res.parcellesLayer;
      const layerGroup = res.layerGroup;
      const drawnItems = res.drawnItems;
      let userUsedGeolocation = false;

  // -------------------
// 3️⃣ Couches cartographiques
// -------------------
     
    // -------------------
 
  // -------------------
// 4️⃣ Contrôle des couches
// -------------------

console.log("🧪 points dopo API:", points);


  // 🟩 BLOCCO 2 — Passaggio delle dipendenze → aggiornamento della mappa-------------------
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
        showGroupPoints: false,
        highlightTableRow
    });
    

    initPointForm(points, {
        resetMarkersMap,
        updateMap,
        updateTable
      });
   // initPointForm(points);
    
    // -------------------
    // 5️⃣ Aggiorna mappa e tabella
    updateMap();
        console.log("🧪 CHIAMO updateTable");
        updateTable();
        // -------------------
// Adatta il form al tipo di gruppo
// -------------------
// const observationFields
if (window.GROUP_TYPE === "observation") {
    initObservation();
}


console.log("GROUP TYPE:", window.GROUP_TYPE);

if (window.GROUP_TYPE === "mobile-service") {

    initMobileServiceTracking(
        map,
        points,
        currentUserId,
        getPointUserId
    );

} else {

    console.log(
        "🚫 Tracking camion disattivato per questo gruppo"
    );

}

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

    console.log("🟢 highlightTableRow CHIAMATA:", pointId);

     // 👉 Apri automaticamente il drawer se è chiuso


   /* if (drawerToggle && !drawerToggle.checked) {
        drawerToggle.checked = true;
        setTimeout(() => map.invalidateSize(), 300);
    }*/
    // Rimuove evidenziazione da tutte le righe
  $('#main-table-mobile tbody tr, #main-table-desktop tbody tr')
    .removeClass('highlight-row');

const row = $(
    `#main-table-mobile tbody tr[data-point-id='${pointId}'],
     #main-table-desktop tbody tr[data-point-id='${pointId}']`
); 

console.log("ROW TROVATA:", row.length, row);
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
    const len = $(this).val();

    $('#main-table-mobile').DataTable().page.len(len).draw();
    $('#main-table-desktop').DataTable().page.len(len).draw();
});

$('#main-table-mobile').on('length.dt', function(e, settings, len) {
    $('#page-length').val(len);
});

$('#main-table-desktop').on('length.dt', function(e, settings, len) {
    $('#page-length').val(len);
});

console.log("DataTables inizializzato:", {
    mobile: $('#main-table-mobile').DataTable(),
    desktop: $('#main-table-desktop').DataTable()
});

console.log("Elementi tabella mobile:",
    $('#main-table-mobile').DataTable().rows().count()
);

console.log("Elementi tabella desktop:",
    $('#main-table-desktop').DataTable().rows().count()
);




});

    // -------------------
    // DAISYUI DRAWER RESIZE
    // -------------------
  
 
