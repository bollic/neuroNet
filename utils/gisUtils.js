const fs = require("fs");
const path = require("path");

function loadBuildings() {

    const filePath = path.join(
        __dirname,
        "../public/data/buildings_bagatelle.geojson"
    );

    const data = fs.readFileSync(filePath, "utf8");

    return JSON.parse(data);
}

module.exports = {
    loadBuildings
};