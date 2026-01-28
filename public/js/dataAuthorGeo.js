// dataAuthorGeo.js
import { loadCategories } from "./mapCommon.js";
import { initializeMap, map } from "./mapCore.js";
import { updateMap, updateTable, setUpdateMapDeps } from "./pointUtils.js";
const points = window.points || [];
const currentUserId = window.currentUserId;


async function loadPointsFromApi() {
  const res = await fetch('/api/points');
  const data = await res.json();

  console.log("📡 Points caricati dalla API:", data.length, data);

  return data;
}

// 🔥 LOG DI TEST
console.log("🔥 FILE CARICATO");
let table;
document.addEventListener("DOMContentLoaded", async function() { 
      console.log("🤖 DOM CONTENT LOADED callback ESEGUITA");
  table = $('#main-table').DataTable({
  pageLength: 20,
  scrollX: true,
  autoWidth: false,
  responsive: false,
  columnDefs: [
    { targets: 0, width: "30px" },
    { targets: 1, width: "40px" },
    { targets: 2, width: "40px", className: "text-center", orderable: false },
    { targets: 3, width: "40px", className: "text-center", orderable: false },
        { targets: 4, width: "40px", className: "text-center", orderable: false }
  ],
  language: {
    url: 'https://cdn.datatables.net/plug-ins/1.11.5/i18n/fr-FR.json'
  }
});

    // ⬇️⬇️⬇️ SOLO QUI ⬇️⬇️⬇️
  $('#main-table tbody').on('submit', '.delete-point-form', function (e) {
    const btn = this.querySelector('button');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '⏳';
    }
  });

    // 1️⃣ Carica le categorie
    await loadCategories();

    // -------------------
    // 2️⃣ Inizializza la mappa
    const res = initializeMap();
    let map = res.map;
    let pointsLayer = res.pointsLayer;
    let parcellesLayer = res.parcellesLayer;        
    let layerGroup = res.layerGroup;
    let drawnItems = res.drawnItems;
    let markersMap = {};
    let userUsedGeolocation = false;

    // -------------------
    // 3️⃣ Carica i punti dall’API
    const apiPoints = await loadPointsFromApi();
    points.length = 0;
    points.push(...apiPoints);

    console.log("🧪 points dopo API:", points);

    // -------------------
    // 4️⃣ Passa le dipendenze a pointUtils
    setUpdateMapDeps({
        map,
        points,
        currentUserId,
        pointsLayer,
        parcellesLayer,
        layerGroup,
        drawnItems,
        markersMap,
        highlightTableRow,
        userUsedGeolocation
    });

    // -------------------
    // 5️⃣ Aggiorna mappa e tabella
    updateMap();
    updateTable();
    

    // 🔄 Aggiorna le categorie all’avvio
    // 🔧 Funzione per ottenere l'icona associata a una categoria
    // Controlla se siamo arrivati da onboarding
    const params = new URLSearchParams(window.location.search);
    if (params.get("welcome") === "true") {
        showToast("🎉 Bienvenue ! Tu es maintenant membre et tes points ont été sauvegardés.");
    }
    // -------------------
    // FUNZIONE INIZIALIZZA MAPPA
 // <-- chiude if(locationButton)
// Aggiorna mappa + tabella quando cambio lo switch
const toggleGroupPoints = document.getElementById("toggleGroupPoints");

if (toggleGroupPoints) {
    toggleGroupPoints.addEventListener("change", () => {
        console.log("🔄 toggle cambiato — showGroupPoints:", toggleGroupPoints.checked);
        updateMap();   // la funzione interna fa già il filtraggio
        updateTable(); // idem per la tabella
    });
}

function highlightTableRow(pointId) {
     // 👉 Apri automaticamente il drawer se è chiuso
    const drawerToggle = document.getElementById("my-drawer");
    if (drawerToggle && !drawerToggle.checked) {
        drawerToggle.checked = true;
        setTimeout(() => map.invalidateSize(), 300);
    }
    // Rimuove evidenziazione da tutte le righe
    $('#main-table tbody tr').removeClass('highlight-row');
    // Trova la riga corrispondente
    const row = $(`#main-table tbody tr[data-point-id='${pointId}']`);
    // Se esiste, evidenziale e scrolla fino a lei
    if (row.length > 0) {
        row.addClass('highlight-row');
        // Scroll automatico dentro la tabella
        const container = $('.dataTables_scrollBody');
        if (container.length) {
            container.animate({
                scrollTop: row.position().top + container.scrollTop() - 100
            }, 300);
        }
    }
}
    // -------------------
    // FUNZIONE AGGIORNA MAPPA
    // -------------------
    // -------------------
// AGGIORNA LA TABELLA IN BASE AL TOGGLE
// -------------------
  
    setTimeout(() => map.invalidateSize(), 100);
 // -------------------
    // DATATABLES
    // -------------------

// 🔧 Riaggiusta colonne quando apri/chiudi il drawer
document.getElementById('my-drawer')?.addEventListener('change', () => {
  setTimeout(() => table.columns.adjust().draw(), 300);
});
    $('#page-length').on('change', function() {
        table.page.len($(this).val()).draw();
    });
    table.on('length.dt', function(e, settings, len) {
        $('#page-length').val(len);
    });
    console.log("DataTables inizializzato:", table);
    console.log("Elementi nella tabella:", table.rows().count());

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
 
