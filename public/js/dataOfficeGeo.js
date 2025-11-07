// js/dataOfficeGeo.js
document.addEventListener("DOMContentLoaded", function () {
  let map;
  let layerGroup;
  let drawnItems;

  const points = window.POINTS || [];
  const fieldUsers = window.FIELD_USERS || [];
  const list = document.getElementById("category-list");
const addBtn = document.getElementById("add-category");

  // ========================
  // Colori categorie GLOBALI
  // ========================
  const defaultColors = ["red","green","orange","yellow","violet","black","grey","blue"];
  const colorMap = {};
  const colorIndexRef = { index: 0 };

  // ========================
  // Gestione form categorie dinamiche
  // ========================
  // Aggiungi listener delegato sul container
if (list) {
  list.addEventListener("click", function(e) {
    if (e.target && e.target.classList.contains("remove-category")) {
      const row = e.target.closest(".category-row");
      if (row) row.remove();
    }
  });
}

if (addBtn && list) {
  addBtn.addEventListener("click", () => {
    const index = list.children.length;
    const row = document.createElement("div");
    row.className = "flex items-center gap-2 category-row";
    row.innerHTML = `
      <input type="text" name="categories[${index}][name]" class="input input-bordered w-1/2" placeholder="Nome categoria">
      <select name="categories[${index}][icon]" class="select select-bordered w-1/4">
        <option value="red">🔴 Rosso</option>
        <option value="truck">🚚 Camion</option>
        <option value="home">🏠 Casa</option>
         <option value="custom">✨ Emoji libera</option>
      </select>
       <input 
    type="text" 
    name="categories[${index}][customEmoji]" 
    placeholder="😊 Emoji" 
    class="input input-bordered w-1/4 text-center"
  />
      <button type="button" class="btn btn-error btn-sm remove-category">✖</button>
    `;
    list.appendChild(row);
  });
}

  // ========================
  // Funzioni mappa
  // ========================
  function initializeMap() {
    if (!window.L) {
      console.error("Leaflet non caricato");
      return;
    }
    map = L.map("map", { center: [43.2, 1.3], zoom: 10 });
    layerGroup = L.featureGroup().addTo(map);
    drawnItems = L.featureGroup().addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const drawControl = new L.Control.Draw({
      edit: { featureGroup: drawnItems, edit: true, remove: false },
      draw: false,
    });
    map.addControl(drawControl);
  }
  function getIconEmoji(categoryName) {
  const cat = (window.CATEGORIES || []).find(c => c.name === categoryName);
  if (!cat) {
    console.warn("Categoria non trovata:", categoryName);
    return "🔴";
  }
  switch (cat.icon) {
    case "truck": return "🚚";
    case "home": return "🏠";
    case "red": return "🔴";
    case "custom": return cat.customEmoji || "✨";
    default: return cat.icon || "🔴";
  }
}

 // ========================
  // Emoji icone per categoria
  // ========================
 /* function getIconEmoji(categoryName) {
  const cat = (window.CATEGORIES || []).find(c => c.name === categoryName);
  if (!cat) {
    console.warn("Categoria non trovata:", categoryName);
    return "🔴";
  }
  switch (cat.icon) {
    case "truck": return "🚚";
    case "home": return "🏠";
    case "red": return "🔴";
    case "custom": return cat.customEmoji || "✨";
    default: return cat.icon || "🔴";
  }
}
*/

  function updateMap(filterCategory = "", filterDate = "") {
    console.log("updateMap triggered");
    if (!layerGroup || !drawnItems) return;
    layerGroup.clearLayers();
    drawnItems.clearLayers();

   // const data = (points || []).filter(p => p.coordinates && p.coordinates.length === 2);
   // if (!data.length) return;
    // Filtra i punti in base alla categoria selezionata
  const data = (points || []).filter(p => p.coordinates && p.coordinates.length === 2)
                             .filter(p => !filterCategory || p.category === filterCategory)
                             .filter(p => {
                              if (!filterDate) return true;
                              return p.createdAtISO && p.createdAtISO.startsWith(filterDate);
                            });
  if (!data.length) return;

    const markers = [];

    data.forEach((point) => {
      const category = point.category;
      const iconEmoji = getIconEmoji(category);

      const geoJson = {
        type: "Feature",
        geometry: { type: "Point", coordinates: point.coordinates },
        properties: { name: point.name || "Senza nome", category, icon: iconEmoji },
      };

      const geoLayer = L.geoJSON(geoJson, {
        pointToLayer: function (feature, latlng) {
          const markerIcon = new L.divIcon({
            html: `<div style="font-size:24px">${feature.properties.icon}</div>`,
            className: "",
          });
          return L.marker(latlng, { icon: markerIcon });
        },
      }).bindPopup(`
        <div style="min-width:180px">
          <strong>${geoJson.properties.name}</strong><br>
          Categoria: ${geoJson.properties.category || "Senza categoria"}<br>
          Lat: ${point.coordinates[1].toFixed(5)}, Lng: ${point.coordinates[0].toFixed(5)}
        </div>
      `).addTo(drawnItems);

      geoLayer.eachLayer((m) => markers.push(m));
    });

    if (markers.length === 1) {
      map.setView(markers[0].getLatLng(), 12);
    } else if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map(m => m.getLatLng()));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }

  // ========================
  // Inizializzazione mappa
  // ========================
  initializeMap();
  setTimeout(() => {
    map.invalidateSize();
    updateMap();
  }, 200);

  // ===============================
  // 🔄 AGGIORNA categorie (submit)
  // ===============================
  const form = document.getElementById("categories-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const entries = Array.from(formData.entries());
      const categories = [];

      for (let [key, value] of entries) {
        const match = key.match(/categories\[(\d+)\]\[(\w+)\]/);
        if (match) {
          const index = parseInt(match[1]);
          const field = match[2];
          categories[index] = categories[index] || {};
          categories[index][field] = value;
        }
      }

      console.log("📤 Invio categorie:", categories);
      console.log("📤 Invio categorie al server:", JSON.stringify(categories, null, 2));
       // 🔹 Punto A: prepara i dati finali da inviare
  const payload = categories.map(c => {
    let finalIcon = c.icon;
    if (c.icon === 'custom' && c.customEmoji && c.customEmoji.trim() !== '') {
      finalIcon = c.customEmoji.trim();
    }
    return {
      name: c.name.trim(),
      icon: finalIcon
    };
  });
  window.CATEGORIES = payload; // ✅ aggiorni la variabile globale
  console.log("📤 Invio categorie al server:", payload);
      try {
        const response = await fetch("/update-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categories: payload }), // invia payload, non categories grezzo
        });
        const result = await response.json();
        if (result.success) {
            // 1️⃣ aggiorna la variabile globale
          window.CATEGORIES = result.categories;
          console.log("🆕 CATEGORIES aggiornate:", window.CATEGORIES);
          
  // 2️⃣ aggiorna il form nel DOM
  const listDiv = document.getElementById('category-list');
  listDiv.innerHTML = ''; // reset
  window.CATEGORIES.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 category-row';

    // determina l'icona effettiva
  let selectedRed = c.icon === 'red' ? 'selected' : '';
  let selectedTruck = c.icon === 'truck' ? 'selected' : '';
  let selectedHome = c.icon === 'home' ? 'selected' : '';
  let selectedCustom = !['red','truck','home'].includes(c.icon) ? 'selected' : '';
    
  row.innerHTML = `
    <input type="text" name="categories[${i}][name]" value="${c.name}" class="input input-bordered w-1/2" placeholder="Nome categoria">
    <select name="categories[${i}][icon]" class="select select-bordered w-1/3">
      <option value="red" ${selectedRed}>🔴 Rosso</option>
      <option value="truck" ${selectedTruck}>🚚 Camion</option>
      <option value="home" ${selectedHome}>🏠 Casa</option>
      <option value="custom" ${selectedCustom}>✨ Emoji libera</option>
    </select>
    <input type="text" name="categories[${i}][customEmoji]" value="${!['red','truck','home'].includes(c.icon) ? c.icon : ''}" placeholder="😊 incolla qui emoji" class="input input-bordered w-1/4 text-center custom-emoji-input">
    <button type="button" class="btn btn-error btn-sm remove-category">✖</button>
  `;
  listDiv.appendChild(row);
});
          updateMap();
          alert("Categorie aggiornate con successo!");
          console.log("📥 Risposta server:", result);

        } else {
          alert("Errore aggiornamento categorie.");
        }
      } catch (err) {
        console.error("❌ Errore durante update-categories:", err);
        alert("Errore di connessione al server.");
      }
    });
  }

      // ========================
// 🧩 Emoji Picker Element
// ========================
document.querySelectorAll('.emoji-picker-btn').forEach(btn => {
  const input = btn.previousElementSibling; // campo customEmoji
  const picker = document.createElement('emoji-picker');

  picker.style.position = 'absolute';
  picker.style.zIndex = '1000';
  picker.style.display = 'none';

  document.body.appendChild(picker);

  btn.addEventListener('click', (e) => {
    e.stopPropagation(); // evita chiusura immediata
    picker.style.display = 'block';
    const rect = btn.getBoundingClientRect();
    picker.style.top = `${rect.bottom + window.scrollY}px`;
    picker.style.left = `${rect.left + window.scrollX}px`;
  });

  picker.addEventListener('emoji-click', e => {
    input.value = e.detail.unicode; // inserisce l’emoji
    picker.style.display = 'none';
  });

  // chiudi se clic fuori
  document.addEventListener('click', e => {
    if (!picker.contains(e.target) && e.target !== btn) {
      picker.style.display = 'none';
    }
  });
});

  // ========================
  // DataTables e filtri
  // ========================
  const dtPoints = points.map((p) => ({
    name: p.name,
    category: p.category,
    createdAtFormatted: p.createdAtFormatted,
    createdAtISO: p.createdAtISO,
    userEmail: p.userEmail || "❓utente sconosciuto",
    userId: p.userId || null,
    _id: p._id,
  }));

  const table = $("#main-table").DataTable({
    data: dtPoints,
    columns: [
      { data: 'name', title: 'Name' },
      { data: 'category', title: 'Categorie' },
      { data: 'createdAtFormatted', title: 'Date' },
      { data: 'createdAtISO', visible: false },
    ],
    order: [[1, 'asc']],
  });


// 🔹 Popola il filtro con le categorie effettivamente usate nei punti
const usedCategories = [...new Set(points.map(p => p.category).filter(c => c))];

const filterSelect = $("#filter-category");
filterSelect.empty(); // Rimuove eventuali opzioni precedenti
filterSelect.append(`<option value="">Tutte le categorie</option>`);

usedCategories.forEach(catName => {
  filterSelect.append(`<option value="${catName}">${catName}</option>`);
});

$("#filter-category, #filter-date").on("change", function () {
  const filterCategory = $("#filter-category").val();
  const filterDate = $("#filter-date").val();
  updateMap(filterCategory, filterDate);
});

});
