document.addEventListener("DOMContentLoaded", function () {
  let map;
  let layerGroup;
  let drawnItems;
const points = window.POINTS || [];
  const fieldUsers = window.FIELD_USERS || [];
  // ========================
// Colori categorie GLOBALI
// ========================
const defaultColors = ["red","green","orange","yellow","violet","black","grey","blue"];
const colorMap = {};
const colorIndexRef = { index: 0 };

points.forEach(p => {
  const cat = p.category || "";
  if (!colorMap[cat]) {
    colorMap[cat] = defaultColors[colorIndexRef.index % defaultColors.length];
    colorIndexRef.index++;
  }
});
console.log("🎨 Color map globale:", colorMap);

  console.log("🔍 FIELD_USERS:", fieldUsers);
  console.log("📍 POINTS ricevuti:", points);
    // VARIABILE GLOBALE DEL FILTRO (non dentro updateMap)
    let activeCategoryFilter = null;
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
    map = L.map("map", { center: [43.2, 1.3], zoom: 10 });
    layerGroup = L.featureGroup().addTo(map); // Marker
    drawnItems = L.featureGroup().addTo(map); // Poligoni

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
        edit: true,
        remove: false,
      },
      draw: false,
    });
    map.addControl(drawControl);
  }  // Fine della funzione initializeMap() 

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
  function updateMap() {
    console.log("updateMap triggered — activeCategoryFilter =", activeCategoryFilter);
    layerGroup.clearLayers();
    drawnItems.clearLayers();
      // Applica il filtro (genera l'array che useremo per colori + markers)
    const data = points.filter(p => {
      return !activeCategoryFilter || (p.category === activeCategoryFilter);
    });

    if (!Array.isArray(data) || data.length === 0) {
        console.warn("Nessun punto disponibile (dopo filtro)", activeCategoryFilter);      return;
    }

    const markers = [];
  

    // disegna marker
    data.forEach((point) => {
      if (!point.coordinates || point.coordinates.length !== 2) {
        console.warn("Coordinate non valide:", point.coordinates);
        return;
      }
     const geoJson = {
        type: "Feature",
        geometry: { type: "Point", coordinates: point.coordinates },
        properties: { name: point.name || "Senza nome", category: point.category },
      };
      const geoLayer = L.geoJSON(geoJson, {
        pointToLayer: function (feature, latlng) {
          const category = feature.properties.category || "";
          const color = colorMap[category] || "blue";
          const icon = new L.Icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
            shadowUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          });
          return L.marker(latlng, { icon });
        },
      }).bindPopup(`
        <div style="min-width: 180px;">
          <strong><i class="fas fa-map-marker-alt text-danger me-1"></i>${geoJson.properties.name}</strong><br>
          <i class="fas fa-tag text-primary me-1"></i>Catégorie: ${
            geoJson.properties.category || "Senza categoria"
          }<br>
          <i class="fas fa-location-arrow text-success me-1"></i>
          Lat: ${point.coordinates[1].toFixed(5)}, Lng: ${point.coordinates[0].toFixed(5)}
        </div>
      `).addTo(drawnItems);

      geoLayer.eachLayer((marker) => markers.push(marker));
    });

    // centra la mappa
    if (markers.length === 1) {
      map.setView(markers[0].getLatLng(), 12);
    } else if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map((m) => m.getLatLng()));
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
// Optional: mappa rapida utenti
// ========================
  const userMap = {};
  fieldUsers.forEach((u) => (userMap[u._id] = u.email));

  // ========================
  // DataTables
  // ========================
  const dtPoints = points.map((p) => ({
    name: p.name,
    category: p.category,
    createdAtFormatted: p.createdAtFormatted,   // visibile in tabella
    createdAtISO: p.createdAtISO,      // nascosto per i filtri
    userEmail: p.userEmail || "❓utente sconosciuto",
    userId: p.userId || null,
    _id: p._id,
  }));

  console.log("💠 dtPoints per DataTables:", dtPoints);

const table = $("#main-table").DataTable({
  data: dtPoints,
  columns: [
    { data: 'name', title: 'Name' },
    { data: 'category', title: 'Categorie' },    
    { data: 'createdAtFormatted', title: 'Date' },  // 👈 corretto    { data: 'createdAtISO', visible: false },      // 👈 nascosta, solo per filtro    
    { data: 'createdAtISO', visible: false },      // nascosta per filtro
     { data: 'category', title: 'Categorie' }    
  ],
  order: [[1, 'asc']], // ordina per categoria (puoi cambiare)
  rowGroup: {
    dataSrc: "userId",  // 🔑 raggruppa in base all'ID utente
    startRender: function (rows, group) {
      // prendo l'email dal primo record del gruppo
      const email = rows.data().pluck("userEmail")[0];
      return $('<tr/>')
        .addClass('group-row')
        .append(`
          <td colspan="5" class="bg-base-300 font-bold">
            <i class="fas fa-user"></i> ${email}
          </td>
        `);
    }
  }
});
  // Popoliamo il select categorie dinamicamente
const categories = [...new Set(dtPoints.map(p => p.category))];
categories.forEach(cat => {
  $("#filter-category").append(`<option value="${cat}">${cat}</option>`);
});

$("#filter-date").on("change", function () {
  const val = this.value; // es. "2025-09-15"
  table.column(3).search(val || "").draw();
    console.log("🔍 Filtro data attivo:", val);
  });



$("#filter-category").on("change", function () {
  const val = this.value;
  table.column(1).search(val ? "^" + val + "$" : "", true, false).draw();

  // aggiorna filtro per la mappa
  activeCategoryFilter = val || null;
  updateMap();
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
