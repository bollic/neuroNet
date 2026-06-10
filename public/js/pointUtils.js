// pointUtils.js

export let map = null;
export let points = [];
export let currentUserId = null;
export let pointsLayer = null;
export let layerGroup = null;
export let drawnItems = null;
export let markersMap = {};
export let userUsedGeolocation = false;
export let highlightTableRow = () => {};
export let showGroupPoints = false;

import { getIconEmoji } from "./mapCommon.js";
export function resetMarkersMap() {
  markersMap = {}; // reset pulito
}
export function getMarker(id) {
  return markersMap[id];
}
export function setUpdateMapDeps(deps) {
    map = deps.map || map;
    points = deps.points || points;
    currentUserId = deps.currentUserId || currentUserId;
    pointsLayer = deps.pointsLayer || pointsLayer;
    layerGroup = deps.layerGroup || layerGroup;
    drawnItems = deps.drawnItems || drawnItems;
    showGroupPoints = deps.showGroupPoints ?? showGroupPoints;
    userUsedGeolocation = deps.userUsedGeolocation ?? userUsedGeolocation;
    highlightTableRow = deps.highlightTableRow || highlightTableRow;
}


   // -------------------
    // FUNZIONE AGGIORNA MAPPA
    // -------------------
 // -------------------
// FUNZIONE AGGIORNA MAPPA
// -------------------
export function updateMap() {
    console.log("🔍 updateMap() chiamato — punti ricevuti: ", points);
    console.log("🔍 pointsLayer esiste?", !!pointsLayer, pointsLayer);
    console.log("🔥 updateMap chiamato");
    if (!map || !pointsLayer) return;
     // 👇 QUI
    const isField = window.APP_VIEW === "field";
    const isOpen = window.APP_VIEW === "open";

    // -------------------
    // 1️⃣ Pulisci layer esistenti
    // -------------------
    console.log("💣 CLEAR LAYERS");
    pointsLayer.clearLayers();
    drawnItems?.clearLayers();
    layerGroup?.clearLayers();
   resetMarkersMap();   // JS state pulito
     // console.log("Punto appena aggiunto:", points[points.length - 1])
    // -------------------
    // 2️⃣ Determina quali punti mostrare
    // -------------------

        const pointsToShow = points.filter(point => {
            if (!point.coordinates || point.coordinates.length !== 2) return false;

            const userId =
                typeof point.user === "object"
                    ? point.user?._id
                    : point.user;
        if (!userId)
                return false;

            if (
                isField &&
                !showGroupPoints &&
                String(userId) !== String(currentUserId)
            ) {
                return false;
            }
            return true;
        });

    console.log("🔄 Punti filtrati:", pointsToShow);
     
    // -------------------
    // 3️⃣ Crea i marker
    // -------------------
    const markers = pointsToShow.map(point => {
const userId =
  typeof point.user === "object"
    ? point.user?._id
    : point.user;

const userEmail =
  typeof point.user === "object"
    ? point.user?.email
    : null;

const isMyPoint = String(userId) === String(currentUserId);
        // 👇 QUI (ESATTAMENTE QUI)
const bgColor = isMyPoint ? "#3b82f6" : "#ffffff";
const borderColor = isMyPoint ? "#2563eb" : "#9ca3af";
const opacity = isMyPoint ? "1" : "0.85";  
        const iconEmoji = getIconEmoji(point);
      // const userLabel = isMyPoint ? 'Toi' : (point.user?.email || 'Inconnu');

        const marker = L.marker([point.coordinates[1], point.coordinates[0]], {
                    
                        
            icon: new L.divIcon({
            html: `<div style="
                width:30px;
                height:30px;
                display:flex;
                align-items:center;
                justify-content:center;
                border-radius:50%;
                background:${bgColor};
                border:2px solid ${borderColor};
                font-size:18px;
                opacity:${opacity};
            ">
                ${iconEmoji}
            </div>`,
            className: '',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
            }),
className: ''
 }).bindPopup(`
  <div style="min-width:120px;">
    <strong>📍 ${point.name || 'Senza nome'}</strong><br>

      ${!isOpen ? `
      👤 Declarant: <strong>${userEmail || 'Toi'}</strong><br>
    ` : ''}

    🏷️ Catégorie: ${point.category || 'Senza categoria'}<br>

    ${
      point.description
        ? `<div style="margin-top:6px; font-style:italic;">
            📝 ${point.description}
           </div>`
        : ''
    }

    ${
      point.image
        ? `<br><img src="${point.image}"
             style="width:40px;height:40px;border-radius:50%;object-fit:cover;">`
        : ''
    }

    ${
  isField ? `
     <button onclick="window.editPoint('${point._id}')">
      ✏️ Modifier
    </button>
    <button onclick="deletePointById('${point._id}')">
        🗑️ Supprimer
    </button>
    ` : ''
}
  </div>
`).addTo(pointsLayer);

//debug dopo 
marker.on('click', (e) => {
  console.log("MARKER CLICK:", point._id);
  e.originalEvent?.stopPropagation();
});
      //  marker.on('click', () => {
              //   console.log("🔥 CLICK MARKER:", point._id);
                //NON RICHIAMO PIU LA FUNZ TEMPORANEAMENTE; lA RIATTIVO QUANDO FARO' apparire lista con ricerca o filtri
                //highlightTableRow(point._id);
      //  });
        markersMap[point._id] = marker;
        return marker;
        
        });

    // -------------------
    // 4️⃣ Centra la mappa sui marker (se non geolocalizzato)
    // -------------------
    if (!userUsedGeolocation && markers.length) {
        if (markers.length === 1) {
            map.setView(markers[0].getLatLng(), 14);
        } else {
            map.fitBounds(L.latLngBounds(markers.map(m => m.getLatLng())), { padding: [30, 30] });
        }
    }
}


    // AGGIORNA LA TABELLA IN BASE AL TOGGLE
// -------------------

export function updateTable() {
    
    if (!points || !currentUserId) return;
    const dt = $('#main-table').DataTable();
    dt.clear();
const showGroupPoints = !!document.getElementById("toggleGroupPoints")?.checked;
    points.forEach(point => {
    
const userId = typeof point.user === "object"
    ? point.user._id
    : point.user;

if (!userId) return;

     const isMine = String(userId).trim() === String(currentUserId).trim();         // 👇 Se switch OFF → mostra solo i miei punti
            if (!showGroupPoints && !isMine) return;
  
    const name = point.name || 'Senza nome';


    const actionCell = isMine
    ? `<a href="/delete/${point._id}" class="btn btn-xs btn-error">
        <i class="fas fa-trash"></i>
        </a>`
    : `<span class="text-gray-400 text-xs italic">—</span>`;

   const rowContent = `
<div class="flex items-center gap-2">
  <span>${getIconEmoji(point)}</span>
  <span>${name}</span>
</div>
`;

const newRow = dt.row.add([
  rowContent
]).node();

    $(newRow).attr('data-point-id', point._id);  // 👈 aggiungi l'ID qui
    $(newRow).off('click');
});
    dt.draw();
    // 👇 aggiungi dopo dt.draw();
$('#main-table tbody tr').each(function() {
    const pointId = $(this).data('point-id');
    if (pointId) {
        $(this).off('click').on('click', function() {

             // 👉 Evidenzia la riga nella tabella
            highlightTableRow(pointId);
            
           const marker = getMarker(pointId);
            if (marker) {
                marker.openPopup();
                // opzionale: anima marker
                marker._icon.classList.add('marker-highlight');
                setTimeout(() => marker._icon.classList.remove('marker-highlight'), 1000);
            }
        });
    }
});

}
 