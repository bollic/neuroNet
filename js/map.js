document.addEventListener("DOMContentLoaded", function() {
    // Inizializzazione della mappa
    const map = L.map("map", { center: [43.2, 1.30], zoom: 7 });
     // Aggiungi il layer di base alla mappa
     L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);
  
    // Bottone per mostrare/nascondere la mappa
    var mapElement = document.getElementById('map');
      var toggleButton = document.getElementById('toggle-map');
      
      toggleButton.addEventListener('click', function() {
        if (mapElement.style.display === 'none') {
          mapElement.style.display = 'block';
          toggleButton.textContent = 'Nascondi mappa';
  
          // Aggiungi invalidateSize per ricalcolare la mappa quando viene mostrata
          setTimeout(function() {
            map.invalidateSize();
          }, 100); // Attendi brevemente per garantire il rendering corretto
        } else {
          mapElement.style.display = 'none';
          toggleButton.textContent = 'Mostra mappa';
        }
      });
    });