// parcelleUtils.js
import { getIconEmoji, createEmojiMarker } from "./mapCommon.js";

// Variabili locali al modulo (come in pointUtils.js)


export let map = null;
export let parcelles = [];
export let drawnItems = null;
export let parcellesLayer = null;
export let highlightTableRow = () => {};

const parcellesLayersMap = new Map();

export function highlightParcelleOnMap(parcelleId, highlight = true) {
    const geoLayer = parcellesLayersMap.get(String(parcelleId));

    if (!geoLayer) {
        console.log("❌ Layer Parcelle non trovato:", parcelleId);
        return;
    }

    geoLayer.eachLayer((layer) => {
        if (highlight) {
            layer.setStyle({
                weight: 5,
                fillOpacity: 0.5
            });
        } else {
            layer.setStyle({
                weight: 3,
                fillOpacity: 0.2
            });
        }
    });
}
// Funzione per reiniettare le dipendenze
export function setParcellesDeps(deps) {
    map = deps.map || map;
    parcelles = deps.parcelles || parcelles;
    drawnItems = deps.drawnItems || drawnItems;
    parcellesLayer = deps.parcellesLayer || parcellesLayer;
    highlightTableRow = deps.highlightTableRow || highlightTableRow;
}

export function calculateParcelArea(parcelleGeometry) {
    return turf.area(parcelleGeometry);
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
                id: parcelle._id,   // 👈 QUESTO È FONDAMENTALE
                name: parcelle.name || "Parcelle sans nom",
                category: parcelle.category || "",
            },
        };

 const geoLayer = L.geoJSON(geoJson, {
    interactive: true,

    onEachFeature: (feature, layer) => {
         console.log("🧪 onEachFeature ATTIVATO", parcelle._id);
       // const id = parcelle._id;
        const id = feature.properties?.id || parcelle._id;

            layer.bindPopup(`
                <strong>${parcelle.name || "Parcelle sans nom"}</strong><br>
                Categoria: ${parcelle.category || ""}<br>
                Surface: ${Math.round(parcelle.area || 0)} m²<br>
                🏢 Bâtiments: ${(parcelle.buildingPercent || 0).toFixed(1)} %<br>

                Status: ${parcelle.status || "A_VERIFIER"}
                    Status: <span class="status-label">${parcelle.status || "A_VERIFIER"}</span><br>
    <button class="btn-status" data-id="${parcelle._id}" data-status="OK">🟢 OK</button>
    <button class="btn-status" data-id="${parcelle._id}" data-status="NON_CONFORME">🔴 NON</button>
    <button class="btn-status" data-id="${parcelle._id}" data-status="A_VERIFIER">🟡 VERIFY</button>

                `);


        layer.on("click", () => {
            console.log("🟣 CLICK ENTRATO", id);
            highlightTableRow(id);
        });

        layer.on("mouseover", () => {
             console.log("🟢 MOUSEOVER ENTRATO", id);
            document
                .querySelectorAll(`[data-id="${id}"]`)
                .forEach(r => r.classList.add("highlight-row"));
        });
    
        layer.on("add", () => {
    console.log("➕ layer aggiunto DOM", parcelle._id);
});

        layer.on("mouseout", () => {
            document
                .querySelectorAll(`[data-id="${id}"]`)
                .forEach(r => r.classList.remove("highlight-row"));
        });
    }
})

.addTo(parcellesLayer);
geoLayer.eachLayer((layer) => {
    if (layer._path) {
        layer._path.style.pointerEvents = "auto";
        layer._path.style.cursor = "pointer";
    }
});
console.log("🟩 GEOJSON CREATO", parcelle._id);

parcellesLayersMap.set(parcelle._id, geoLayer);

        geoLayer.eachLayer((layer) => polygons.push(layer));

        // Emoji ai vertici
        try {
            const coords = parcelle.geometry.coordinates[0];           
        
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

