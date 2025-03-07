
  document.addEventListener("DOMContentLoaded", function() {
    let map; 
    let layerGroup = L.featureGroup(); 
    var drawnItems = new L.FeatureGroup();
    //let trianglePoints = []; // Memorizza i punti selezionati
  
    //const map = document.getElementById('map');
      
  
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

console.log("Triangolo con groupedArticles:", groupedArticles['trepunti']);
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
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png'
        })
    };
    
    const polylineStyles = {
        "bon":  { color: 'blue', weight: 2,  fillColor: 'blue', fillOpacity: 0.2 },
        "moyen": { color: 'gray', weight: 2,  fillColor: 'gray', fillOpacity: 0.0},
        "bas": { color: 'red', weight: 2, fillColor: 'orange', fillOpacity: 0.0}
    };

    const groupedMarkers = {
        "bon": [],
        "moyen": [],
        "bas": []
    };
   // **Nuovo codice: Itera su tutti i gruppi di trepunti**
   const groupedArticlesByType = groupedArticles;

Object.keys(groupedArticles['trepunti'] || {}).forEach(groupName => {
    const trePuntiGroup = groupedArticles['trepunti'][groupName];
    console.log(`Rendering trePunti for group: ${groupName}`, trePuntiGroup);

    // Crea il poligono per il gruppo corrente
    const latLngs = trePuntiGroup.map(trePunto => {
        const lat = parseFloat(trePunto.coordinates[0]);
        const lng = parseFloat(trePunto.coordinates[1]);

        // Semplifica il controllo sulle coordinate
        if (!isNaN(lat) && !isNaN(lng)) {
            return [lng, lat];
        } else {
            console.error("Coordinate non valide o mancanti:", trePunto.coordinates);
            return null;
        }
    }).filter(coord => coord !== null);

    console.log("Struttura latLngs:", JSON.stringify(latLngs)); 
    const category = trePuntiGroup[0]?.category || 'moyen'; // Default a 'moyen' se manca
    console.log("Coordinate:", latLngs);

    // **Crea il poligono se ci sono almeno 3 punti**
    if (latLngs.length >= 3) { // Cambiato da === 3 a >= 3
        console.log("Creazione poligono con coordinate:", JSON.stringify(latLngs));
        console.log("Categoria e stile:", category, polylineStyles[category]);
   
        const polygon = L.polygon(latLngs, polylineStyles[category]);
        polygon.addTo(map); 
        // <-- Prova ad aggiungere direttamente alla mappa
   
        drawnItems.addLayer(polygon);
        console.log("Poligono aggiunto per trePunti:", groupName, latLngs);
    } else {
        console.warn("Numero di coordinate insufficiente per creare un poligono:", latLngs);
    }
});

// **Nuovo codice: Raggruppa trepunti per gruppo**
const groupedTrepunti = Object.keys(groupedArticlesByType['trepunti'] || {}).reduce((acc, groupKey) => {
    const trePuntiGroup = groupedArticlesByType['trepunti'][groupKey];
    acc[groupKey] = trePuntiGroup;
    return acc;
}, {});

console.log("Grouped TrePunti by Group:", groupedTrepunti);

// **Crea poligoni per ogni gruppo di trepunti**
Object.keys(groupedTrepunti).forEach((group) => {
    const trePuntiGroup = groupedTrepunti[group];
    console.log(`Rendering trePunti for group: ${group}`, trePuntiGroup);

    // Itera su ogni punto nel gruppo
    const latLngs = trePuntiGroup.map(trePunto => {
        const lat = parseFloat(trePunto.coordinates[0]);
        const lng = parseFloat(trePunto.coordinates[1]);

        console.log("Articolo:", trePunto);
        console.log("Latitudine:", lat, "Longitudine:", lng);

        // Verifica che siano numeri validi
        if (!isNaN(lat) && !isNaN(lng)) {
            // Leaflet vuole i valori in ordine (lng, lat)
            return [lat, lng];
        } else {
            console.error("Coordinate non valide o mancanti:", trePunto.coordinates);
            return null;
        }
    }).filter(coord => coord !== null);

    console.log("Struttura latLngs:", JSON.stringify(latLngs)); 
    const category = trePuntiGroup[0]?.category || 'moyen';
    console.log("Coordinate:", latLngs);

    // **Crea il poligono se ci sono almeno 3 punti**
    if (latLngs.length >= 3) { 
        console.log("Creazione poligono con coordinate:", JSON.stringify(latLngs));
        const polygon = L.polygon(latLngs, polylineStyles[category]);
        drawnItems.addLayer(polygon);
        console.log("Poligono aggiunto per trePunti:", group, latLngs);
    } else {
        console.warn("Numero di coordinate insufficiente per creare un poligono:", latLngs);
    }
});

// Iterano sui gruppi di elementi (trepunti o triangle).
Object.keys(groupedArticles['triangle'] || {}).forEach(groupName => {
    const triangles = groupedArticles['triangle'][groupName];
  
 // Mappano le coordinate per ciascun gruppo.
    const latLngs = triangles.map(triangle => {
        const lat = parseFloat(triangle.coordinates[0]);
        const lng = parseFloat(triangle.coordinates[1]);
 // Verificano la validità delle coordinate (!isNaN(lat) && !isNaN(lng)).
        if (!isNaN(lat) && !isNaN(lng)) {
            return [lat, lng];
        } else {
            console.error("Coordinate non valide:", triangle.coordinates);
            return null;
        }
    }).filter(coord => coord !== null); // Rimuove coordinate non valide
//Creano un poligono se ci sono almeno 3 punti validi.
    if (latLngs.length === 3) {
        const category = triangles[0]?.category || 'moyen'; // Default a 'moyen' se la categoria manca
// Assegnano uno stile in base alla categoria 
        const polygon = L.polygon(latLngs, polylineStyles[category]);
// Aggiungono il poligono al layer drawnItems su Leaflet.
        drawnItems.addLayer(polygon); // Aggiungi il poligono al layer sulla mappa
        console.log("Poligono aggiunto per il gruppo:", groupName, latLngs);
    }
});

// Raggruppamento per Gruppo:
  //Entrambi raggruppano gli articoli per gruppo utilizzando reduce():
     const groupedTriangles = Object.keys(groupedArticlesByType['triangle'] || {}).reduce((acc, groupKey) => {
        const triangles = groupedArticlesByType['triangle'][groupKey];
        acc[groupKey] = triangles; // Aggiungi i triangoli di quel gruppo
        return acc;
    }, {});
    
    console.log("Grouped Triangles by Group:", groupedTriangles);

    // DUE  DUE DUE
    // **Crea poligoni per ogni gruppo di triangoli**
    Object.keys(groupedTriangles).forEach((group) => {
        const triangles = groupedTriangles[group];
         // Itera su ogni triangolo nel gruppo
    const latLngs = triangles.map(triangle => {
        const lat = parseFloat(triangle.coordinates[0]);
        const lng = parseFloat(triangle.coordinates[1]);

        // Verifica se lat e lng sono numeri validi
        if (!isNaN(lat) && !isNaN(lng)) {
            return [lat, lng];
        } else {
            console.error("Coordinate non valide:", triangle.coordinates);
            return null;
        }
    }).filter(coord => coord !== null); // Rimuove coordinate non valide
    // Ottieni la categoria (o un valore di default se non esiste)
    const category = triangles[0]?.category || 'default';

 
    // Crea il poligono se ci sono almeno 3 punti
    if (latLngs.length >= 3) { 
        console.log("Creazione poligono con coordinate:", JSON.stringify(latLngs));
        const polygon = L.polygon(latLngs, polylineStyles[category]);
        drawnItems.addLayer(polygon); 
    } else {
        console.warn("Numero di coordinate insufficiente per creare un poligono:", latLngs);
    }
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
                console.log("Article Data Before Marker:", article);
              const category = article.category || 'moyen'; // Default 'moyen'
              groupedMarkersByCategory[category].push(article);
            });
          });
          
        // Crea marker e poligoni per ciascuna categoria nel tipo corrente
        Object.keys(groupedMarkersByCategory).forEach((category) => {
            const markers = groupedMarkersByCategory[category];

            if (markers.length > 0) {
                const userIcon = icons[category];

  // Aggiungi i marker per questo tipo e categoria
  markers.forEach((article) => {
   
    console.log("Article Data:", article);
    console.log("Nome:", article.name, "Immagine:", article.image);
 
    const lat = parseFloat(article.coordinates[0]);
    const lng = parseFloat(article.coordinates[1]);
   // console.log("ID per saveMapChanges:", article._id);
        console.log("ID mostrato nel popup:", article.id);
    const singleMarker = L.marker([lat, lng], { icon: userIcon, draggable: true });
   
    singleMarker.on('dragend', function(e) {
        const newLatLng = e.target.getLatLng();
        saveMapChanges(article.id, newLatLng.lat, newLatLng.lng);
    });


    console.log("Popup Data - Nome:", article.name, "Immagine:", article.image);

    const popupContent = `
        <b>${article.name ? article.name : "Nome non disponibile"}</b><br>
        <img src="/uploads/${article.image ? article.image : 'placeholder.png'}" alt="Immagine" class="img-thumbnail" width="100">
    `;
    
    singleMarker.bindPopup(popupContent);
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
            const lat1 = parseFloat(triangle1.coordinates[0]);
            const lng1 = parseFloat(triangle1.coordinates[1]);
            const lat2 = parseFloat(triangle2.coordinates[0]);
            const lng2 = parseFloat(triangle2.coordinates[1]);
            
            const isValidTriangle1 = !isNaN(lat1) && !isNaN(lng1);
            const isValidTriangle2 = !isNaN(lat2) && !isNaN(lng2);

            if (isValidTriangle1 && isValidTriangle2) {
                const point1 = [lat1, lng1];
                const point2 = [lat2, lng2];
                 // ✅ LOG CORRETTO DOPO LA DEFINIZIONE DI point1 e point2
                 console.log(`Connecting ${JSON.stringify(point1)} to ${JSON.stringify(point2)}`);

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
    console.log("Original Triangles:", JSON.stringify(originalTriangles, null, 2));
    console.log("Scaled1 Triangles:", JSON.stringify(scaled1Triangles, null, 2));
    console.log("Scaled2 Triangles:", JSON.stringify(scaled2Triangles, null, 2));
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
    // Parsing e verifica delle coordinate
    const parsedLat = parseFloat(newLat);
    const parsedLng = parseFloat(newLng);
    const isValidLat = !isNaN(parsedLat) && parsedLat >= -90 && parsedLat <= 90;
    const isValidLng = !isNaN(parsedLng) && parsedLng >= -180 && parsedLng <= 180;
    const isValidArticleId = articleId && typeof articleId === 'string';


    if (isValidLat && isValidLng && isValidArticleId) {
        console.log(`Coordinate valide: lat=${parsedLat}, lng=${parsedLng}`);
        console.log("Calling API with ID:", articleId);

        fetch(`/api/articles/${articleId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ latitudeSelectionee: parsedLat, longitudeSelectionee: parsedLng })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Errore nel server: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log("Modifica salvata nel database.", data.article);
            } else {
                console.error("Errore durante il salvataggio:", data.message);
            }
        })
        .catch(error => console.error("Errore nel salvataggio della modifica:", error));

    } else {
        console.warn("Coordinate o ID articolo non validi:", {
            articleId,
            newLat,
            newLng
        });
    }
    };


}); 