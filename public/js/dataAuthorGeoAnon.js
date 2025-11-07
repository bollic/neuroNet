// /public/js/dataAuthorGeoAnon.js
document.addEventListener("DOMContentLoaded", function () {
  console.log("🚀 dataAuthorGeoAnon.js loaded");

  let map;
  let layerGroup;
  let addedMarkers = [];
  const becomeMemberBtn = document.getElementById("becomeMemberBtn");

  // ==========================
  // 1. Inizializza la mappa
  // ==========================
  function initializeMap() {
    map = L.map("map", { center: [43.2, 1.3], zoom: 8 });
    layerGroup = L.featureGroup().addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    console.log("🗺️ Mappa inizializzata");
  }

  // ==========================
  // 2. Mostra eventuali punti già presenti
  // ==========================
  function showExistingPoints() {
    if (!Array.isArray(points)) return;
    points.forEach((p) => {
      if (p.coordinates && p.coordinates.length === 2) {
        L.marker([p.coordinates[1], p.coordinates[0]]).addTo(layerGroup);
      }
    });
    console.log(`📍 ${points.length} punti caricati dal server`);
  }

  // ==========================
  // 3. Gestione click → aggiunge fino a 3 punti
  // ==========================
  function setupClickHandler() {
    map.on("click", async function (e) {
      if (addedMarkers.length >= 3) {
        alert("Vous avez déjà ajouté 3 points !");
        return;
      }

      const { lat, lng } = e.latlng;

      const marker = L.marker([lat, lng]).addTo(layerGroup);
      addedMarkers.push(marker);

      console.log(`🆕 Point ${addedMarkers.length} added:`, { lat, lng });
        // costruisci un GeoJSON valido per il backend
  const point = {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [lng, lat],
    },
  };
      try {
         const res = await fetch("/addPointAnon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Point ${addedMarkers.length}`,
        category: "A",
        point, // 👈 GeoJSON
      }),
        });

        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        console.log("✅ Point saved:", data);
      } catch (err) {
        console.error("❌ Errore salvataggio punto:", err);
      }

      // abilita il pulsante dopo 3 punti
      if (addedMarkers.length === 3 && becomeMemberBtn) {
        becomeMemberBtn.removeAttribute("disabled");
        becomeMemberBtn.classList.add("btn-success");
        becomeMemberBtn.innerHTML = "🚀 Prêt à devenir membre !";
      }
    });
  }

  // ==========================
  // 4. Avvia tutto
  // ==========================
  initializeMap();
  showExistingPoints();
  setupClickHandler();

  // Delay per ridimensionamento mappa (utile quando caricata dentro layout)
  setTimeout(() => map.invalidateSize(), 400);

  console.log("✅ dataAuthorGeoAnon.js ready");
});
