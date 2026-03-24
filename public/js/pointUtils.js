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

import { getIconEmoji } from "./mapCommon.js";


export function setUpdateMapDeps(deps) {
    map = deps.map || map;
    points = deps.points || points;
    currentUserId = deps.currentUserId || currentUserId;
    pointsLayer = deps.pointsLayer || pointsLayer;
    layerGroup = deps.layerGroup || layerGroup;
    drawnItems = deps.drawnItems || drawnItems;
    markersMap = deps.markersMap || markersMap;
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

    if (!map || !pointsLayer) return;

    // -------------------
    // 1️⃣ Pulisci layer esistenti
    // -------------------
    pointsLayer.clearLayers();
    drawnItems?.clearLayers();
    layerGroup?.clearLayers();
    console.log("Punto appena aggiunto:", points[points.length - 1])
    // -------------------
    // 2️⃣ Determina quali punti mostrare
    // -------------------
    const showGroupPoints = document.getElementById("toggleGroupPoints")?.checked ?? true;
const pointsToShow = points.filter(point => {
    if (!point.coordinates || point.coordinates.length !== 2) return false;

    const userId =
        typeof point.user === "object"
            ? point.user?._id
            : point.user;

    if (!userId) return false;

    if (!showGroupPoints && String(userId) !== String(currentUserId))
        return false;

    return true;
});

    console.log("🔄 Punti filtrati:", pointsToShow);

    // -------------------
    // 3️⃣ Crea i marker
    // -------------------
    const markers = pointsToShow.map(point => {
        const isMyPoint = String(point.user._id) === String(currentUserId);
        const iconEmoji = getIconEmoji(point);
       const userLabel = isMyPoint ? 'Toi' : (point.user?.email || 'Inconnu');

        const marker = L.marker([point.coordinates[1], point.coordinates[0]], {
            icon: new L.divIcon({
                html: `<div style="font-size:26px; width:30px; height:30px; display:flex; align-items:center; justify-content:center;">${iconEmoji}</div>`,
                className: '',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            }),
            className: ''
        }).bindPopup(`
            <div style="min-width:120px;">
       <strong>📍 ${point.name || 'Senza nome'}</strong><br>

        👤 Declarant: 
        <strong>
            ${userLabel 
                ? 'Toi'
                : (point.user?.email || 'Inconnu')}
        </strong>
        <br>
        
        🏷️ Categorie: ${point.category || 'Senza categoria'}<br>
                Description: ${point.description
                    ? `<div style="margin-top:6px; font-style:italic;">
                        📝 ${point.description}
                        </div>`
                    : ''
                    }

                ${point.image ? `<br><img src="${point.image}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">` : ''}
           <button onclick="sharePointById('${point._id}')">
            📤 Partager
            </button>
                </div>
        `).addTo(pointsLayer);

       marker.on('click', () => {
            highlightTableRow(point._id);
            window.openOverlayView(point);
        });
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
     const showGroupPoints = document.getElementById("toggleGroupPoints")?.checked ?? true;
    points.forEach(point => {
        if (!point.user || !point.user._id) return;
        const isMine = String(point.user._id).trim() === String(currentUserId).trim();
         // 👇 Se switch OFF → mostra solo i miei punti
            if (!showGroupPoints && !isMine) return;
    const category = point.category || 'Senza categoria';
    const name = point.name || 'Senza nome';
    
    const viewCell = `
    <a href="/points/${point._id}/show"
        class="btn btn-xs btn-outline btn-primary">
        👁️
    </a>
    `;
    const editCell = `
    <a href="/points/${point._id}"
        class="btn btn-xs btn-outline btn-primary">
        ✏️
    </a>
    `;

    const actionCell = isMine
    ? `<a href="/delete/${point._id}" class="btn btn-xs btn-error">
        <i class="fas fa-trash"></i>
        </a>`
    : `<span class="text-gray-400 text-xs italic">—</span>`;

    const newRow = dt.row.add([
    category,   // colonna 0
    name,       // colonna 1
    viewCell, // colonna 2
    editCell,   // colonna 3 (Modifier)
    actionCell  // colonna 4 (Action)
    ]).node();

    $(newRow).attr('data-point-id', point._id);  // 👈 aggiungi l'ID qui
    });
    dt.draw();
    // 👇 aggiungi dopo dt.draw();
$('#main-table tbody tr').each(function() {
    const pointId = $(this).data('point-id');
    if (pointId) {
        $(this).off('click').on('click', function() {

             // 👉 Evidenzia la riga nella tabella
            highlightTableRow(pointId);
            
            const marker = markersMap[pointId];
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