
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
            edit: false,
            remove: false
        },
        draw: false
    });

  // Event handling
    map.addControl(drawControl);
    } // Fine della funzione initializeMap() 


async function updateMap() {
  console.log("updateMap triggered");
  layerGroup.clearLayers();
  drawnItems.clearLayers();

if (!Array.isArray(parcelles) || parcelles.length === 0) {
  console.warn("Nessuna parcella disponibile");
  return;
}

  const polygons = [];

  parcelles.forEach(parcelle => {
    if (!parcelle.geometry || parcelle.geometry.type !== 'Polygon' || !parcelle.geometry.coordinates) {
     console.warn("Geometria non valida:", parcelle);
      return;
    }

    const geoJson = {
      type: "Feature",
       geometry: parcelle.geometry,
      properties: {
        name: parcelle.name || "Senza nome",
        user: parcelle.user?.email || "Field user"
      }
    };

    const geoLayer = L.geoJSON(geoJson, {
      style: {
        color: "#3388ff",
        weight: 2,
        opacity: 0.7,
        fillOpacity: 0.2
      },
      onEachFeature: function (feature, layer) {
        const popupContent = `
          <div>
            <strong>${feature.properties.name}</strong><br>
            Utente: ${feature.properties.user}
          </div>
        `;
        layer.bindPopup(popupContent);
      }
    }).addTo(drawnItems);
   geoLayer.eachLayer(layer => {
      if (layer.getBounds) {
        polygons.push(layer.getBounds());
      }
    });
  });

   if (polygons.length === 1) {
    map.fitBounds(polygons[0], { padding: [20, 20] });
  } else if (polygons.length > 1) {
    const allBounds = polygons.reduce((acc, b) => acc.extend(b), polygons[0]);
    map.fitBounds(allBounds, { padding: [30, 30] });
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
    const tableElement = document.getElementById('main-table');
if (tableElement) {
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
    } else {
  console.warn("Tabella non trovata: #main-table");
}
}); 