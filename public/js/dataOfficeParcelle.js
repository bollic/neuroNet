// dataOfficeParcelle.js
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
  } 
  
function getParcelleEmoji(parcelle) {
  console.log("🎯 getParcelleEmoji:", parcelle);
  // 1️⃣ emoji salvata direttamente sulla parcella
  if (parcelle.icon && parcelle.icon.trim() !== "") {
    return parcelle.icon;
  }

  // 2️⃣ fallback categoria
  const cat = (window.CATEGORIES || []).find(
    c => c.name.toUpperCase() === (parcelle.category || "").toUpperCase()
  );

  if (cat && cat.icon) {
    return cat.icon;
  }

  // 3️⃣ fallback finale
  return "🔴";
}

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
const parcelLayers = {};
function updateInsightPanel(parcelles) {
  const total = parcelles.length;
  const users = [...new Set(parcelles.map(p => p.userId))].length;
  const totalHa = parcelles.reduce((sum, p) => sum + (p.area || 0), 0);

  // Conteggio dinamico per ogni categoria presente
  const categoriesCount = {};
  parcelles.forEach(p => {
    const cat = p.category || 'Non défini';
    const emoji = getParcelleEmoji(p); // 🔹 prendi l'emoji della parcella
 if (!categoriesCount[cat]) {
      categoriesCount[cat] = { count: 1, emoji: emoji };
    } else {
      categoriesCount[cat].count++;
    } 
  });

  const ul = document.getElementById('insight-list');
  ul.innerHTML = `
    ${Object.entries(categoriesCount)
         .map(([cat, info]) => `<li>${info.emoji} ${cat} : ${info.count} parcelle${info.count > 1 ? 's' : ''}</li>`)
       .join('')}
    <li>🟩 Superficie totale : ${totalHa} ha</li>
    <li>👤 Utilisateurs actifs : ${users}</li>
    <li>🔹 Total parcelles : ${total}</li>
  `;
}
// ========================
  // Disegna i punti sulla mappa
  // ========================
async function updateMap(parcelles) {
  console.log("updateMap triggered");
  layerGroup.clearLayers();
  drawnItems.clearLayers();
  // Controllo array globale
if (!Array.isArray(parcelles) || parcelles.length === 0) return;

  
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
  parcelles.forEach((parcelle) => {
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
        color: color,
        fillColor: color,
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
    parcelLayers[parcelle._id] = geoLayer;
    geoLayer.eachLayer(layer => {
      if (layer.getBounds) {
        polygons.push(layer.getBounds());
      }
    });
// Aggiungi marker (robusto)
const coords = parcelle.coordinates;

// sicurezza
if (!Array.isArray(coords) || coords.length === 0) return;

// funzione helper interna (puoi anche metterla fuori)
function addMarker(lat, lng) {
  const emoji = getParcelleEmoji(parcelle);

  L.marker([lat, lng], {
    icon: L.divIcon({
      html: `<div style="font-size:22px;">${emoji}</div>`,
      className: 'emoji-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })
  }).addTo(layerGroup);
}

// 🟩 Caso POLYGON (normale)
if (Array.isArray(coords[0][0])) {
  coords.forEach(ring => {
    ring.forEach(coord => {
      const [lng, lat] = coord;
      addMarker(lat, lng);
    });
  });
}

// 🟨 Caso POINT (fallback sicurezza)
else if (coords.length === 2) {
  const [lng, lat] = coords;
  addMarker(lat, lng);
}
// Aggiungi marker ai vertici della parcella
/*const emoji = getParcelleEmoji(parcelle);

parcelle.coordinates.forEach(ring => {
  ring.forEach(coord => {
    const [lng, lat] = coord;

    L.marker([lat, lng], {
      icon: L.divIcon({
        html: `<div style="font-size:22px;">${emoji}</div>`,
        className: 'emoji-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
    }).addTo(layerGroup);
  });
});


*/

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
     icon: p.icon || null,   // ✅ QUESTA È LA CHIAVE
    createdAtFormatted: p.createdAtFormatted,   // visibile in tabella
    createdAtISO: p.createdAtISO,      // nascosto per i filtri
    userEmail: p.userEmail || "❓utente sconosciuto",
    userId: p.userId || null,
    _id: p._id,
    coordinates: p.coordinates || p.geometry?.coordinates || []
  }));
    setTimeout(() => {
    map.invalidateSize();
    updateMap(dtParcelles);
  }, 200);
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

   // <<< QUI AGGIUNGI LE NUOVE OPZIONI >>>
  autoWidth: false,   // NON calcola larghezza colonne
  scrollX: false,     // disabilita overflow orizzontale automatico
  responsive: true    // mantiene reattività

});


  $('#main-table').on('click', 'tbody tr', function () {
    const data = table.row(this).data();
     const layer = parcelLayers[data._id];
  if (!layer) return;
 //   layer.setStyle({ weight: 4, fillOpacity: 0.6 });
if (layer.getBounds) map.fitBounds(layer.getBounds(), { padding: [30,30] });
        // Salva stile originale
  const originalStyle = {
    weight: layer.options.style?.weight || 2,
    fillOpacity: layer.options.style?.fillOpacity || 0.2
  };

  // Evidenzia temporaneamente
  layer.setStyle({ weight: 4, fillOpacity: 0.6 });

  // Torna allo stile originale dopo 2 secondi
  setTimeout(() => {
    layer.setStyle(originalStyle);
  }, 4000);
console.log("DATI RIGA:", data);
  });

/*
  // Popoliamo il select categorie dinamicamente
const categories = [...new Set(dtParcelles.map(p => p.category))];
categories.forEach(cat => {
  $("#filter-category").append(`<option value="${cat}">${cat}</option>`);
});
*/


// ==========================
// Hover sulla tabella → evidenzia sulla mappa
// ==========================
let lastHighlighted = null;
let clickHighlightTimeout = null;

// Hover sulla tabella → evidenzia
$('#main-table').on('mouseenter', 'tbody tr', function () {
  if (clickHighlightTimeout) return; // ignoriamo hover durante highlight click

  const data = table.row(this).data();
  if (!data) return;
  const layer = parcelLayers[data._id];
  if (!layer) return;

  if (lastHighlighted && lastHighlighted !== layer) {
    lastHighlighted.setStyle({ weight: 2, fillOpacity: 0.2 });
  }

  layer.setStyle({ weight: 4, fillOpacity: 0.6 });
  lastHighlighted = layer;
});

$('#main-table').on('mouseleave', 'tbody tr', function () {
  if (clickHighlightTimeout) return; // ignoriamo hover durante highlight click

  const data = table.row(this).data();
  if (!data) return;
  const layer = parcelLayers[data._id];
  if (!layer) return;

  layer.setStyle({ weight: 2, fillOpacity: 0.2 });
  lastHighlighted = null;
});
// ==========================
// Click sulla tabella → zoom sulla parcella
// ==========================

// Click sulla tabella → zoom + highlight temporaneo 4 secondi
$('#main-table').on('click', 'tbody tr', function () {
  const data = table.row(this).data();
  const layer = parcelLayers[data._id];
  if (!layer) return;

  if (layer.getBounds) map.fitBounds(layer.getBounds(), { padding: [30,30] });

  // Disabilita hover durante highlight click
  if (clickHighlightTimeout) clearTimeout(clickHighlightTimeout);

  const originalStyle = { weight: layer.options.style?.weight || 2, fillOpacity: layer.options.style?.fillOpacity || 0.2 };

  layer.setStyle({ weight: 4, fillOpacity: 0.6 });
  clickHighlightTimeout = setTimeout(() => {
    layer.setStyle(originalStyle);
    clickHighlightTimeout = null;
  }, 4000);

  console.log("DATI RIGA:", data);
});

setTimeout(() => {
  map.invalidateSize();
  updateMap(dtParcelles);          // aggiorna mappa con tutte le parcelle
  updateInsightPanel(dtParcelles); // aggiorna panel con le statistiche
}, 200);
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
   updateInsightPanel(filteredData); // ✅ aggiorna panel statistico
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
   