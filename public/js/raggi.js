// Variabile globale per la mappa e drawnItems
let map, drawnItems;

// Assicurati che la mappa sia inizializzata prima
if (!map) {
    map = L.map('map').setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);
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
