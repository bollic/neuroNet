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
     const showTresChaud =
        document.getElementById("toggle-tresChaud")?.checked;

    const showChaud =
        document.getElementById("toggle-chaud")?.checked;

    const showMoyen =
        document.getElementById("toggle-moyen")?.checked;

    const showConfortable =
        document.getElementById("toggle-confortable")?.checked;

    const showExcellent =
        document.getElementById("toggle-excellent")?.checked;

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
           const comfortScore = getComfortIndex(point);

   // 🔴 Très chaud
if (comfortScore <= 2 && !showTresChaud)
    return false;

// 🟠 Chaud
if (comfortScore >= 3 &&
    comfortScore <= 4 &&
    !showChaud)
    return false;

// 🟡 Moyen
if (comfortScore >= 5 &&
    comfortScore <= 6 &&
    !showMoyen)
    return false;

// 🟢 Confortable
if (comfortScore >= 7 &&
    comfortScore <= 8 &&
    !showConfortable)
    return false;

// 🌿 Excellent
if (comfortScore >= 9 &&
    !showExcellent)
    return false;


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
       
      
      const a = point.attributes || {};
        const climate = a.climate || {};
        const environment = a.environment || {};
        const building = a.building || {};

        
const comfortScore = getComfortIndex(point);
const comfortBadge = getComfortBadge(comfortScore);

console.log("🌿 Comfort debug");
console.log({
    temperature: climate.temperature,
    interieurTemperature: climate.interieurTemperature,
    humidite: climate.humidite,
    surface: environment.surface,
    trees: environment.trees,
    shade: environment.shade,
    water: environment.water,
    volets: building.volets,
    clim: building.airConditioning,
    etage: building.etage,
    exposition: building.exposition,
    score: comfortScore
});

const facteursDefavorables = [];
const facteursFavorables = [];

if (building.dernierEtage) facteursDefavorables.push("Dernier étage (chauffe par le toit)");
if (building.toitSansOmbrage) facteursDefavorables.push("Toit sans ombrage");
if (environment.surface === "beton") facteursDefavorables.push("Environnement très minéral");
if (building.exposition === "Sud") facteursDefavorables.push("Façade exposée au sud");

if (environment.trees) facteursFavorables.push("Arbres à proximité");
if (environment.shade) facteursFavorables.push("Ombre");
if (environment.water) facteursFavorables.push("Présence d'eau");
if (building.volets) facteursFavorables.push("Volets");
if (building.toitBlanc) facteursFavorables.push("Toiture réfléchissante");
if (building.airConditioning) facteursFavorables.push("Climatisation");   


        let observationHtml = "";

        if (window.GROUP_TYPE === "observation") {

            observationHtml = `

                ${climate.temperature != null
                    ? `🌡 Extérieur : <strong>${climate.temperature}°C</strong><br>`
                    : ""}
                
                ${climate.interieurTemperature != null
                    ? `🏠 Intérieur : <strong>${climate.interieurTemperature}°C</strong><br>`
                    : ""}



                ${environment.shade
                    ? `☂ Ombre : oui<br>`
                    : ""}
          
                ${building.exposition
                    ? `☀️ Exposition : ${building.exposition}<br>`
                    : ""}

                ${building.etage
                    ? `🏢 Étage : ${building.etage}<br>`
                    : ""}


                ${building.airConditioning
                    ? `❄ Climatisation : oui<br>`
                    : ""}
<br>
<hr>

🌿 <strong>Indice de confort thermique : ${comfortScore}/10</strong><br><br>

<br>
${
    facteursDefavorables.length
        ? `⚠️ <strong>Facteurs défavorables</strong><br>
           ${facteursDefavorables.map(f => `• ${f}`).join("<br>")}<br><br>`
        : ""
}

${
    facteursFavorables.length
        ? `✅ <strong>Facteurs favorables</strong><br>
           ${facteursFavorables.map(f => `• ${f}`).join("<br>")}`
        : ""
}

            `;
}
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

    <div style="
    margin-top:3px;
    background:white;
    padding:2px 6px;
    border-radius:12px;
    text-align:center;
    box-shadow:0 1px 4px rgba(0,0,0,0.25);
">
    <strong style="font-size:11px;">
        ${comfortBadge}
    </strong>
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


        ${observationHtml}
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

export function updateTable() {

    console.log("🟢 updateTable chiamata");
        if (!currentUserId) {
            currentUserId = window.currentUserId;
        }
        console.log("TABLE", points?.length, currentUserId);
        if (!points ) return;
        const dt = $('#main-table').DataTable();
        dt.clear();
    const showGroupPoints = !!document.getElementById("toggleGroupPoints")?.checked;
        console.log("TOGGLE =", showGroupPoints);
        


const isOpen = window.APP_VIEW === "open";

points.filter(point => {

if (isOpen) return true;

   const userId = point.user?._id ?? point.user;

    return (
        showGroupPoints ||
        String(userId) === String(currentUserId)
    );
})

   .forEach(point => {
    
            /*const userId = typeof point.user === "object"
                ? point.user._id
                : point.user; */
    const userId = point.user?._id ?? point.user;
                const isMine = String(userId) === String(currentUserId);
                const name = point.name || 'Senza nome';
              
                const comfortScore = getComfortIndex(point);
                const comfortBadge = getComfortBadge(comfortScore);

                const dateText = point.createdAt
                    ? new Date(point.createdAt).toLocaleDateString('fr-FR')
                    : '';

            const actionCell = isMine
                ? `<a href="/delete/${point._id}" class="btn btn-xs btn-error">
                    <i class="fas fa-trash"></i>
                    </a>`
                : `<span class="text-gray-400 text-xs italic">—</span>`;

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

        const newRow = dt.row.add([
        rowContent,
        comfortBadge
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
 

export function getComfortIndex(point) {

    let score = 5; // punto di partenza

    const climate = point.attributes?.climate || {};
    const env = point.attributes?.environment || {};
    const building = point.attributes?.building || {};
    // Surface
    if (env.surface === "beton") score -= 2;
    if (env.surface === "asphalte") score -= 2;
    if (env.surface === "terre") score += 1;
    if (env.surface === "herbe") score += 2;

    if (env.trees) score += 2;
    if (env.shade) score += 2;
    if (env.water) score += 1;

    if (building.volets) score += 1;
    if (building.airConditioning) score += 1;
   
    // Étage
    if (building.etage >= 6) score -= 1;
    // Dernier étage
     if (building.dernierEtage) score -= 1;
     if (building.toitSansOmbrage) score -= 1;
     if (building.toitBlanc) score += 1;
// Exposition
if (building.exposition === "Sud") score -= 1;
if (building.exposition === "Ouest") score -= 1;
if (building.exposition === "Nord") score += 1;
// Température intérieure
if (climate.interieurTemperature <= 27) score += 2;
else if (climate.interieurTemperature >= 30) score -= 2;

// Température extérieure
if (climate.temperature >= 38) score -= 2;
else if (climate.temperature >= 35) score -= 1;

    score = Math.max(0, Math.min(score, 10));

    return score;
}

function getComfortBadge(score) {

    if (score <= 2)
        return "🥵 Très chaud<br><small>" + score + "/10</small>";

    if (score <= 4)
        return "🔴 Faible<br><small>" + score + "/10</small>";

    if (score <= 6)
        return "🟡 Moyen<br><small>" + score + "/10</small>";

    if (score <= 8)
        return "🟢 Confortable<br><small>" + score + "/10</small>";

    return "🌿 Excellent<br><small>" + score + "/10</small>";
}


