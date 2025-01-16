
  document.addEventListener("DOMContentLoaded", function() {
    let map; // Declare map variable
    let layerGroup = L.featureGroup(); // Initialize layerGroup once
    var drawnItems = new L.FeatureGroup();
    //let trianglePoints = []; // Memorizza i punti selezionati
    const maxPoints = 3; // Numero massimo di punti per un triangolo
    //const map = document.getElementById('map');
      
    const addTriangleButton = document.getElementById("add-triangle");
    //const mapElement = document.getElementById("map");
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
    console.log("groupedArticlesByType['triangle']:", groupedArticlesByType['triangle']);

     // **Nuovo codice: Raggruppa i triangoli per gruppo**
     const groupedTriangles = Object.keys(groupedArticlesByType['triangle'] || {}).reduce((acc, groupKey) => {
        const triangles = groupedArticlesByType['triangle'][groupKey];
        acc[groupKey] = triangles; // Aggiungi i triangoli di quel gruppo
        return acc;
    }, {});
    
    console.log("Grouped Triangles by Group:", groupedTriangles);
    
    // **Crea poligoni per ogni gruppo di triangoli**
    Object.keys(groupedTriangles).forEach((group) => {
        const triangles = groupedTriangles[group];
        console.log(`Rendering triangles for group: ${group}`, triangles);
       
            // Crea il poligono per il gruppo corrente
    const latLngs = triangles.map((article) => [
        parseFloat(article.latitudeSelectionee),
        parseFloat(article.longitudeSelectionee),
    ]);
    const category = triangles[0]?.category; // O sostituisci con il nome corretto della proprietà

    // **Inserisci qui la parte che crea il poligono per tipo e categoria**
    if (latLngs.length >= 3) { // Almeno 3 punti per un poligono valido
        // In base alla categoria, applichiamo lo stile appropriato
        const polygon = L.polygon(latLngs, polylineStyles[category]);
        drawnItems.addLayer(polygon); // Aggiungi il poligono al layer
    }

       /* if (latLngs.length >= 3) { // Almeno 3 punti per formare un triangolo
            const polygon = L.polygon(latLngs, { color: 'red', weight: 2 });
            drawnItems.addLayer(polygon); // Aggiungi il poligono al layer
        }*/
    });

  
  // **Codice esistente: gestione dei marker**
    Object.keys(groupedArticlesByType).forEach((type) => {
        const articlesOfType = groupedArticlesByType[type];

        // Raggruppa gli articoli per categoria dentro ogni tipo
        const groupedMarkersByCategory = {
            "bon": [],
            "moyen": [],
            "bas": []
        };
        Object.values(articlesOfType).forEach((articles) => {
            articles.forEach((article) => {
              const category = article.category || 'moyen'; // Default 'moyen'
              groupedMarkersByCategory[category].push(article);
            });
          });
          
        /* 
        articlesOfType.forEach((article) => {
            const category = article.category || 'moyen'; // Default 'moyen'
            groupedMarkersByCategory[category].push(article);
        });*/

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
        <strong>ID user: ${article.user._id}</strong><br>
        <strong>${article._id}</strong><br>
        <img src="/uploads/${article.image}" alt="Immagine" class="img-thumbnail" width="100">
    `);
    layerGroup.addLayer(singleMarker);
});
  
         }
      });
   });



    // Crea i raggi collegando i nodi corrispondenti
    createRaggi(groupedArticles);
    console.log("Grouped Markers 1:", groupedArticles);

    // Adatta la mappa per includere tutti i marker e polilinee
    if (layerGroup.getLayers().length > 0) {
        map.fitBounds(layerGroup.getBounds());
    }
}

function createPolylinesBetweenGroups(group1, group2, color = 'black', weight = 0.8) {
    group1.forEach((triangle1, index) => {
        const triangle2 = group2[index]; // Assumi che abbiano lo stesso indice

        if (triangle1 && triangle2) {
            // Controlla e converti le coordinate
            const lat1 = parseFloat(triangle1.latitudeSelectionee);
            const lng1 = parseFloat(triangle1.longitudeSelectionee);
            const lat2 = parseFloat(triangle2.latitudeSelectionee);
            const lng2 = parseFloat(triangle2.longitudeSelectionee);

            const isValidTriangle1 = !isNaN(lat1) && !isNaN(lng1);
            const isValidTriangle2 = !isNaN(lat2) && !isNaN(lng2);

            if (isValidTriangle1 && isValidTriangle2) {
                const point1 = [lat1, lng1];
                const point2 = [lat2, lng2];
                const polyline = L.polyline([point1, point2], { color, weight });
                drawnItems.addLayer(polyline);
                console.log(`Polilinea tra ${point1} e ${point2}`);
            } else {
                console.warn("Coordinate non valide per i triangoli:", triangle1, triangle2);
            }
        } else {
            console.warn("Triangoli mancanti a questo indice:", index, triangle1, triangle2);
        }
    });
}

function createRaggi(groupedArticles) {
    const triangles = groupedArticles['triangle'] || {};

    const originalTriangles = triangles['original'] || [];
    const scaled1Triangles = triangles['scaled1'] || [];
    const scaled2Triangles = triangles['scaled2'] || [];

    console.log("Original Triangles:", originalTriangles);
    console.log("Scaled1 Triangles:", scaled1Triangles);
    console.log("Scaled2 Triangles:", scaled2Triangles);
    // Creazione polilinee tra scaled1 e scaled2
    createPolylinesBetweenGroups(scaled1Triangles, scaled2Triangles, 'black', 0.8);

    // Creazione polilinee tra original e scaled1
    createPolylinesBetweenGroups(originalTriangles, scaled1Triangles, 'white', 1.2);
    // Ad esempio: Collegare i vertici tra scaled1 e scaled2
  

    
    
}

    //  const mapElement = document.getElementById('map');      
        // Initialize map only once, then update content
        if (!map) {
          initializeMap();
        }

        setTimeout(() => {
          map.invalidateSize(); // Ensure map is resized
          updateMap(); // Update markers and polylines
        }, 100); // Short delay to ensure rendering
       

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

    };

}); 