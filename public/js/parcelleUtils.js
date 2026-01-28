// parcelleUtils.js
// parcelleUtils.js
import { getIconEmoji, createEmojiMarker } from "./mapCommon.js";

// Variabili locali al modulo (come in pointUtils.js)
export let map = null;
export let parcelles = [];
export let drawnItems = null;
export let parcellesLayer = null;

// Funzione per reiniettare le dipendenze
export function setParcellesDeps(deps) {
    map = deps.map || map;
    parcelles = deps.parcelles || parcelles;
    drawnItems = deps.drawnItems || drawnItems;
    parcellesLayer = deps.parcellesLayer || parcellesLayer;
}
export function updateMap() {
    if (!Array.isArray(parcelles)) {
        console.warn("Nessuna parcella da visualizzare");
        return;
    }

    drawnItems?.clearLayers();
    parcellesLayer?.clearLayers();

    const polygons = [];

    parcelles.forEach((parcelle) => {
        if (
            !parcelle.geometry ||
            parcelle.geometry.type !== "Polygon" ||
            !Array.isArray(parcelle.geometry.coordinates)
        ) {
            console.warn("Dati non validi:", parcelle);
            return;
        }

        const geoJson = {
            type: "Feature",
            geometry: parcelle.geometry,
            properties: {
                name: parcelle.name || "Parcelle sans nom",
                category: parcelle.category || "",
            },
        };

        const geoLayer = L.geoJSON(geoJson).bindPopup(`
            <div><strong>${geoJson.properties.name}</strong></div>
        `).addTo(parcellesLayer);

        geoLayer.eachLayer((layer) => polygons.push(layer));

        // Emoji ai vertici
        try {
            const coords = parcelle.geometry.coordinates[0];           
            coords.forEach(([lng, lat]) => {
             const emoji = getIconEmoji(parcelle) || "📌";

createEmojiMarker([lat, lng], emoji)
  .addTo(parcellesLayer)
  .bindPopup(`
    <div>
      <strong>${parcelle.name || "Parcelle sans nom"}</strong><br>
      Categoria: ${parcelle.category || "Senza categoria"}<br>
      Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}
    </div>
  `);

          
            });
        } catch (e) {
            console.warn("Errore creando emoji sui vertici:", e);
        }
    });

    // Centra mappa
    if (polygons.length === 1) {
        map.fitBounds(polygons[0].getBounds());
    } else if (polygons.length > 1) {
        const bounds = L.latLngBounds([]);
        polygons.forEach((poly) => bounds.extend(poly.getBounds()));
        map.fitBounds(bounds, { padding: [30, 30] });
    }
}

