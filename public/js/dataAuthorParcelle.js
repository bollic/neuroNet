
document.addEventListener("DOMContentLoaded", function() { 
 
    let map; 
    let layerGroup;  
    let drawnItems;  
    //  AGGIORNA I DATI CON LA RISPOSTA DEL SERVER
  
    const sidebar = document.getElementById('sidebar');
     // Gestione eventi Bootstrap
    sidebar.addEventListener('shown.bs.collapse', function() {
        document.body.classList.add('sidebar-open');
        setTimeout(() => map.invalidateSize(), 300);
    });

    sidebar.addEventListener('hidden.bs.collapse', function() {
        document.body.classList.remove('sidebar-open');
        map.invalidateSize();
    });

    // Chiusura click esterno
    document.addEventListener('click', function(event) {
        if (!sidebar.contains(event.target) && 
            !event.target.closest('.navbar-toggler') && 
            sidebar.classList.contains('show')) {
            bootstrap.Collapse.getInstance(sidebar).hide();
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
        },
      };

      const geoLayer = L.geoJSON(geoJson).bindPopup(`
        <div>
          <strong>${geoJson.properties.name}</strong>
        </div>
      `).addTo(drawnItems);

      geoLayer.eachLayer((layer) => polygons.push(layer));
    });

    if (polygons.length === 1) {
      map.fitBounds(polygons[0].getBounds());
    } else if (polygons.length > 1) {
      const bounds = L.latLngBounds([]);
      polygons.forEach((poly) => bounds.extend(poly.getBounds()));
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
            url: '//cdn.datatables.net/plug-ins/1.11.5/i18n/it-IT.json'
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