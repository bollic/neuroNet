// mapCore.js
export let map, layerGroup, drawnItems;
export let pointsLayer, parcellesLayer;
export let markersMap = {};
export let userUsedGeolocation = false;

// -------------------
// FUNZIONE INIZIALIZZA MAPPA
// -------------------
export function initializeMap() {
    // 1️⃣ Inizializza mappa
    map = L.map("map", { center: [43.2, 1.30], zoom: 10 });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { 
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // 2️⃣ Inizializza layer
    pointsLayer = L.layerGroup().addTo(map);
    parcellesLayer = L.layerGroup().addTo(map);
    layerGroup = L.featureGroup().addTo(map);  
    drawnItems = L.featureGroup().addTo(map);

    console.log("✅ initializeMap: pointsLayer creato", pointsLayer);
    console.log("✅ initializeMap: parcellesLayer creato", parcellesLayer);
    console.log("✅ initializeMap: layerGroup/drawnItems creati");

    // 3️⃣ Controlli disegno (Draw Control)
/*
const drawControl = new L.Control.Draw({
    draw: {
        polygon: true,
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false
    },
    edit: false   // ⛔ DISABILITA COMPLETAMENTE EDIT
});
map.addControl(drawControl);
*/

    map.on('draw:edited', async function(e) {
        e.layers.eachLayer(async (layer) => {
            if (layer instanceof L.Marker) {
                const { lat, lng } = layer.getLatLng();
                try {
                    const response = await fetch('/api/update-point-coords', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ lat, lng, newCoordinates: [lat, lng] })
                    });
                    const data = await response.json();
                    if (data.success) console.log("✅ Punto aggiornato");
                } catch (error) {
                    console.error("Errore salvataggio:", error);
                }
            }
        });
    });

    // 4️⃣ Pulsante geolocalizzazione
    const locationButton = document.getElementById("use-my-location");
    if (locationButton) {
        locationButton.addEventListener("click", function() {
            if (!navigator.geolocation) {
                alert("❌ Geolocalisation non supportée par le navigateur.");
                return;
            }
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const { latitude: lat, longitude: lng } = position.coords;
                    console.log("📍 Geolocalizzazione:", lat, lng);
                    map.setView([lat, lng], 14);
                    userUsedGeolocation = true;

                    L.marker([lat, lng])
                        .addTo(map)
                        .bindPopup("📍 Tu es ici")
                        .openPopup();
                },
                function(err) {
                    alert("Erreur de géolocalisation : " + err.message);
                },
                { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
            );
        });
    }

    // 5️⃣ Invalida dimensioni mappa dopo render
    setTimeout(() => map.invalidateSize(), 500);
    // 6️⃣ ⚡ Dispatch evento mapReady
    document.dispatchEvent(new Event("mapReady"));
    console.log("🔥 initializeMap: mapReady dispatchato");
    // 6️⃣ Ritorna i layer e la mappa
    return { map, layerGroup, drawnItems, pointsLayer, parcellesLayer };
}
