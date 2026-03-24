// public/js/dataAuthorGeo.js
import { loadCategories } from "./mapCommon.js";
import { initializeMap, map } from "./mapCore.js";
import { updateMap, updateTable, setUpdateMapDeps, markersMap } from "./pointUtils.js";
const points = window.points || [];
const currentUserId = window.currentUserId;


// 👇 AGGIUNGI QUI
window.isSelectingPoint = false;
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

function getPointIdFromURL() {
  const path = window.location.pathname;
  const match = path.match(/\/point\/([a-zA-Z0-9]+)/);
  if(match){
    return match[1];
  }
  return null;
}


function prepareShare(point){
  const card = document.getElementById("point-card");
 document.getElementById("share-title").innerText = point.name || "Signalement";
  document.getElementById("share-description").innerText = point.description || "";
 if(point.createdAt){
  document.getElementById("share-date").innerText =
   "📅 " + new Date(point.createdAt).toLocaleDateString();
}

 const img = document.getElementById("share-image");
  if (point.image) {
    img.src = point.image;
  } else {
    img.src = ""; // fallback se non c'è immagine
  }

  return card;
}

function sharePoint(point){

  const text = `📍 ${point.name}
  ${point.description || ""}
  via terria`;
  //const url = `https://localhost:3000/point/${point._id}`;
  const url = `${window.location.origin}/point/${point._id}`;

  // 📱 Se il browser supporta la condivisione
  if (navigator.share) {

    navigator.share({
      title: point.name || "Signalement",
      text: text,
      url: url
    }).catch(err => console.log("Share annulé", err));

  } 
  // 💻 fallback desktop → screenshot
  else {
        // copia il link del punto
      navigator.clipboard.writeText(url);
      console.log("Lien copié:", url);

    prepareShare(point);

    const card = document.querySelector("#point-card");

    html2canvas(card, {
      useCORS: true,
      backgroundColor: null
    }).then(canvas => {
           canvas.style.position = "fixed";
      canvas.style.top = "0";
      canvas.style.left = "0";
      canvas.style.zIndex = "9999";
      canvas.style.border = "3px solid red";
      console.log("canvas width:", canvas.width);
      console.log(card);
      document.body.appendChild(canvas);

      const link = document.createElement("a");
      link.download = "signalement-terria.png";
      link.href = canvas.toDataURL();
      link.click();
    });
  }
}

window.sharePoint = sharePoint;

function sharePointById(id){
  const point = window.points.find(p => p._id === id);
  if(!point) return;
  sharePoint(point);
}

window.sharePointById = sharePointById;

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

  const title = document.getElementById("overlay-title");
  if (title) title.innerText = "Nouveau Signalement";
}
window.openOverlay = openOverlay;

function openOverlayView(pointData) {
  const overlay = document.getElementById("map-overlay");
  overlay?.classList.remove("hidden");

  const form = document.getElementById("add-point");
  const hiddenPoint = document.getElementById("point");
  const hiddenPointId = document.getElementById("pointId");

  const nameInput = document.getElementById("form-name");
  const descInput = document.getElementById("form-description");
  const catInput  = document.getElementById("form-category");
  const submitBtn = form.querySelector("button[type='submit']");

  // 🟦 Modalità VIEW / EDIT
  // ✅ QUI METTI L'ID
  if (hiddenPointId) hiddenPointId.value = pointData._id;

if (hiddenPoint) hiddenPoint.value = JSON.stringify({
  type: "Feature",
  properties: {},
  geometry: {
    type: "Point",
    coordinates: [pointData.coordinates[0], pointData.coordinates[1]]
  }
});
  if (nameInput) nameInput.value = pointData.name || "";
  if (descInput) descInput.value = pointData.description || "";
  if (catInput)  catInput.value  = pointData.category || "";

  const title = document.getElementById("overlay-title");
  if (title) title.innerText = "Détail du signalement";

  // Cambia bottone
  if (submitBtn) submitBtn.innerText = "MODIFIER";

  // 🔥 Importantissimo
  form.dataset.mode = "edit";
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
function closeOverlay() {
  document.getElementById("map-overlay").classList.add("hidden");
}

window.closeOverlay = closeOverlay;


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
    let pointsLayer = res.pointsLayer;
    let parcellesLayer = res.parcellesLayer;        
    let layerGroup = res.layerGroup;
    let drawnItems = res.drawnItems;
   // let markersMap = {};
    let userUsedGeolocation = false;
  // ✅ QUI
        map.on("click", function (e) {
        openOverlay(e.latlng.lat, e.latlng.lng, false);
        });

        document.getElementById("open-add-point")
        ?.addEventListener("click", () => {
            openOverlay(null, null, true);
             window.isSelectingPoint = true; // 👈 ATTIVA modalità selezione
        });

    // -------------------
    // 3️⃣ Carica i punti dall’API
    const apiPoints = await loadPointsFromApi();
    points.length = 0;
    points.push(...apiPoints);

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
        markersMap,
        highlightTableRow,
        userUsedGeolocation
    });
    
    // -------------------
    // 5️⃣ Aggiorna mappa e tabella
    updateMap();
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
        const drawer = document.getElementById("my-drawer");
        if(drawer){
          drawer.checked = true;
        }          
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
    toggleGroupPoints.addEventListener("change", () => {
        console.log("🔄 toggle cambiato — showGroupPoints:", toggleGroupPoints.checked);
        updateMap();   // la funzione interna fa già il filtraggio
        updateTable(); // idem per la tabella
    });
}

function highlightTableRow(pointId) {
     // 👉 Apri automaticamente il drawer se è chiuso
    const drawerToggle = document.getElementById("my-drawer");
    if (drawerToggle && !drawerToggle.checked) {
        drawerToggle.checked = true;
        setTimeout(() => map.invalidateSize(), 300);
    }
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
  
    setTimeout(() => map.invalidateSize(), 100);
 // -------------------
    // DATATABLES
    // -------------------

// 🔧 Riaggiusta colonne quando apri/chiudi il drawer
document.getElementById('my-drawer')?.addEventListener('change', () => {
  setTimeout(() => table.columns.adjust().draw(), 300);
});
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
    const drawerToggle = document.getElementById("my-drawer");
    drawerToggle.addEventListener("change", function () {
        if (drawerToggle.checked) {
            document.body.classList.add("sidebar-open");
            setTimeout(() => map.invalidateSize(), 300);
        } else {
            document.body.classList.remove("sidebar-open");
            map.invalidateSize();
        }
    });
 
