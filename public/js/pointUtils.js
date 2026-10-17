// public/js/pointUtils.js

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

    console.log("Popup aperta:", map._popup);

    pointsLayer.clearLayers();

    console.log("Popup dopo clear:", map._popup);

    console.log("Layers dopo clear:", pointsLayer.getLayers().length);

    drawnItems?.clearLayers();
    layerGroup?.clearLayers();
   resetMarkersMap();   // JS state pulito
     // console.log("Punto appena aggiunto:", points[points.length - 1])


    // -------------------
    // 2️⃣ Determina quali punti mostrare
    // -------------------
    // CONDIZIONE AVVOLGIMENTO
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

            // Comfort del punto (esempio)

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
       
       
 const isMobileService = window.GROUP_TYPE === "mobile-service";

const collectionStatusHtml = isMobileService ? `
    <div style="margin-top:8px;">
        <strong>Statut :</strong>
          ${
            point.serviceType === "livrer"
                ? (
                    point.status === "livre"
                        ? `<span style="color:#16a34a;font-weight:600;">✓ Livré</span>`
                        : `<span style="color:#2563eb;font-weight:600;">🔵 À livrer</span>`
                  )
                : (
                    point.status === "collecte"
                        ? `<span style="color:#16a34a;font-weight:600;">✓ Collecté</span>`
                        : `<span style="color:#d97706;font-weight:600;">🟠 À collecter</span>`
                  )
        }
    </div>
` : '';
                // 👇 QUI (ESATTAMENTE QUI)
        const bgColor = isMyPoint ? "#3b82f6" : "#ffffff";
        const borderColor = isMyPoint ? "#2563eb" : "#9ca3af";
        const opacity = isMyPoint ? "1" : "0.85";  
        const iconEmoji = getIconEmoji(point);

                // 🧩 Champs dynamiques Observation
                let observationFieldsHtml = '';

                if (
                    window.GROUP_TYPE === "observation" &&
                    point.attributes &&
                    typeof point.attributes === "object"
                ) {
                    observationFieldsHtml = Object.entries(point.attributes)
                        .filter(([key, value]) =>
                            value !== undefined &&
                            value !== null &&
                            value !== ''
                        )
                        .map(([key, value]) => {
                            const displayValue =
                                typeof value === "boolean"
                                    ? (value ? "Oui" : "Non")
                                    : value;

                            return `
                                <div style="margin-top:5px;">
                                    <strong>${key} :</strong> ${displayValue}
                                </div>
                            `;
                        })
                        .join('');
                }

      // const userLabel = isMyPoint ? 'Toi' : (point.user?.email || 'Inconnu');
       
      
        const marker = L.marker([point.coordinates[1], point.coordinates[0]], {
                    
                        
            icon: new L.divIcon({
         html: `
<div style="
    display:flex;
    flex-direction:column;
    align-items:center;
">

    <div style="
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
    </div>

 

</div>
`,
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

        ${collectionStatusHtml}
        ${observationFieldsHtml}
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
<br><br>
    ${
  (isField && isMyPoint) ? `
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
    highlightTableRow(point._id);
});
      //  marker.on('click', () => {
              //   console.log("🔥 CLICK MARKER:", point._id);
                //NON RICHIAMO PIU LA FUNZ TEMPORANEAMENTE; lA RIATTIVO QUANDO FARO' apparire lista con ricerca o filtri
                //highlightTableRow(point._id);
      //  });
        markersMap[point._id] = marker;
        return marker;
      
        });
          console.log("Marker creati:", markers.length);
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

// AGGIORNA LA TABELLA IN BASE AL TOGGLE
// -------------------

export function updateTable() {

    console.log("🟢 updateTable chiamata");

    if (!currentUserId) {
        currentUserId = window.currentUserId;
    }

    console.log("TABLE", points?.length, currentUserId);

    if (!points) return;

    const dtMobile = $('#main-table-mobile').DataTable();
    const dtDesktop = $('#main-table-desktop').DataTable();

    dtMobile.clear();
    dtDesktop.clear();

    const showGroupPoints =
        !!document.getElementById("toggleGroupPoints")?.checked;

    console.log("TOGGLE =", showGroupPoints);

    const isOpen = window.APP_VIEW === "open";

    // Filtra i punti visibili
    const filteredPoints = points.filter(point => {

        if (isOpen) return true;

        const userId = point.user?._id ?? point.user;

        return (
            showGroupPoints ||
            String(userId) === String(currentUserId)
        );
    });

    // Raggruppa i punti per email del dichiarante
    console.log(
    "🔎 VERIFICA USER DEI PUNTI:",
    points.map(point => ({
        name: point.name,
        user: point.user,
        userType: typeof point.user,
        email: point.user?.email,
        userId: point.user?._id ?? point.user
    }))
);
    const groupedPoints = new Map();

    filteredPoints.forEach(point => {

        const email =
            typeof point.user === "object" && point.user
                ? point.user.email
                : null;

        const authorEmail = email || "Dichiarant inconnu";

        if (!groupedPoints.has(authorEmail)) {
            groupedPoints.set(authorEmail, []);
        }

        groupedPoints.get(authorEmail).push(point);
    });

    // Aggiunge intestazioni e punti alle due tabelle
    groupedPoints.forEach((authorPoints, authorEmail) => {

                // Intestazione del dichiarante
        const headerRow = `
            <div class="bg-base-200 font-bold text-xs px-2 py-2">
                👤 ${authorEmail} (${authorPoints.length})
            </div>
        `;

        const headerMobile = dtMobile.row.add([
            headerRow,
            ''
        ]).node();

        const headerDesktop = dtDesktop.row.add([
            headerRow,
            ''
        ]).node();

        $(headerMobile).addClass('declarant-header');
        $(headerDesktop).addClass('declarant-header');


/*
        const headerContent = `
            <tr class="declarant-header">
                <td colspan="2"
                    class="bg-base-200 font-bold text-xs px-2 py-2">
                    👤 ${authorEmail}
                    <span class="font-normal">
                        (${authorPoints.length})
                    </span>
                </td>
            </tr>
        `;

        // Inserisce l'intestazione come riga speciale
        const headerMobile = dtMobile.row.add([
            headerContent,
            ''
        ]).node();

        const headerDesktop = dtDesktop.row.add([
            headerContent,
            ''
        ]).node();

        $(headerMobile)
            .addClass('declarant-header')
            .attr('data-header', 'true');

        $(headerDesktop)
            .addClass('declarant-header')
            .attr('data-header', 'true');
*/
        authorPoints.forEach(point => {

            const userId = point.user?._id ?? point.user;
            const isMine =
                String(userId) === String(currentUserId);

            const name = point.name || 'Senza nome';

            const dateText = point.createdAt
                ? new Date(point.createdAt).toLocaleDateString('fr-FR')
                : '';

            const rowContent = `
                <div class="flex flex-col">
                    <div class="flex items-center gap-2">
                        <span>${getIconEmoji(point)}</span>
                        <span>${name}</span>
                    </div>
                    <div class="text-[10px] text-gray-500 ml-6">
                        ${dateText}
                    </div>
                </div>
            `;

            const categoryContent = `
                <span class="text-sm">
                    ${point.category || '—'}
                </span>
            `;

            const newRowMobile = dtMobile.row.add([
                rowContent,
                categoryContent
            ]).node();

            const newRowDesktop = dtDesktop.row.add([
                rowContent,
                categoryContent
            ]).node();

            $(newRowMobile).attr('data-point-id', point._id);
            $(newRowDesktop).attr('data-point-id', point._id);
        });
    });

    dtMobile.draw();
    dtDesktop.draw();

    // Clic sulla riga: evidenzia il punto e apre la popup
    $('#main-table-mobile tbody tr, #main-table-desktop tbody tr')
        .each(function() {

            const pointId = $(this).attr('data-point-id');

            if (pointId) {
                $(this).off('click').on('click', function() {

                    highlightTableRow(pointId);

                    const marker = getMarker(pointId);

                    if (marker) {
                        marker.openPopup();

                        if (marker._icon) {
                            marker._icon.classList.add('marker-highlight');

                            setTimeout(() => {
                                if (marker._icon) {
                                    marker._icon.classList.remove(
                                        'marker-highlight'
                                    );
                                }
                            }, 1000);
                        }
                    }
                });
            }
        });
}
