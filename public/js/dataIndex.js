document.addEventListener("DOMContentLoaded", function () {
  let map, layerGroup, drawnItems;

  // Punti demo, visibili a tutti
  const demoPoints = [
    { name:"Point A", category:"Cat1", coordinates:[1.34,43.22], groupId:"G1" },
    { name:"Point B", category:"Cat2", coordinates:[1.36,43.24], groupId:"G1" },
    { name:"Point C", category:"Cat1", coordinates:[1.38,43.26], groupId:"G2" },
    { name:"Point D", category:"Cat3", coordinates:[1.40,43.28], groupId:"G3" }
  ];

  // Gruppi demo
  const demoGroups = [
    { groupId:"G1" }, { groupId:"G2" }, { groupId:"G3" }
  ];

  // Se il server ha fornito dati reali, li sovrascrive
  const points = (window.POINTS && window.POINTS.length) ? window.POINTS : demoPoints;
  const groupsPreview = (typeof window.GROUPS_PREVIEW !== 'undefined') ? window.GROUPS_PREVIEW : demoGroups;

  function initializeMap() {
    if (!window.L) {
      console.error("Leaflet non caricato: controlla i <script> nel layout/header.");
      return;
    }
    map = L.map("map", { center: [43.25,1.36], zoom: 12 });
    layerGroup = L.featureGroup().addTo(map);
    drawnItems = L.featureGroup().addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // fix bug "mappa invisibile al load"
    setTimeout(() => map.invalidateSize(), 300);
  }

  function updateMap() {
    layerGroup.clearLayers();
    drawnItems.clearLayers();
    const markers = [];

    points.forEach(point => {
      if (!point.coordinates || point.coordinates.length !== 2) return;

      const geoJson = {
        type: "Feature",
        geometry: { type: "Point", coordinates: point.coordinates },
        properties: { name: point.name, category: point.category }
      };

      const icon = new L.Icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-purple.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.4/images/marker-shadow.png",
        iconSize: [25,41],
        iconAnchor: [12,41],
        popupAnchor: [1,-34],
        shadowSize: [41,41],
      });

      L.geoJSON(geoJson, {
        pointToLayer: (f, latlng) => L.marker(latlng, {icon})
      }).bindPopup(`
        <strong>${geoJson.properties.name}</strong><br>
        Cat: ${geoJson.properties.category || "Senza categoria"}
      `).addTo(drawnItems)
      .eachLayer(m => markers.push(m));
    });

    if (markers.length === 1) map.setView(markers[0].getLatLng(),12);
    else if (markers.length>1) map.fitBounds(L.latLngBounds(markers.map(m=>m.getLatLng())),{padding:[30,30]});
  }

  initializeMap();
  updateMap();

  // funzione cerchi gruppi
  window.focusGroup = function(groupId) {
    const groupPoints = points.filter(p=>p.groupId===groupId);
    if(groupPoints.length===0) return;
    const bounds = L.latLngBounds(groupPoints.map(p=>[p.coordinates[1],p.coordinates[0]]));
    map.fitBounds(bounds,{padding:[30,30]});
  }

  // Popola cerchi in basso (demo)
  const container = document.querySelector(".flex.space-x-3");
  if(container) {
    container.innerHTML = "";
    groupsPreview.forEach(group => {
      const div = document.createElement("div");
      div.className = "flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center cursor-pointer hover:scale-105 transition";
      div.title = "Groupe " + group.groupId;
      div.innerHTML = `<span class="text-white font-bold text-sm">${group.groupId}</span>`;
      div.onclick = () => window.focusGroup(group.groupId);
      container.appendChild(div);
    });
  }
});

