
document.addEventListener("DOMContentLoaded", function() { 
 
    let map; 
    let layerGroup;  
    let drawnItems;  
    //  AGGIORNA I DATI CON LA RISPOSTA DEL SERVER
  
    //const sidebar = document.getElementById('sidebar');
   // DaisyUI drawer toggle
        const drawerToggle = document.getElementById("my-drawer");

        // Quando il drawer viene aperto
        drawerToggle.addEventListener("change", function () {
        if (drawerToggle.checked) {
            document.body.classList.add("sidebar-open");
            setTimeout(() => map.invalidateSize(), 300);
        } else {
            document.body.classList.remove("sidebar-open");
            map.invalidateSize();
        }
        });

    // Aggiorna la mappa dopo il rendering iniziale
    setTimeout(() => map.invalidateSize(), 500);
    
function initializeMap() {
      map = L.map("map", { center: [43.2, 1.30], zoom: 10 });       
        layerGroup = L.featureGroup().addTo(map);  // Marker
        drawnItems = L.featureGroup().addTo(map);  // Poligoni
    // TileLayer con attribuzioni
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { 
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);      
     // Draw control (come nella tua versione)
     var drawControl = new L.Control.Draw({
        edit: { 
            featureGroup: drawnItems,
            edit: true,
            remove: false
        },
        draw: false
    });

  // Event handling
    map.addControl(drawControl);
      // Evento per la modifica dei poligoni
      map.on('draw:edited', function(e) {
        e.layers.eachLayer(async (layer) => {
            if (layer instanceof L.Marker) {
                const latlng = layer.getLatLng();
            const lat = latlng.lat;
            const lng = latlng.lng; 
            
            try {
                    const response = await fetch('/api/update-point-coords', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            lat,
                            lng,
                            newCoordinates: newCoords
                        })
                    });                  
                    const data = await response.json();
                    if (data.success) {
                         }
                } catch (error) {
                    console.error('Errore salvataggio:', error);
                }
            }
        });
    });
   
    } // Fine della funzione initializeMap() 

//console.log("Triangolo con groupedArticles:", groupedArticles['trepunti']);
//console.log("Triangoli con groupedArticles:", groupedArticles['triangle']);
//console.log("Pentagoni con groupedArticles:", groupedArticles['pentagone']);
console.log("📌 points ricevuti:", points);

function updateMap() {
    console.log("updateMap triggered");  
    layerGroup.clearLayers();
    drawnItems.clearLayers();    
    const markers = []; // ✅ qui dichiari l'array che raccoglie i marker
   
    if (!Array.isArray(points)) {
        console.warn("Nessun punto da visualizzare");
        return;
    }

      // ✅ 1. DEFINISCI I COLORI DISPONIBILI
  const defaultColors = ['red', 'green', 'orange', 'yellow', 'violet', 'black', 'grey', 'blue'];
  const colorMap = {};
  let colorIndex = 0;

  // ✅ 2. MAPPATURA AUTOMATICA DELLE CATEGORIE PRESENTI NEI PUNTI
  points.forEach(point => {
    const cat = point.category || "";
    if (!colorMap[cat]) {
      colorMap[cat] = defaultColors[colorIndex % defaultColors.length];
      colorIndex++;
    }
  });
console.log("🖌️ Mappa colori categorie:", colorMap);

  // ✅ 3. ORA VAI A DISEGNARE I MARKER COME PRIMA
    points.forEach(point => {
        if (!point.coordinates || point.coordinates.length !== 2) {
            console.warn("Coordinate non valide:", point.coordinates);
            return;
        }

        const geoJson = {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: point.coordinates
            },
            properties: {
                name: point.name || "Senza nome",
                category:point.category
            }
        };

            const geoLayer = L.geoJSON(geoJson, {
            pointToLayer: function (feature, latlng) {
                const category = feature.properties.category || "";
                const color = colorMap[category] || 'blue';
                const icon = new L.Icon({
                    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
                    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png',
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowSize: [41, 41]
                });
                return L.marker(latlng, { icon });
            }

        }).bindPopup(`
            <div style="min-width: 180px;">
                <strong><i class="fas fa-map-marker-alt text-danger me-1"></i>${geoJson.properties.name}</strong><br>                
                <i class="fas fa-tag text-primary me-1"></i>Catégorie: ${geoJson.properties.category || 'Senza categoria'}<br>
                <i class="fas fa-location-arrow text-success me-1"></i>Lat: ${point.coordinates[1].toFixed(5)}, Lng: ${point.coordinates[0].toFixed(5)}<br>
                ${point.image ? `<img src="${point.image}" alt="Immagine punto" style="width: 40px; height: 40px; margin-top: 6px; border-radius: 50%; object-fit: cover; box-shadow: 0 2px 6px rgba(0,0,0,0.2);">` : ''}
            </div>
`)
        .addTo(drawnItems);


          // 👇 Aggiungi ogni singolo marker all'array
        geoLayer.eachLayer(marker => markers.push(marker));
    });
      // 👇 Alla fine, centra la mappa su tutti i marker visibili
   if (markers.length === 1) {
    map.setView(markers[0].getLatLng(), 4); // zoom più ampio per contesto geografico
} else if (markers.length > 1) {
    const bounds = L.latLngBounds(markers.map(m => m.getLatLng()));
    map.fitBounds(bounds, { padding: [30, 30] });
}

}
        // Initialize map only once, then update content
        if (!map) {
          initializeMap();
        }

        setTimeout(() => {
          map.invalidateSize(); // Ensure map is resized
          updateMap(); // Update markers and polylines
        }, 100); // Short delay to ensure rendering
  

    // 1. INIZIALIZZA DATATABLES - SPOSTATO IN FONDO
    const table = $('#main-table').DataTable({
        pageLength: 20,
        language: {
        url: 'https://cdn.datatables.net/plug-ins/1.11.5/i18n/fr-FR.json'
        }

    });

    // 2. GESTIONE CAMBIO ELEMENTI PER PAGINA
    $('#page-length').on('change', function() {
        table.page.len($(this).val()).draw();
    });

    // 3. AGGIORNA SELECT CON VALORE CORRENTE
    table.on('length.dt', function(e, settings, len) {
        $('#page-length').val(len);
    });

    // Aggiungi questi console.log per debug
    console.log("DataTables inizializzato:", table);
    console.log("Elementi nella tabella:", table.rows().count());

}); 