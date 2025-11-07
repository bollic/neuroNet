
document.addEventListener("DOMContentLoaded", function() { 
 
    let map; 
    let layerGroup;  
    let drawnItems;  

    // 🔄 Aggiorna le categorie all’avvio
async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    const data = await res.json();
    if (data.success) {
      window.CATEGORIES = data.categories;
      console.log("✅ Categorie aggiornate:", data.categories);
    } else {
      console.warn("⚠️ Nessuna categoria trovata");
    }
  } catch (err) {
    console.error("❌ Errore fetch categorie:", err);
  }
}

// 🔧 Funzione per ottenere l'icona associata a una categoria
function getIconForCategory(categoryName) {
  if (!window.CATEGORIES || !Array.isArray(window.CATEGORIES)) return '🔴';
  const match = window.CATEGORIES.find(c => c.name === categoryName);
  if (!match) return '🔴';

  const iconKey = match.icon;
  const iconMap = {
    "🟥": "🚚",
    "🟧": "🏠",
    "🟨": "🏪",
    "🟩": "🌳",
    "🟦": "🏭",
    "truck": "🚚",
    "home": "🏠",
    "shop": "🏪",
    "tree": "🌳",
    "factory": "🏭"
  };
  return iconMap[iconKey] || iconKey || '🔴';
}

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
  //  setTimeout(() => map.invalidateSize(), 500);
    
function initializeMap() {
      map = L.map("map", { center: [43.2, 1.30], zoom: 10 });       
        layerGroup = L.featureGroup().addTo(map);  // Marker
        drawnItems = L.featureGroup().addTo(map);  // Poligoni
    // TileLayer con attribuzioni
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { 
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);      
     // Draw control 
     var drawControl = new L.Control.Draw({
        edit: { 
            featureGroup: drawnItems,
            edit: true,
            remove: false
        },
        draw: false
    });

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
   
    } 
    // Fine della funzione initializeMap() 

//console.log("Triangolo con groupedArticles:", groupedArticles['trepunti']);
//console.log("Triangoli con groupedArticles:", groupedArticles['triangle']);
//console.log("Pentagoni con groupedArticles:", groupedArticles['pentagone']);
function updateMap() {
  if (!Array.isArray(parcelles)) {
    console.warn("Nessuna parcella da visualizzare");
    return;
  }

  drawnItems.clearLayers();
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

    // 🔹 1. Disegna il poligono come prima
    const geoLayer = L.geoJSON(geoJson).bindPopup(`
      <div>
        <strong>${geoJson.properties.name}</strong>
      </div>
    `).addTo(drawnItems);

    geoLayer.eachLayer((layer) => polygons.push(layer));

    // 🔹 2. Mostra emoji sui vertici del poligono
    try {
      const coords = parcelle.geometry.coordinates[0]; // primo anello del poligono
      const iconEmoji = getIconForCategory(parcelle.category || "");

      coords.forEach(([lng, lat]) => {
        L.marker([lat, lng], {
          icon: L.divIcon({
            html: `<div style="font-size:24px;">${iconEmoji}</div>`,
            className: '',
            iconSize: [26, 26],
           iconAnchor: [13, 13]
      })
    })
    .addTo(drawnItems)
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

  // 🔹 3. Manteniamo la tua logica per centrare la mappa
  if (polygons.length === 1) {
    map.fitBounds(polygons[0].getBounds());
  } else if (polygons.length > 1) {
    const bounds = L.latLngBounds([]);
    polygons.forEach((poly) => bounds.extend(poly.getBounds()));
    map.fitBounds(bounds, { padding: [30, 30] });
  }
}


    loadCategories().then(() => {
  if (!map) {
    initializeMap();
  }

  setTimeout(() => {
    if (map) {              // ✅ evita errore se map non è ancora pronta
      map.invalidateSize();
      updateMap();
    } else {
      console.warn("⚠️ Mappa non ancora inizializzata al timeout");
    }
  }, 150); 
});


    // 1. INIZIALIZZA DATATABLES - SPOSTATO IN FONDO
    const table = $('#main-table').DataTable({
        pageLength: 20,
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.11.5/i18n/it-IT.json'
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