document.addEventListener("DOMContentLoaded", function() { 
    let map; 
    let layerGroup;  
    let drawnItems;  
    const parcelles = window.PARCELLES || [];
  const fieldUsers = window.FIELD_USERS || [];
  console.log("🔍 FIELD_USERS:", fieldUsers);
  console.log("📍 POINTS ricevuti:", parcelles);
 // ========================
  // DaisyUI drawer toggle
  // ========================
  const drawerToggle = document.getElementById("my-drawer");
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

   // ========================
  // Inizializza la mappa
  // ========================
function initializeMap() {
   if (!window.L) {
      console.error(
        "Leaflet non caricato: controlla i <script> nel layout/headerOfficeGeo."
      );
      return;
    }
      map = L.map("map", { center: [43.2, 1.30], zoom: 10 });       
        layerGroup = L.featureGroup().addTo(map);  // Marker
        drawnItems = L.featureGroup().addTo(map);  // Poligoni
    // TileLayer con attribuzioni
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { 
        maxZoom: 19,
        attribution:
         '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
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
    map.addControl(drawControl);
  } // Fine della funzione initializeMap() 

  // ========================
  // Funzione colore categorie
  // ========================
  function getColorForCategory(cat, colorMap, defaultColors, colorIndexRef) {
    if (!colorMap[cat]) {
      colorMap[cat] =
        defaultColors[colorIndexRef.index % defaultColors.length];
      colorIndexRef.index++;
    }
    return colorMap[cat];
  }

  // ========================
  // Disegna i punti sulla mappa
  // ========================
async function updateMap(data = parcelles) {
  console.log("updateMap triggered");
  layerGroup.clearLayers();
  drawnItems.clearLayers();
  // Controllo array globale
if (!Array.isArray(data) || data.length === 0) return;

  
    const polygons = [];
    const defaultColors = [
      "red",
      "green",
      "orange",
      "yellow",
      "violet",
      "black",
      "grey",
      "blue",
    ];
    const colorMap = {};
    const colorIndexRef = { index: 0 };
    
   // assegna colori alle categorie
    parcelles.forEach((parcelle) => {
      const cat = parcelle.category || "";
      getColorForCategory(cat, colorMap, defaultColors, colorIndexRef);
    });
    console.log("🖌️ Mappa colori categorie:", colorMap);
    
  // disegna parcelle (poligoni)
  data.forEach((parcelle) => {
    if (
      !Array.isArray(parcelle.coordinates) ||
      parcelle.coordinates.length === 0
    ) {
      console.warn("Geometria non valida:", parcelle);
      return;
    }

  const geoJson = {
    type: "Feature",
    geometry: { 
      type: "Polygon",
      coordinates: parcelle.coordinates
    },
    properties: {
      name: parcelle.name || "Sans nom",
      category: parcelle.category || "Sans category",
    },
  };
      const category = geoJson.properties.category || "";
    const color = colorMap[category] || "blue";

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
            Catégorie: ${feature.properties.category}<br>
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

// Aggiungi marker ai vertici della parcella
parcelle.coordinates.forEach(ring => {
  ring.forEach(coord => {
    const [lng, lat] = coord;
    const category = parcelle.category || "";
    const color = colorMap[category] || "blue"; // prendi il colore assegnato alla categoria

    const icon = new L.Icon({
      iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const marker = L.marker([lat, lng], { icon }).addTo(layerGroup);
    marker.bindPopup(`<strong>${parcelle.name}</strong><br>Catégorie: ${parcelle.category}`);
  });
});



  });

    if (polygons.length === 1) {
      map.fitBounds(polygons[0], { padding: [30, 30] });
    } else if (polygons.length > 1) {
      const bounds = L.latLngBounds([]);
     polygons.forEach((b) => bounds.extend(b)); // ogni b è già un LatLngBounds
     map.fitBounds(bounds, { padding: [30, 30] });
    }
  }
  // ========================
  // Avvio mappa
  // ========================
  if (!map) initializeMap();
  setTimeout(() => {
    map.invalidateSize();
    updateMap();
  }, 200);

  // ========================
  // User map
  // ========================
  const userMap = {};
  fieldUsers.forEach((u) => (userMap[u._id] = u.email));

  // ========================
  // DataTables
  // ========================
  const dtParcelles = parcelles.map((p) => ({
    name: p.name,
    category: p.category || '',   // <-- fallback se undefined
    createdAtFormatted: p.createdAtFormatted,   // visibile in tabella
    createdAtISO: p.createdAtISO,      // nascosto per i filtri
    userEmail: p.userEmail || "❓utente sconosciuto",
    userId: p.userId || null,
    _id: p._id,
    coordinates: p.coordinates || p.geometry?.coordinates || []
  }));

  console.log("💠 dtPoints per DataTables:", dtParcelles);
const table = $("#main-table").DataTable({
  data: dtParcelles,
  columns: [
    { data: 'name', title: 'Name' },
    { data: 'category', title: 'Category' },   
    { data: 'createdAtFormatted', title: 'Date' },  
    { data: 'createdAtISO', visible: false },   
    {
      data: null,
      title: 'Action',
      orderable: false,
      render: function(data, type, row) {
        return `<a href="/delete/${row._id}" class="btn btn-xs btn-error"><i class="fas fa-trash"></i></a>`;
      }
    }
  ],
  
  order: [[1, 'asc']],
  rowGroup: { dataSrc: "userId",
     startRender: function(rows, group) {
    const email = rows.data().pluck("userEmail")[0];
    return $('<tr/>')
    .addClass('group-row')
    .append(`
      <td colspan="5" class="bg-base-300 font-bold">
        <i class="fas fa-user"></i> ${email}
      </td>
    `);
   }
  },
});
/*
  // Popoliamo il select categorie dinamicamente
const categories = [...new Set(dtParcelles.map(p => p.category))];
categories.forEach(cat => {
  $("#filter-category").append(`<option value="${cat}">${cat}</option>`);
});
*/
// Dopo aver creato la DataTable
const uniqueCategories = [...new Set(dtParcelles.map(p => p.category).filter(Boolean))];
uniqueCategories.forEach(cat => {
  $("#filter-category").append(`<option value="${cat}">${cat}</option>`);
});

$("#filter-date").on("change", function () {
  const val = this.value;
  table.column(3).search(val || "").draw();
  console.log("🔍 Filtro data attivo:", val);
});

  // Filtro categoria
  $("#filter-category").on("change", function () {
    const val = this.value;
    table.column(1).search(val ? "^" + val + "$" : "", true, false).draw();
    console.log("🔍 Filtro categoria attivo:", val);

      // Aggiorna mappa con soli dati filtrati
  const filteredData = table.rows({ filter: 'applied' }).data().toArray();
  updateMap(filteredData);
  });

  $("#page-length").on("change", function () {
    table.page.len($(this).val()).draw();
  });

  table.on("length.dt", function (e, settings, len) {
    $("#page-length").val(len);
  });

//  console.log("DataTables inizializzato:", table);
  console.log("Elementi nella tabella:", table.rows().count());
});
   