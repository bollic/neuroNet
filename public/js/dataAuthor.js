
document.addEventListener("DOMContentLoaded", function() { 
 
    let map; 
    let layerGroup;  
    let drawnItems;  
    //  AGGIORNA I DATI CON LA RISPOSTA DEL SERVER
    async function updateArticleName(marker, newName, newCategory) {
        try {
            const response = await fetch(`/api/articles/${marker.options.articleData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName,
                    category: newCategory,
                    latitudeSelectionee: marker.getLatLng().lat,
                    longitudeSelectionee: marker.getLatLng().lng
                  })
            });
    
            const data = await response.json();
            if (data.success) {
                  // Aggiorna i dati del marker
            marker.options.articleData.name = data.updatedArticle.name;
            marker.options.articleData.category = data.updatedArticle.category;
         
                // Aggiorna il popup con i dati RESTITUITI DAL SERVER
                marker.setPopupContent(`
                    <div class="edit-popup">
                        <textarea class="form-control mb-2 name-input">${data.updatedArticle.name}</textarea>
                        <select class="form-control category-input mb-2">
                            <option value="bon" ${data.updatedArticle.category === 'bon' ? 'selected' : ''}>Bon</option>
                            <option value="moyen" ${data.updatedArticle.category === 'moyen' ? 'selected' : ''}>Moyen</option>
                            <option value="bas" ${data.updatedArticle.category === 'bas' ? 'selected' : ''}>Bas</option>
                        </select>
                        <img src="/uploads/${marker.options.articleData.image}" width="100">
                        <button class="btn btn-sm btn-success save-button mt-2">Salva</button>
                    </div>
                `);
                      
                    // Ricarica i dati della mappa
                    setTimeout(() => updateMap(), 500);
                }
            } catch (error) {
                console.error("Errore durante l'aggiornamento:", error);
                alert("Errore durante il salvataggio!");
            }
    }
    const sidebar = document.getElementById('sidebar');
     // Gestione eventi Bootstrap
    sidebar.addEventListener('shown.bs.collapse', function() {
        document.body.classList.add('sidebar-open');
        setTimeout(() => map.invalidateSize(), 300);
    });

    sidebar.addEventListener('hidden.bs.collapse', function() {
        document.body.classList.remove('sidebar-open');
        map.invalidateSize();
    });

    // Chiusura click esterno
    document.addEventListener('click', function(event) {
        if (!sidebar.contains(event.target) && 
            !event.target.closest('.navbar-toggler') && 
            sidebar.classList.contains('show')) {
            bootstrap.Collapse.getInstance(sidebar).hide();
        }
    });
    // Aggiorna la mappa dopo il rendering iniziale
    setTimeout(() => map.invalidateSize(), 500);
    
function initializeMap() {
      map = L.map("map", { center: [43.2, 1.30], zoom: 10 });       
        layerGroup = L.featureGroup().addTo(map);  // Marker
        drawnItems = L.featureGroup().addTo(map);  // Poligoni
    // TileLayer con attribuzioni
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { 
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map);      
     // Draw control (come nella tua versione)
     var drawControl = new L.Control.Draw({
        edit: { 
            featureGroup: drawnItems,
            edit: true,
            remove: false
        },
        draw: false
    });

  // Event handling
    map.addControl(drawControl);
      // Evento per la modifica dei poligoni
      map.on('draw:edited', function(e) {
        e.layers.eachLayer(async (layer) => {
            if (layer instanceof L.Polygon) {
                const newCoords = layer.getLatLngs()[0].map(latlng => [latlng.lat, latlng.lng]);  
                const [lat, lng] = newCoords[0]; 
                try {
                    const response = await fetch('/api/update-polygon-coords', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            lat,
                            lng,
                            newCoordinates: newCoords
                        })
                    });                  
                    const data = await response.json();
                    if (data.success) {
                         }
                } catch (error) {
                    console.error('Errore salvataggio:', error);
                }
            }
        });
    });
   
    } // Fine della funzione initializeMap() 

//console.log("Triangolo con groupedArticles:", groupedArticles['trepunti']);
//console.log("Triangoli con groupedArticles:", groupedArticles['triangle']);
//console.log("Pentagoni con groupedArticles:", groupedArticles['pentagone']);
 
// Ora puoi accedere a `groupedArticles['triangle']` e `groupedArticles['pentagon']` per elaborare i rispettivi articoli
function updateMap() {
    console.log("updateMap triggered");
    console.log("groupedArticles:", groupedArticles);
   // Interrompi subito se `filteredUsers` non è definito
       if (typeof groupedArticles === 'undefined') {
        console.error("Errore: I dati di utenti o marker non sono definiti.");
        return; // Interrompe l'esecuzione
    }
    layerGroup.clearLayers();
    drawnItems.clearLayers();
    
    if (Array.isArray(polygons)) {
        console.log("Rendering polygons:", polygons);
        polygons.forEach(polygon => {
            if (polygon.coordinates) {
                try {
                    const geoJson = {
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: polygon.coordinates
                        },
                        properties: {
                            name: polygon.name || "Senza nome",
                            category: polygon.category || "moyen",
                            image: polygon.image || "default.png"
                        }
                    };
    
                    L.geoJSON(geoJson, {
                        style: {
                            color: geoJson.properties.category === 'bon' ? 'blue' :
                                   geoJson.properties.category === 'moyen' ? 'gray' : 'red',
                            weight: 2,
                            fillOpacity: 0.3
                        }
                    }).bindPopup(`
                        <div>
                            <strong>${geoJson.properties.name}</strong><br>
                            Categoria: ${geoJson.properties.category}<br>
                            <img src="/uploads/${geoJson.properties.image}" width="100">
                        </div>
                    `).addTo(drawnItems);
                } catch (error) {
                    console.error("Errore parsing poligono:", polygon.coordinates, error);
                }
            }
        });
    }
    
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
   
   // **Nuovo codice: Itera su tutti i gruppi di trepunti**
   const groupedArticlesByType = groupedArticles;

Object.keys(groupedArticles['trepunti'] || {}).forEach(groupName => {
    const trePuntiGroup = groupedArticles['trepunti'][groupName];
    //console.log(`Rendering trePunti for group: ${groupName}`, trePuntiGroup);

    // Crea il poligono per il gruppo corrente
    const latLngs = trePuntiGroup.map(trePunto => {
        const lat = parseFloat(trePunto.coordinates[0]);
        const lng = parseFloat(trePunto.coordinates[1]);
        return [lat, lng]; // DA [lng, lat] A [lat, lng]

    }).filter(coord => coord !== null);

   // console.log("Struttura latLngs:", JSON.stringify(latLngs)); 
    const category = trePuntiGroup[0]?.category || 'moyen'; // Default a 'moyen' se manca
    //console.log("Coordinate:", latLngs);

    // **Crea il poligono se ci sono almeno 3 punti**
    if (latLngs.length >= 3) { // Cambiato da === 3 a >= 3
      //  console.log("Creazione poligono con coordinate:", JSON.stringify(latLngs));
      //  console.log("Categoria e stile:", category, polylineStyles[category]);
   
        const polygon = L.polygon(latLngs, polylineStyles[category]);
        polygon.addTo(map); 
        // <-- Prova ad aggiungere direttamente alla mappa
   
        drawnItems.addLayer(polygon);
      //  console.log("Poligono aggiunto per trePunti:", groupName, latLngs);
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

//console.log("Grouped TrePunti by Group:", groupedTrepunti);

// **Crea poligoni per ogni gruppo di trepunti**
Object.keys(groupedTrepunti).forEach((group) => {
    const trePuntiGroup = groupedTrepunti[group];
   // console.log(`Rendering trePunti for group: ${group}`, trePuntiGroup);

    // Itera su ogni punto nel gruppo
    const latLngs = trePuntiGroup.map(trePunto => {
        const lat = parseFloat(trePunto.coordinates[0]);
        const lng = parseFloat(trePunto.coordinates[1]);

      //  console.log("Articolo:", trePunto);
      //  console.log("Latitudine:", lat, "Longitudine:", lng);

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
      //  console.log("Poligono aggiunto per trePunti:", group, latLngs);
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
  //      console.log("Poligono aggiunto per il gruppo:", groupName, latLngs);
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
          //      console.log("Article Data Before Marker:", article);
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
     // ❌ Salta se è un poligono (non un marker)
    /* if (article.type === 'polygon') {
        console.warn('Articolo poligono ignorato:', article);
        return;
    }

    // ✅ Sicurezza su coordinate: deve essere un array valido [lng, lat]
    let lng, lat;

    if (Array.isArray(article.coordinates[0])) {
        // Caso standard: [[lng, lat]]
        [lng, lat] = article.coordinates[0];
    } else if (article.coordinates.length === 2) {
        // Caso alternativo: [lat, lng] → lo invertiamo!
        [lat, lng] = article.coordinates;
    } else {
        console.warn("Coordinate non valide per marker:", article);
        return;
    }
    */

    // ✅ Procedi con i marker validi
     const articleId = article._id || article.id;
    if (!articleId) {
        console.error("Article senza ID:", article);
        return;
         // Salta questo articolo
    }
    const lat = parseFloat(article.coordinates[0]);
    const lng = parseFloat(article.coordinates[1]);
    
    /*
    //const firstCoord = article.coordinates[0]; // [lng, lat]
    // lng = parseFloat(firstCoord[0]);
    // lat = parseFloat(firstCoord[1]);
    */
    
  //  const articleId = article._id || article.id; // Usa _id come priorità, altrimenti id

    const marker = L.marker([lat, lng], {
        icon: userIcon,
        draggable: true,
        articleData: {
            _id: article._id || article.id,  // MongoDB style
             id: (article._id || article.id).toString(), // Stringa garantita
            name: article.name,
            category: article.category,         
            latitudeSelectionee: article.latitudeSelectionee,
            longitudeSelectionee: article.longitudeSelectionee,
            image: article.image
        }
    });
// 1. CONTENUTO DEL POPUP CORRETTO (aggiungi l'input per la categoria)
    const popupContent = `
        <div class="edit-popup">
            <textarea class="form-control mb-2 name-input" 
                    rows="2" 
                    style="resize: vertical">${article.name}</textarea>
                
              <input type="text" 
               class="form-control category-input mb-2" 
               value="${article.category}">

                <img src="/uploads/${article.image || 'placeholder.png'}" 
                    class="img-thumbnail" 
                    width="50"
                    onerror="this.src='/uploads/placeholder.png'">
                     <button class="btn btn-sm btn-primary mt-2 edit-button">✏️</button>
                    </div>
         `;
   
    marker.bindPopup(popupContent, {
        removable: true,     // Mostra pulsante rimozione
        className: 'custom-popup-' + article.category, // Per stili CSS specifici
        minWidth: 200        // Larghezza minima popup
    });
    marker.on('popupopen', function() {
        const popup = this.getPopup();
        
        // Usa il popup specifico invece di document
        const editButton = popup.getElement().querySelector('.edit-button');
        
        if (editButton) {
            editButton.addEventListener('click', () => {
                const newContent = `
                    <div class="edit-popup">
                        <textarea class="form-control mb-2 name-input">${marker.options.articleData.name}</textarea>
                        <select class="form-control category-input mb-2">
                            <option value="bon" ${marker.options.articleData.category === 'bon' ? 'selected' : ''}>Bon</option>
                            <option value="moyen" ${marker.options.articleData.category === 'moyen' ? 'selected' : ''}>Moyen</option>
                            <option value="bas" ${marker.options.articleData.category === 'bas' ? 'selected' : ''}>Bas</option>
                        </select>
                        <button class="btn btn-sm btn-success save-button">Salva</button>
                    </div>
                `;
                
                marker.setPopupContent(newContent);
                
                // Ricollega l'event listener al nuovo pulsante
                const saveButton = popup.getElement().querySelector('.save-button');
                if (saveButton) {
                    saveButton.addEventListener('click', () => {
                        const newName = popup.getElement().querySelector('.name-input').value;
                        const newCategory = popup.getElement().querySelector('.category-input').value;
                        updateArticleName(marker, newName, newCategory);
                    });
                }
            });
        }
    });
// 2. EVENT HANDLER CORRETTO
marker.on('popupclose', function(e) {
    const popupElement = e.popup.getElement();
    console.log('Popup chiuso, elemento:', popupElement);
    const nameInput = popupElement.querySelector('.name-input'); // <-- Classe corretta
    const categoryInput = popupElement.querySelector('.category-input');
    
    // Log dei valori trovati
    console.log('Valori inputs - Name:', nameInput?.value, 'Category:', categoryInput?.value);
    console.log('Dati originali:', this.options.articleData);

    if(nameInput && categoryInput) {
        const newName = nameInput.value;
        const newCategory = categoryInput.value;
        
        if(newName !== this.options.articleData.name || newCategory !== this.options.articleData.category) {
            console.log('Rilevati cambiamenti, chiamata update...');
            updateArticleName(this, newName, newCategory);
        } else {
            console.log('Nessun cambiamento rilevato');
        }
    } else {
        console.error('Input non trovati nel popup');
    }
});

// 3. AGGIORNAMENTO POPUP DOPO IL SUCCESSO (corretto)
if(article.success) {
    // Usa newName/newCategory dalla risposta (data) invece di articleData
    marker.setPopupContent(`
        <div class="edit-popup">
            <textarea class="form-control mb-2 name-input" 
                    rows="2">${data.newName}</textarea> <!-- Usa data -->
            
            <input type="text" 
                class="form-control category-input mb-2" 
                value="${data.newCategory}"> <!-- Usa data -->

            <img src="/uploads/${marker.options.articleData.image}" 
                width="100">
        </div>
    `);
       
    console.log('Dati marker pre-aggiornamento:', marker.options.articleData);
    marker.options.articleData.name = data.newName; // <-- Aggiorna con data
    marker.options.articleData.category = data.newCategory;
    console.log('Dati marker aggiornati:', marker.options.articleData);
}
// Poi nell'evento dragend:
marker.on('dragend', function(e) {
    const marker = e.target;
    const markerData = marker.options.articleData;
    const newPos = marker.getLatLng();
  
   // CERCA PRIMA 'id' POI '_id' (inverti l'ordine del controllo)
        const articleId = markerData.id || markerData._id;
        if (articleId) {
            saveMapChanges(articleId, newPos.lat, newPos.lng);
        } else {
            console.error("ID mancante. Dati marker completi:", markerData);
        }
});
      
    layerGroup.addLayer(marker);
   
});
         }
      });
   });
   
    // Crea i raggi collegando i nodi corrispondenti
    createRaggi(groupedArticles);
   // console.log("Grouped Markers 1:", groupedArticles);

    // Adatta la mappa per includere tutti i marker e polilinee
    const allLayers = L.featureGroup([layerGroup, drawnItems]);
    if (allLayers.getLayers().length > 0) {
        map.fitBounds(allLayers.getBounds());
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
                // console.log(`Connecting ${JSON.stringify(point1)} to ${JSON.stringify(point2)}`);

                const polyline = L.polyline([point1, point2], { color, weight });
                drawnItems.addLayer(polyline);
               // console.log(`Polilinea tra ${point1} e ${point2}`);
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
   // console.log("Original Triangles:", JSON.stringify(originalTriangles, null, 2));
   // console.log("Scaled1 Triangles:", JSON.stringify(scaled1Triangles, null, 2));
  //  console.log("Scaled2 Triangles:", JSON.stringify(scaled2Triangles, null, 2));
   // console.log("Original Triangles:", originalTriangles);
   // console.log("Scaled1 Triangles:", scaled1Triangles);
   // console.log("Scaled2 Triangles:", scaled2Triangles);
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
       
        function saveMapChanges(articleId, newLat, newLng) {
            if (!articleId) {
               // console.error("ID articolo mancante");
                return;
            }
        
            const parsedLat = parseFloat(newLat);
            const parsedLng = parseFloat(newLng);
            console.log("Salvataggio modifiche per:"), {
                articleId: articleId,
                latitudeSelectionee: parsedLat,  // Modificato qui
                longitudeSelectionee: parsedLng  // Modificato qui
            };
        
            fetch(`/api/articles/${articleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    latitudeSelectionee: parsedLat,  // Usa questi nomi
                    longitudeSelectionee: parsedLng  // che corrispondono al modello
                })
            })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    console.log("✅ Modifica salvata con successo", data);
                    // Aggiorna le coordinate localmente
                    const marker = layerGroup.getLayers().find(l => 
                        l.options.articleData.id === articleId || 
                        l.options.articleData._id === articleId
                    );
                    if (marker) {
                        marker.setLatLng([parsedLat, parsedLng]);
                    }
                } else {
                    console.error("Errore nel salvataggio:", data.message);
                }
            })
            .catch(error => {
                console.error("Errore durante il salvataggio:", error);
            });
        }

    // 1. INIZIALIZZA DATATABLES - SPOSTATO IN FONDO
    const table = $('#main-table').DataTable({
        pageLength: 20,
        language: {
            url: '//cdn.datatables.net/plug-ins/1.11.5/i18n/it-IT.json'
        }
    });

    // 2. GESTIONE CAMBIO ELEMENTI PER PAGINA
    $('#page-length').on('change', function() {
        table.page.len($(this).val()).draw();
    });

    // 3. AGGIORNA SELECT CON VALORE CORRENTE
    table.on('length.dt', function(e, settings, len) {
        $('#page-length').val(len);
    });

    // Aggiungi questi console.log per debug
    console.log("DataTables inizializzato:", table);
    console.log("Elementi nella tabella:", table.rows().count());

}); 