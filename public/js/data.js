document.addEventListener("DOMContentLoaded", function() {
  let map; // Variabile globale per la mappa
  let layerGroup = L.featureGroup(); // Gruppo per i layer (marker, poligoni, ecc.)
  let drawnItems = new L.FeatureGroup(); // Gruppo per i poligoni disegnati

  // Funzione per inizializzare la mappa (eseguita solo una volta)
  function initializeMap() {
      map = L.map("map", { center: [43.2, 1.30], zoom: 10 });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { 
          maxZoom: 19,
          attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);

      // Aggiungi i gruppi alla mappa
      map.addLayer(drawnItems);
      layerGroup.addTo(map);

      // Controllo per modificare i poligoni
      const drawControl = new L.Control.Draw({
          edit: {
              featureGroup: drawnItems,
              edit: true,
              remove: false // Cambialo a true se vuoi permettere la rimozione
          },
          draw: false // Disabilita la creazione di nuovi poligoni
      });
      map.addControl(drawControl);

      // Evento per la modifica dei poligoni
      map.on('draw:edited', function(event) {
          const layers = event.layers;
          layers.eachLayer(function(layer) {
              console.log(layer.getLatLngs()); // Mostra i nuovi vertici dei poligoni
          });
      });

      // Pulsante per abilitare la modifica dei poligoni
      document.getElementById('edit-polygons-btn').addEventListener('click', function() {
          drawControl._toolbars.edit._modes.edit.handler.enable();
      });
  }

// Funzione per raggruppare articoli
function groupedByType(articles) {
  const grouped = {};

  articles.forEach((article) => {
      const type = article.type || 'Sconosciuto'; // Imposta "Sconosciuto" se type è mancante

      if (!grouped[type]) {
          grouped[type] = [];
      }
      grouped[type].push(article);
  });

  return grouped;
}

  // Funzione per aggiornare la mappa con i dati dal server
  function updateMap(groupedByUser) {
      console.log('Dati ricevuti in updateMap:', groupedByUser);

      if (!groupedByUser || Object.keys(groupedByUser).length === 0) {
          console.error('GroupedByUser è vuoto o non valido:', groupedByUser);
          return;
      }

      layerGroup.clearLayers(); // Rimuove marker e poligoni esistenti

      const polylineStyles = {
          "bon": { color: 'blue', weight: 4 },
          "moyen": { color: 'gray', weight: 4 },
          "bas": { color: 'red', weight: 4 }
      };

      const icons = {
          "bon": L.icon({
              iconSize: [19, 30],
              iconAnchor: [8, 30],
              popupAnchor: [2, -30],
              shadowSize: [31, 30],
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png'
          }),
          "moyen": L.icon({
              iconSize: [19, 30],
              iconAnchor: [8, 30],
              popupAnchor: [2, -30],
              shadowSize: [31, 30],
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png'
          }),
          "bas": L.icon({
              iconSize: [19, 30],
              iconAnchor: [8, 30],
              popupAnchor: [2, -30],
              shadowSize: [31, 30],
              shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
              iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
          })
      };

      Object.keys(groupedByUser).forEach(userId => {
          const userGroup = groupedByUser[userId];
          const articles = userGroup.articles;

          console.log(`Creazione di marker e poligoni per l'utente ${userId}`);

          const groupedMarkers = {
              "bon": [],
              "moyen": [],
              "bas": []
          };

          // Itera sugli articoli dell'utente
          articles.forEach(article => {
              const lat = parseFloat(article.latitude || article.latitudeSelectionee);
              const lng = parseFloat(article.longitude || article.longitudeSelectionee);
              const category = article.category;

              if (!lat || !lng || !icons[category]) {
                  console.warn("Coordinate o categoria mancanti o invalide:", { lat, lng, category });
                  return;
              }

              // Crea il marker
              const marker = L.marker([lat, lng], { icon: icons[category] });
              marker.bindPopup(`
                  <strong>${article.name}</strong><br>
                  Categoria: ${article.category}<br>
                  <img src="/uploads/${article.image}" width="50">
              `);
              layerGroup.addLayer(marker);

              // Raggruppa i marker per categoria
              if (groupedMarkers[category]) {
                  groupedMarkers[category].push({ lat, lng, id: article._id || null });
              }
          });

          // Crea poligoni per ogni categoria
          for (const category in groupedMarkers) {
              const latLngs = groupedMarkers[category];
              if (latLngs.length >= 3) {
                  const polygon = L.polygon(latLngs, polylineStyles[category]);
                  drawnItems.addLayer(polygon);
              }
          }

          // Crea i raggi tra i nodi
          createRaggi(groupedMarkers);
      });

      // Adatta la mappa ai nuovi dati
      if (layerGroup.getLayers().length > 0) {
          map.fitBounds(layerGroup.getBounds());
      }
  }

  function createRaggi(groupedMarkers) {
      console.log("Creazione raggi tra i nodi:", groupedMarkers);
      ['bon', 'moyen', 'bas'].forEach(category => {
          const latLngs = groupedMarkers[category] || [];
          for (let i = 0; i < latLngs.length - 1; i++) {
              const start = latLngs[i];
              const end = latLngs[i + 1];
              if (start && end) {
                  drawnItems.addLayer(L.polyline([start, end], { color: 'black', weight: 0.8 }));
              }
          }
      });
  }

  // Funzione per gestire la visibilità della mappa
  function toggleMap() {
      const mapElement = document.getElementById('map');
      const toggleButton = document.getElementById('toggle-map');

      if (mapElement.style.display === 'none') {
          mapElement.style.display = 'block';
          toggleButton.textContent = '-';

          if (!map) initializeMap();

          fetch('/api/grouped-by-user')
              .then(response => response.json())
              .then(updateMap)
              .catch(console.error);
      } else {
          mapElement.style.display = 'none';
          toggleButton.textContent = '+';
      }
  }

  // Event listener per il pulsante della mappa
  document.getElementById('toggle-map').addEventListener('click', toggleMap);
});
