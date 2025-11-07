// dataAuthorGeo.js
document.addEventListener("DOMContentLoaded", function() { 


    // -------------------
    // VARIABILI GLOBALI MAPPA
    // -------------------
    let map; 
    let layerGroup;  
    let drawnItems; 
    let userUsedGeolocation = false; // 👈 variabile globale
 
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

    // Controlla se siamo arrivati da onboarding
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") === "true") {
        showToast("🎉 Bienvenue ! Tu es maintenant membre et tes points ont été sauvegardés.");
    }

    // -------------------
    // FUNZIONE INIZIALIZZA MAPPA
    // -------------------
    function initializeMap() {
        map = L.map("map", { center: [43.2, 1.30], zoom: 10 });       
        layerGroup = L.featureGroup().addTo(map);  
        drawnItems = L.featureGroup().addTo(map);  

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { 
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        var drawControl = new L.Control.Draw({
            edit: { featureGroup: drawnItems, edit: true, remove: false },
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
                            body: JSON.stringify({ lat, lng, newCoordinates: [lat, lng] })
                        });                  
                        const data = await response.json();
                        if (data.success) { console.log("✅ Punto aggiornato"); }
                    } catch (error) {
                        console.error('Errore salvataggio:', error);
                    }
                }
            });
        });
        // ✅ Qui garantiamo che map esista
    setTimeout(() => map.invalidateSize(), 500);
        // 📍 Pulsante “Usa la mia posizione”
const locationButton = document.getElementById("use-my-location");
if (locationButton) {
  locationButton.addEventListener("click", function () {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          console.log("📍 Geolocalizzazione:", lat, lng);

          // Centra la mappa sulla posizione trovata
          map.setView([lat, lng], 14);
            userUsedGeolocation = true; // ✅ segna che la posizione manuale è stata impostata
            console.log("📍 userUsedGeolocation (dopo click):", userUsedGeolocation);
          // Crea marker
         L.marker([lat, lng])
            .addTo(map)
            .bindPopup("📍 Tu es ici")
            .openPopup();

        },
        function (err) {
          alert("Erreur de géolocalisation : " + err.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 10000
        }
      );
    } else {
      alert("❌ Géolocalisation non supportée par le navigateur.");
    }
  });
}  // <-- chiude if(locationButton)
}  // <-- chiude la funzione initializeMap()

// Aggiorna mappa + tabella quando cambio lo switch
const toggleGroupPoints = document.getElementById("toggleGroupPoints");
// Legge il valore iniziale dello switch

if (toggleGroupPoints) {
    toggleGroupPoints.addEventListener("change", () => {
        updateMap();   // aggiorna i marker sulla mappa
        updateTable(); // aggiorna la tabella
    });
}

    // -------------------
    // FUNZIONE AGGIORNA MAPPA
    // -------------------
    function updateMap() {
        console.log("🗺️ updateMap chiamata — userUsedGeolocation:", userUsedGeolocation);

            if (!layerGroup || !drawnItems || !points) return;

        layerGroup.clearLayers();
        drawnItems.clearLayers();

        const markers = [];
    
        // Controlla se l’utente vuole vedere anche i punti del gruppo
    const showGroupPoints = document.getElementById("toggleGroupPoints")?.checked ?? true;
        
        points.forEach(point => {
          if (!point.coordinates || point.coordinates.length !== 2) return;
        if (!point.user || !point.user._id) return;

        //const isMyPoint = point.user._id === currentUserId;
            const isMyPoint = String(point.user._id) === String(currentUserId);

        // Se l’utente NON vuole vedere i punti del gruppo → mostra solo i suoi
        if (!showGroupPoints && !isMyPoint) return;

        const iconEmoji = getIconForCategory(point.category) || '🔴';
        const userLabel = isMyPoint ? '(Tu)' : (point.user?.email ? point.user.email : '');

        const marker = L.marker([point.coordinates[1], point.coordinates[0]], {
            icon: new L.divIcon({
                html: `<div style="font-size:26px; width:30px; height:30px; display:flex; align-items:center; justify-content:center;">${iconEmoji}</div>`,
                className: '',
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            }),
            className: ''
        }).bindPopup(`
            <div style="min-width:180px;">
                <strong>${point.name || 'Senza nome'}</strong><br>
                Categoria: ${point.category || 'Senza categoria'}<br>
                Creato da: ${userLabel}<br>
                Lat: ${point.coordinates[1].toFixed(5)}, Lng: ${point.coordinates[0].toFixed(5)}
                ${point.image ? `<br><img src="${point.image}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">` : ''}
            </div>
        `).addTo(drawnItems);

        markers.push(marker);
    });
            // Centra la mappa sui marker, ma solo se l’utente NON ha appena usato la geolocalizzazione
            if (!userUsedGeolocation) {
                if (markers.length === 1) {
                    map.setView(markers[0].getLatLng(), 14);
                } else if (markers.length > 1) {
                    map.fitBounds(L.latLngBounds(markers.map(m => m.getLatLng())), { padding: [30, 30] });
                }
            }

    }
    // -------------------
// AGGIORNA LA TABELLA IN BASE AL TOGGLE
// -------------------
function updateTable() {
    if (!points || !currentUserId) return;

    const dt = $('#main-table').DataTable();
    dt.clear();
     const showGroupPoints = document.getElementById("toggleGroupPoints")?.checked ?? true;

    points.forEach(point => {
        if (!point.user || !point.user._id) return;

        const isMine = String(point.user._id).trim() === String(currentUserId).trim();
         // 👇 Se switch OFF → mostra solo i miei punti
        if (!showGroupPoints && !isMine) return;

        const icon = getIconForCategory(point.category) || '🔴';
        const name = point.name || 'Senza nome';
        //const category = point.category || 'Senza categoria';
        const actionCell = isMine
            ? `<a href="/delete/${point._id}" class="btn btn-xs btn-error"><i class="fas fa-trash"></i></a>`
            : `<span class="text-gray-400 text-xs italic">—</span>`;

        dt.row.add([icon, name, actionCell]);
    });

    dt.draw();
}
   // -------------------
// CARICAMENTO CATEGORIE E MAPPA
// -------------------
loadCategories().then(() => {
    if (!map) initializeMap();
    updateMap();
     updateTable(); // <-- aggiungi questa riga
    // ❌ NON chiamiamo updateTable qui,
    // così la tabella iniziale EJS resta intatta con i pulsanti Delete.

    setTimeout(() => map.invalidateSize(), 100);
});


    // -------------------
    // DAISYUI DRAWER RESIZE
    // -------------------
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
  // -------------------
    // DATATABLES
    // -------------------

const table = $('#main-table').DataTable({
  pageLength: 20,
  scrollX: true,
  autoWidth: false,
  responsive: false,
  columnDefs: [
    { targets: 0, width: "40px" },   // Catégorie
    { targets: 1, width: "60px" },  // Nom (ridotta)
    { targets: 2, width: "40px", className: "text-center" } // Action
  ],
  language: {
    url: 'https://cdn.datatables.net/plug-ins/1.11.5/i18n/fr-FR.json'
  }
});

// 🔧 Riaggiusta colonne quando apri/chiudi il drawer
document.getElementById('my-drawer')?.addEventListener('change', () => {
  setTimeout(() => table.columns.adjust().draw(), 300);
});



/*
    // 🔧 Forza il ridimensionamento dopo il draw
table.on('draw', function() {
  table.columns.adjust();
});
*/

    $('#page-length').on('change', function() {
        table.page.len($(this).val()).draw();
    });

    table.on('length.dt', function(e, settings, len) {
        $('#page-length').val(len);
    });

    console.log("DataTables inizializzato:", table);
    console.log("Elementi nella tabella:", table.rows().count());

});
