


// public/js/mapLayers.js

const layers = {};


async function loadGeoJsonLayer(map, name, file, options = {}) {

  try {

    const response = await fetch(`/data/${file}`);
    const geojson = await response.json();

    layers[name] = L.geoJSON(geojson, options);

    layers[name].addTo(map);

    console.log(`✅ ${name}:`, geojson.features.length);

    return layers[name];

  } catch (err) {

    console.error(`Erreur ${name}:`, err);

    return null;

  }

}
/*
export async function loadBuildings(map) {

  try {

    const response = await fetch("/data/buildings_bagatelle.geojson");
    const geojson = await response.json();

     buildingsLayer = L.geoJSON(geojson, {
      style: {
        color: "#666",
        weight: 1,
        fillColor: "#d9d9d9",
        fillOpacity: 0.35
      }
    });

    buildingsLayer.addTo(map);

    console.log("🏢 Bâtiments chargés :", geojson.features.length);

    return buildingsLayer;

  } catch (err) {

    console.error("Erreur bâtiments :", err);

    return null;
  }

}

export function getBuildingsLayer() {
    return buildingsLayer;
}*/

export function loadBuildings(map) {
  return loadGeoJsonLayer(
    map,
    "buildings",
    "buildings_bagatelle.geojson",
    {
      style: {
        color: "#666",
        weight: 1,
        fillColor: "#d9d9d9",
        fillOpacity: 0.35
      }
    }
  );
}

export function loadParking(map) {
  return loadGeoJsonLayer(
    map,
    "parking",
    "parkings_bagatelle.geojson",
    {
      style: {
        color: "#3366ff",
        weight: 1,
        fillColor: "#66aaff",
        fillOpacity: 0.45
      }
    }
  );
}

export function loadRoads(map) {
  return loadGeoJsonLayer(
    map,
    "roads",
    "highway residential_bagatelle.geojson",
    {
      style: {
        color: "#ffffff",
        weight: 2
      }
    }
  );
}

export function loadBikePaths(map) {
  return loadGeoJsonLayer(
    map,
    "bikePaths",
    "highway cycleway_bagatelle.geojson",
    {
      style: {
        color: "#00aa00",
        weight: 3
      }
    }
  );
}

export async function loadBaseLayers(map) {

  await loadBuildings(map);
  await loadParking(map);
  await loadRoads(map);
  await loadBikePaths(map);

  // -------------------
  // Contrôle des couches
  // -------------------

  [
    ["toggle-buildings", "buildings"],
    ["toggle-parking", "parking"],
    ["toggle-roads", "roads"],
    ["toggle-bikePaths", "bikePaths"]
  ].forEach(([checkboxId, layerName]) => {

    document
      .getElementById(checkboxId)
      ?.addEventListener("change", e => {

        const layer = getLayer(layerName);

        if (!layer) return;

        if (e.target.checked) {
          map.addLayer(layer);
        } else {
          map.removeLayer(layer);
        }

      });

  });

}

export function getLayer(name) {
  return layers[name];
}