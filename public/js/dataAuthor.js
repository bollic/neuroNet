
  document.addEventListener("DOMContentLoaded", function() {
    let map; // Declare map variable
    let layerGroup = L.featureGroup(); // Initialize layerGroup once
    var drawnItems = new L.FeatureGroup();
    //let trianglePoints = []; // Memorizza i punti selezionati
    const maxPoints = 3; // Numero massimo di punti per un triangolo
 
    const addTriangleButton = document.getElementById("add-triangle");
    const mapElement = document.getElementById("map");
    // Recupera dati server-side
         // Function to initialize the map (runs only once)
    function initializeMap() {
      map = L.map("map", { center: [43.2, 1.30], zoom: 10 });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { 
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);
     
      map.addLayer(drawnItems); // Add drawnItems layer to map     
      layerGroup.addTo(map); // Add the feature group to the map
    //  map.addLayer(drawnItems); Per il DB

    var drawControl = new L.Control.Draw({
       edit: {
        featureGroup: drawnItems,  // Gruppo di poligoni che possono essere modificati
        edit: true,                // Permetti la modifica dei poligoni
        remove: false              // Non permettere la rimozione (puoi cambiarlo)
    },
    draw: false  // Disabilita la creazione di nuovi poligoni
});
map.addControl(drawControl);

      // Evento per la modifica dei poligoni
map.on('draw:edited', function(event) {
        var layers = event.layers;
        layers.eachLayer(function(layer) {
          console.log(layer.getLatLngs()); // Mostra i nuovi vertici
        });
   });
    // Aggiungi l'evento per il pulsante che abilita la modifica dei poligoni
    document.getElementById('edit-polygons-btn').addEventListener('click', function () {
    drawControl._toolbars.edit._modes.edit.handler.enable(); // Abilita la modalità di modifica
  });
    } // Fine della funzione initializeMap() 


  // Raggruppa gli articoli per tipo (triangolo, pentagono, ecc.)
 //const groupedArticles = groupedByType(articles); // Raggruppa gli articoli
//console.log(groupedByType)
//console.log(groupedArticles['triangle'])
//console.log(groupedArticles['pentagone'])
console.log("Triangoli con groupedArticles:", groupedArticles['triangle']);
console.log("Pentagoni con groupedArticles:", groupedArticles['pentagone']);
 
// Ora puoi accedere a `groupedArticles['triangle']` e `groupedArticles['pentagon']` per elaborare i rispettivi articoli

function updateMap() {
       // Interrompi subito se `filteredUsers` non è definito
       if (typeof articles === 'undefined') {
        console.error("Errore: I dati di utenti o marker non sono definiti.");
        return; // Interrompe l'esecuzione
    }

    layerGroup.clearLayers();

    const icons = {
        "bon": L.icon({
            iconSize: [19, 30],
            iconAnchor: [8, 30],
            popupAnchor: [2, -30],
            shadowSize: [31, 30],
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', // URL dell'ombra predefinita di Leaflet
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png'
        }),
        "moyen": L.icon({
            iconSize: [19, 30],
            iconAnchor: [8, 30],
            popupAnchor: [2, -30],
            shadowSize: [31, 30],
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', // URL dell'ombra predefinita di Leaflet
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png'
        }),
        "bas": L.icon({
            iconSize: [19, 30],
            iconAnchor: [8, 30],
            popupAnchor: [2, -30],
            shadowSize: [31, 30],
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', // URL dell'ombra predefinita di Leaflet
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png'
        })
    };
    const polylineStyles = {
        "bon": { color: 'blue', weight: 2 },
        "moyen": { color: 'gray', weight: 2 },
        "bas": { color: 'orange', weight: 2 }
    };

    const groupedMarkers = {
        "bon": [],
        "moyen": [],
        "bas": []
    };
            
    // Raggruppa gli articoli per tipo usando la funzione già esistente
    const groupedArticlesByType = groupedArticles;

    // Crea marker e poligoni per ciascun tipo e categoria
    Object.keys(groupedArticlesByType).forEach((type) => {
        const articlesOfType = groupedArticlesByType[type];

        // Raggruppa gli articoli per categoria dentro ogni tipo
        const groupedMarkersByCategory = {
            "bon": [],
            "moyen": [],
            "bas": []
        };

        articlesOfType.forEach((article) => {
            const category = article.category || 'moyen'; // Default 'moyen'
            groupedMarkersByCategory[category].push(article);
        });

        // Crea marker e poligoni per ciascuna categoria nel tipo corrente
        Object.keys(groupedMarkersByCategory).forEach((category) => {
            const markers = groupedMarkersByCategory[category];

            if (markers.length > 0) {
                const userIcon = icons[category];

  // Aggiungi i marker per questo tipo e categoria
  markers.forEach((article) => {
    const lat = parseFloat(article.latitudeSelectionee);
    const lng = parseFloat(article.longitudeSelectionee);

    const singleMarker = L.marker([lat, lng], { icon: userIcon, draggable: true });
    singleMarker.on('dragend', function(e) {
        const newLatLng = e.target.getLatLng();
        saveMapChanges(article._id, newLatLng.lat, newLatLng.lng);
    });

    singleMarker.bindPopup(`
        <b>${article.name}</b><br>
        <strong>ID user: ${article.user}</strong><br>
        <strong>${article._id}</strong><br>
        <img src="/uploads/${article.image}" alt="Immagine" class="img-thumbnail" width="100">
    `);
    layerGroup.addLayer(singleMarker);
});

// Crea il poligono per questo tipo e categoria
const latLngs = markers.map((article) => [parseFloat(article.latitudeSelectionee), parseFloat(article.longitudeSelectionee)]);
if (latLngs.length >= 3) { // Almeno 3 punti per un poligono valido
    const polygon = L.polygon(latLngs, polylineStyles[category]);
    drawnItems.addLayer(polygon);
}
}
});
});



    // Crea i raggi collegando i nodi corrispondenti
    createRaggi(groupedMarkers);
    console.log("Grouped Markers 1:", groupedMarkers);

    // Adatta la mappa per includere tutti i marker e polilinee
    if (layerGroup.getLayers().length > 0) {
        map.fitBounds(layerGroup.getBounds());
    }
}

function createRaggi(groupedMarkers) {
  const verticesBon = {};
    const verticesMoyen = {};
    const verticesMauvais = {};

    console.log("Grouped Markers:", groupedMarkers); // Controlla il contenuto di groupedMarkers
     // Popola i vertici per "bon"
     for (const [index, article] of groupedMarkers['bon'].entries()) {
        console.log("Articolo Bon:", article); // Logga l'articolo corrente
        // Usa l'indice come vertice
        verticesBon[index + 1] = [article.lat, article.lng]; 
        console.log(`Aggiunto vertice Bon: ${index + 1} -> [${article.lat}, ${article.lng}]`);
    }
    // Popola i vertici per "moyen"
    for (const [index, article] of groupedMarkers['moyen'].entries()) {
        console.log("Articolo Moyen:", article); // Logga l'articolo corrente
        // Usa l'indice come vertice
        verticesMoyen[index + 1] = [article.lat, article.lng]; 
        console.log(`Aggiunto vertice Moyen: ${index + 1} -> [${article.lat}, ${article.lng}]`);
    }

    // Popola i vertici per "bas"
    for (const [index, article] of groupedMarkers['bas'].entries()) {
        console.log("Articolo Bas:", article); // Logga l'articolo corrente
        // Usa l'indice come vertice
        verticesMauvais[index + 1] = [article.lat, article.lng]; 
        console.log(`Aggiunto vertice Bas: ${index + 1} -> [${article.lat}, ${article.lng}]`);
    }

    // Controlla il risultato finale
    console.log("Vertices Bon:", verticesBon);
    console.log("Vertices Moyen:", verticesMoyen);
    console.log("Vertices Mauvais:", verticesMauvais);

       // Disegna le polilinee tra i vertici Moyen e Mauvais
       // Disegna le polilinee tra i vertici Bon, Moyen e Mauvais
for (const key in verticesBon) {
    if (verticesBon.hasOwnProperty(key)) {
        const pointBon = verticesBon[key];
        const pointMoyen = verticesMoyen[key];
        const pointMauvais = verticesMauvais[key];

        // Assicurati che tutti e tre i punti siano definiti
        if (pointBon && pointMoyen && pointMauvais) {
            // Tratto Bon -> Moyen
            const polylineBonMoyen = L.polyline([pointBon, pointMoyen], { color: 'black', weight: 0.9 });
            drawnItems.addLayer(polylineBonMoyen);
            console.log(`Polilinea disegnata tra il vertice Bon ${key} e il vertice Moyen ${key}`);

            // Tratto Moyen -> Mauvais
            const polylineMoyenMauvais = L.polyline([pointMoyen, pointMauvais], { color: 'black', weight: 0.8 });
            drawnItems.addLayer(polylineMoyenMauvais);
            console.log(`Polilinea disegnata tra il vertice Moyen ${key} e il vertice Mauvais ${key}`);
        }
    }
}


    // Stampa le coordinate per ogni vertice di Moyen
    for (const [key, coords] of Object.entries(verticesMoyen)) {
        console.log(`Vertice Moyen ${key}:`, coords); // Stampa le coordinate
        // Usa coords[0] e coords[1] per lat e lng rispettivamente
    }

    // Se desideri anche stampare i vertici Mauvais
    for (const [key, coords] of Object.entries(verticesMauvais)) {
        console.log(`Vertice Mauvais ${key}:`, coords); // Stampa le coordinate
        // Usa coords[0] e coords[1] per lat e lng rispettivamente
    }
}
   
    // Function to handle map visibility
    function toggleMap() { 

      const mapElement = document.getElementById('map');
      const toggleButton = document.getElementById('toggle-map');
   
      if (mapElement.style.display === 'none') {
        mapElement.style.display = 'block';
        toggleButton.textContent = 'Efface la carte';

        // Initialize map only once, then update content
        if (!map) {
          initializeMap();
        }

        setTimeout(() => {
          map.invalidateSize(); // Ensure map is resized
          updateMap(); // Update markers and polylines
        }, 100); // Short delay to ensure rendering
      } else {
        mapElement.style.display = 'none';
        toggleButton.textContent = 'Visualiser la carte';
      }
    }

    // Attach event listener to toggle button
    document.getElementById('toggle-map').addEventListener('click', toggleMap);
  });


  ///SECONDO SCRIPT
  function saveMapChanges(articleId, newLat, newLng) {
    fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ latitudeSelectionee: newLat, longitudeSelectionee: newLng })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
         console.log("Calling API with ID:", articleId);
            console.log("Modifica salvata nel database.", data.article);
        } else {
            console.error("Errore durante il salvataggio:", data.message);
        }
    })
    .catch(error => console.error("Errore nel salvataggio della modifica:", error));
}