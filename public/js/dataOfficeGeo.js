// js/dataOfficeGeo.js
document.addEventListener("DOMContentLoaded", function () {
  let map;
  let layerGroup;
  let drawnItems;

  const points = window.POINTS || [];
  const fieldUsers = window.FIELD_USERS || [];
    const list = document.getElementById("category-list");
    const addBtn = document.getElementById("add-category");
// Popola le categorie esistenti
if (window.CATEGORIES && list) {
  window.CATEGORIES.forEach((c, i) => {
    const row = createCategoryRow(c, i);
    list.appendChild(row);
  });
}

  // ========================
  // Colori categorie GLOBALI
  // ========================
  const defaultColors = ["red","green","orange","yellow","violet","black","grey","blue"];
  const colorMap = {};
  const colorIndexRef = { index: 0 };

function createCategoryRow(category, index) {
  const row = document.createElement('div');
  row.className = 'flex items-center gap-2 category-row w-full';
  row.innerHTML = `
  
    <input type="text" name="categories[${index}][name]" value="${category?.name || ''}" 
           class="input input-bordered flex-1 min-w-0" placeholder="Nome categoria">
    <input type="text" name="categories[${index}][customEmoji]" value="${category?.icon || ''}" 
           placeholder="😊 Emoji" class="input input-bordered w-14 text-center emoji-input">
    
    <button type="button" class="btn btn-error btn-sm remove-category">✖</button>
  `;
  return row;
}

  // ========================
  // Gestione form categorie dinamiche
  // ========================
  // Aggiungi listener delegato sul container
if (list) {
      list.addEventListener('click', (e) => {

        const input = e.target.closest('.emoji-input');
        if (!input) return;

        e.stopPropagation();
        activeEmojiInput = input;

      const rect = input.getBoundingClientRect();

        quickPicker.style.top = `${rect.bottom + window.scrollY}px`;
        quickPicker.style.left = `${rect.left + window.scrollX}px`;
        quickPicker.style.display = 'block';
         });
}

if (addBtn && list) {
 addBtn.addEventListener("click", () => {
  const index = list.children.length;
  const row = createCategoryRow(null, index);
  list.appendChild(row);
});

}
// ========================
// 🧩 Emoji Picker (delegato, globale)
// ========================
let emojiPicker = null;
let quickPicker = null;
let activeEmojiInput = null;
// 👇 AGGIUNGI QUI
const quickEmojis = ["📍","🔥","💡","🗑️","⚠️","🚧","🌳","🐕","🏠","💧","⏰"];
if (list) {
  // crea UNA SOLA volta il picker
  emojiPicker = document.createElement('emoji-picker');
  emojiPicker.style.position = 'absolute';
  emojiPicker.style.zIndex = '1000';
  emojiPicker.style.display = 'none';
  document.body.appendChild(emojiPicker);
  // ========================
// Mini quick emoji picker
// ========================
quickPicker = document.createElement("div");
quickPicker.style.position = "absolute";
quickPicker.style.background = "white";
quickPicker.style.border = "1px solid #ddd";
quickPicker.style.padding = "6px";
quickPicker.style.display = "none";
quickPicker.style.zIndex = "1001";

quickEmojis.forEach(e => {
  const span = document.createElement("span");
  span.textContent = e;
  span.style.fontSize = "22px";
  span.style.cursor = "pointer";
  span.style.margin = "4px";

  span.addEventListener("click", () => {
    if (activeEmojiInput) activeEmojiInput.value = e;
    quickPicker.style.display = "none";
  });

  quickPicker.appendChild(span);
});

document.body.appendChild(quickPicker);

  // click su bottone 😄 (delegato)
  list.addEventListener('click', (e) => {
    const btn = e.target.closest('.emoji-picker-btn');
    if (!btn) return;

    e.stopPropagation();

    activeEmojiInput = btn.previousElementSibling; // input customEmoji
    if (!activeEmojiInput) return;

    const rect = btn.getBoundingClientRect();
    emojiPicker.style.top = `${rect.bottom + window.scrollY}px`;
    emojiPicker.style.left = `${rect.left + window.scrollX}px`;
    emojiPicker.style.display = 'block';
  });

  // selezione emoji
  emojiPicker.addEventListener('emoji-click', (e) => {
    if (activeEmojiInput) {
      activeEmojiInput.value = e.detail.unicode;
    }
    emojiPicker.style.display = 'none';
  });

  // chiudi cliccando fuori
  document.addEventListener('click', () => {
    emojiPicker.style.display = 'none';
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
 function getIconEmoji(point) {
  // 1️⃣ se il punto ha già un'emoji → usala
  if (point.icon && point.icon.trim() !== "") {
    return point.icon;
  }

  // 2️⃣ fallback sulle categorie (vecchi punti)
  const cat = (window.CATEGORIES || []).find(
    c => c.name.toUpperCase() === point.category.toUpperCase()
  );

  if (cat && cat.icon) {
    return cat.icon;
  }

  // 3️⃣ fallback finale
  return "🔴";
}

  function updateMap(filterCategory = "", filterDate = "") {
    console.log("updateMap triggered");
    if (!layerGroup || !drawnItems) return;
    layerGroup.clearLayers();
    drawnItems.clearLayers();

     const categories = (window.CATEGORIES || []).map(c => c.name);   // if (!data.length) return;
    // Filtra i punti in base alla categoria selezionata
  const data = (points || []).filter(p => p.coordinates && p.coordinates.length === 2)
                             .filter(p => categories.includes(p.category))
                             .filter(p => !filterCategory || p.category === filterCategory)
                             .filter(p => {
                              if (!filterDate) return true;
                              return p.createdAtISO && p.createdAtISO.startsWith(filterDate);
                            });
  if (!data.length) return;

    const markers = [];

    data.forEach((point) => {
      const category = point.category;
      const iconEmoji = getIconEmoji(point);

      const geoJson = {
        type: "Feature",
        geometry: { type: "Point", coordinates: point.coordinates },
        properties: { name: point.name || "Senza nome", category, icon: iconEmoji , description: point.description},
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
          Categoria: ${geoJson.properties.category || "Sans categoria"}<br>
          Description: ${geoJson.properties.description || "Sans description"}<br>
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
    name: (c.name || '').trim(),
   icon: (c.customEmoji  && c.customEmoji.trim() !== '') ? c.customEmoji.trim() : '⚠️'
  };

  });
  console.log("📤 Payload da inviare al server:");
payload.forEach((c, i) => console.log(`- ${i+1}: ${c.name} → ${c.icon}`));

  window.CATEGORIES = payload; // ✅ aggiorni la variabile globale
  console.log("📤 Invio categorie al server:", payload);
      try {
        const response = await fetch("/update-categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include', // ← QUESTA riga è la chiave 🔑
          body: JSON.stringify({ categories: payload }), // invia payload, non categories grezzo
        });
        const result = await response.json();
        if (result.success) {
            // 1️⃣ aggiorna la variabile globale
          window.CATEGORIES = result.categories;
          console.log("🆕 CATEGORIES aggiornate:", window.CATEGORIES);
              // Redirect corretto
          // Mostra conferma al responsabile
        let msg = "✅ Catégorie mises à jour!:\n";
        result.categories.forEach((c, i) => {
          msg += `${i+1}: ${c.name} → ${c.icon}\n`;
        });
        alert(msg);

  // 2️⃣ aggiorna il form nel DOM
 const listDiv = document.getElementById('category-list');
listDiv.innerHTML = ''; // reset
window.CATEGORIES.forEach((c, i) => {
  const row = createCategoryRow(c, i); // ✅ usa la funzione
  listDiv.appendChild(row);
});
          updateMap();
         // alert("Categorie aggiornate con successo!");
          console.log("📥 Risposta server:", result);
          
  // 📝 LOG chiaro delle categorie registrate
  console.log("🎉 Categorie registrate con successo:");
           window.CATEGORIES.forEach((c, i) => {
    console.log(`- ${i + 1}: ${c.name} → Emoji: ${c.icon}`);
  });
        } else {
          //alert("Errore aggiornamento categorie.");
        }
      } catch (err) {
        console.error("❌ Errore durante update-categories:", err);
       // alert("Errore di connessione al server.");
      }
    });
  }

      // ========================
// 🧩 Emoji Picker Element
// ========================
/*
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
*/

  // ========================
  // DataTables e filtri
  // ========================
  const dtPoints = points.map((p) => ({
    name: p.name,
    category: p.category,
    createdAtFormatted: p.createdAtFormatted,
    createdAtISO: p.createdAtISO,
    userEmail: p.userEmail,
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
      { data: "userEmail", visible: false } // 👈 colonna tecnica
    ],
    rowGroup: {
    dataSrc: "userEmail",
    startRender: function (rows, group) {
      return `${group} (${rows.count()} punti)`;
    }
  },

  order: [[4, "asc"], [1, "asc"]]
  });
// ========================
// Filtro combinato categoria + data (solo filtro custom)
// ========================
$.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
  const filterCategory = $('#filter-category').val();
  const filterDate = $('#filter-date').val();

  const category = data[1];        // colonna Categorie
  const createdAtISO = data[3];    // colonna invisibile createdAtISO

  const categoryMatch = !filterCategory || category === filterCategory;
  const dateMatch = !filterDate || (createdAtISO && createdAtISO.startsWith(filterDate));

  return categoryMatch && dateMatch;
});

// ========================
// Popola il filtro categoria con le categorie effettivamente usate
// ========================
const usedCategories = [...new Set(points.map(p => p.category).filter(c => c))];

const filterSelect = $("#filter-category");
filterSelect.empty(); // Rimuove eventuali opzioni precedenti
filterSelect.append(`<option value="">Tutte le categorie</option>`);

usedCategories.forEach(catName => {
  filterSelect.append(`<option value="${catName}">${catName}</option>`);
});

// ========================
// Trigger draw quando cambia search globale
// ========================
$('#main-table_filter input').on('input', function() {
  table.draw(); // aggiorna anche filtro custom
});

// ========================
// Trigger draw quando cambiano categoria o data
// ========================
$("#filter-category, #filter-date").on("change", function () {
  
  // svuota la ricerca globale SENZA triggerare input
  table.search('');

  const filterCategory = $("#filter-category").val();
  const filterDate = $("#filter-date").val();
  
   table.draw(); // trigger filtro custom
  updateMap(filterCategory, filterDate); // aggiorna la mappa
 
});


});
