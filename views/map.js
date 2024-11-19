document.addEventListener("DOMContentLoaded", function() {
    let map; // Declare map variable outside the event listener
    let layerGroup; // Declare layerGroup variable outside the event listener

      // Function to initialize the map
function initializeMap() {
  // Initialize the map once
     map = L.map("map", { center: [43.2, 1.30], zoom: 10 });
     L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { 
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
     // Initialize a feature group to hold markers
     layerGroup = L.featureGroup().addTo(map);

    const icons = {
      "bon": L.icon({
        iconSize: [25, 41],
        iconAnchor: [10, 41],
        popupAnchor: [2, -40],
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png'
      }),
      "moyen": L.icon({
        iconSize: [25, 41],
        iconAnchor: [10, 41],
        popupAnchor: [2, -40],
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png'
      }),
      "bas": L.icon({
        iconSize: [25, 41],
        iconAnchor: [10, 41],
        popupAnchor: [2, -40],
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
      })
    };

    if (typeof filteredUsers !== 'undefined' && filteredUsers.length > 0) {
      filteredUsers.forEach(user => {
        const lat = parseFloat(user.latitudeSelectionee); // Pas de toFixed() pour conserver la précision
         const lng = parseFloat(user.longitudeSelectionee); // Pas de toFixed() pour conserver la précision
        const userIcon = icons[user.category] || icons['moyen']; // Par défaut 'moyen' si catégorie inconnue

    // Créer un marqueur pour chaque utilisateur
    const singleMarker = L.marker([lat, lng], { icon: userIcon, draggable: true });
          // Attacher une popup au marqueur
        singleMarker.bindPopup(
          `<br><strong>${user.name}</strong></br>
          <br><strong>${user.category}</strong></br>
      <div class='flex-shrink-0 h-20 w-20'>
        <img class='h-20 w-20 rounded-full' alt='' src="/uploads/${user.image}">
      </div> 
   `
        ).openPopup();

        layerGroup.addLayer(singleMarker);
      });
       // Ajuster la vue pour inclure tous les marqueurs uniquement s'il y a des marqueurs
       if (layerGroup.getLayers().length > 0) {
        map.fitBounds(layerGroup.getBounds()); // Ajuster la carte aux limites des marqueurs
        }
    }

   // Example static marker
   const exampleMarker = L.marker([43.2, 1.30]).addTo(layerGroup);
    exampleMarker.bindPopup('<b>Hello world!</b><br>I am a popup.');
   }
     // Initialize the map
  initializeMap();
   // Function to handle map visibility
 //  function toggleMap() {
   
    
      const mapElement = document.getElementById('map');
      const toggleButton = document.getElementById('toggle-map');

      if (mapElement.style.display === 'none') {
        mapElement.style.display = 'block';
        toggleButton.textContent = 'Efface la carte';

        // Initialize map if not already initialized
        if (!map) {
          initializeMap();
          setTimeout(() => {
            map.invalidateSize(); // Ensure map is resized
            map.fitBounds(layerGroup.getBounds()); // Fit map to markers
          }, 100); // Short delay to ensure rendering
        } else {
          map.invalidateSize(); // Ensure map is resized
          map.fitBounds(layerGroup.getBounds()); // Fit map to markers
        }
      } else {
        mapElement.style.display = 'none';
        toggleButton.textContent = 'Visualise la carte';
      }
    }

    // Attach event listener to toggle button
    //document.getElementById('toggle-map').addEventListener('click', toggleMap);
  

    // }
    );