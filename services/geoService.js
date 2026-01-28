// services/geoService.js
function parsePolygonGeoJSON(polygonInput) {
  let geo;

  if (typeof polygonInput === "string") {
    try {
      geo = JSON.parse(polygonInput);
    } catch {
      throw new Error("GeoJSON non valido (parse fallito)");
    }
  } else {
    geo = polygonInput;
  }

  // Se arriva solo la geometry, la trasformiamo in Feature
  if (geo?.type === "Polygon" && Array.isArray(geo.coordinates)) {
    geo = {
      type: "Feature",
      geometry: geo,
      properties: {}
    };
  }

  if (
    !geo ||
    geo.type !== "Feature" ||
    !geo.geometry ||
    geo.geometry.type !== "Polygon" ||
    !Array.isArray(geo.geometry.coordinates) ||
    !Array.isArray(geo.geometry.coordinates[0])
  ) {
    throw new Error("GeoJSON Polygon non valido");
  }

 // ✅ RING DEFINITO UNA SOLA VOLTA
  const ring = geo.geometry.coordinates[0];

  if (ring.length < 3) {
    throw new Error("Un poligono deve avere almeno 3 punti");
  }

  // 🔒 chiusura automatica se manca
  const first = ring[0];
  const last = ring[ring.length - 1];

  const isClosed =
    first[0] === last[0] &&
    first[1] === last[1];

  const closedRing = isClosed ? ring : [...ring, first];

  return {
    geometry: {
      type: "Polygon",
      coordinates: [closedRing]
    },
    // ⬅️ NON contiamo il punto duplicato finale
    verticesCount: closedRing.length - 1
  };
}
function parsePointGeoJSON(pointInput) {
  let geo;

  if (typeof pointInput === "string") {
    try {
      geo = JSON.parse(pointInput);
    } catch {
      throw new Error("GeoJSON non valido (parse fallito)");
    }
  } else {
    geo = pointInput;
  }

  if (
    !geo ||
    geo.type !== "Feature" ||
    !geo.geometry ||
    geo.geometry.type !== "Point" ||
    !Array.isArray(geo.geometry.coordinates) ||
    geo.geometry.coordinates.length !== 2
  ) {
    throw new Error("GeoJSON Point non valido");
  }

  const [lng, lat] = geo.geometry.coordinates;

  if (typeof lng !== "number" || typeof lat !== "number") {
    throw new Error("Coordinate non valide");
  }

  return { lng, lat };
}

module.exports = { parsePointGeoJSON,
  parsePolygonGeoJSON };
