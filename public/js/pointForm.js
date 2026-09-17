
// public/js/pointForm.js

export function initPointForm(points, mapFunctions) {

window.editPoint = function (id) {

  const point = points.find(p => p._id === id);

  if (!point) {
    console.warn("❌ Point introuvable:", id);
    return;
  }

  window.currentEditPoint = point;

  console.log("✏️ Modification du point:", point);
  console.log("ATTRIBUTES =", point.attributes);
  // ==========================================
  // RIEMPI I CAMPI DINAMICI DELL'OBSERVATION
  // ==========================================

  document
    .querySelectorAll(".edit-observation-field")
    .forEach(field => {

      const fieldName = field.dataset.fieldName;

      const value = point.attributes?.[fieldName];

      console.log(
        "🧩 Campo observation:",
        fieldName,
        "=>",
        value
      );

      if (field.type === "checkbox") {

        field.checked = !!value;

      } else {

        field.value = value ?? "";

      }

    });
  document.getElementById("edit-name").value =
    point.name || "";

  document.getElementById("edit-category").value =
    point.category || "";

  document.getElementById("edit-description").value =
    point.description || "";

  // Ouvrir le modal DaisyUI
  const modal = document.getElementById("edit-modal");

  if (modal) {
    modal.checked = true;
  }
};

  window.saveEdit = async function () {
    if (!window.currentEditPoint) return;
  
  // ==========================================
// RACCOGLI I CAMPI DINAMICI OBSERVATION
// ==========================================

const attributes = {};

document
  .querySelectorAll(".edit-observation-field")
  .forEach(field => {

    const fieldName = field.dataset.fieldName;

    if (!fieldName) return;

    if (field.type === "checkbox") {

      attributes[fieldName] = field.checked;

    } else if (field.type === "number") {

      attributes[fieldName] =
        field.value === ""
          ? null
          : Number(field.value);

    } else {

      attributes[fieldName] = field.value;
    }
  });


// ==========================================
// DONNÉES DU POINT À ENVOYER
// ==========================================

const updatedData = {

  name: document.getElementById("edit-name").value,

  description:
    document.getElementById("edit-description").value,

  category:
    document.getElementById("edit-category").value,

  attributes: attributes,

  point: JSON.stringify({
    type: "Feature",

    geometry: {
      type: "Point",
      coordinates: window.currentEditPoint.coordinates
    }

  })

};
    const res = await fetch(`/points/${window.currentEditPoint._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updatedData)
    });
  
  const data = await res.json();
  if (!data.success) {
    console.log("❌ update failed:", data.message);
    return;
  }
  
  const updatedPoint = data.point;
  
    // aggiorna array locale
    const index = points.findIndex(p => p._id === updatedPoint._id);
    if (index !== -1) {
      points[index] = updatedPoint;
    }
  
    // chiudi modal
    document.getElementById("edit-modal").checked = false;
  // pulizia globale DaisyUI
  document.body.classList.remove("modal-open");
  document.querySelectorAll(".modal").forEach(m => {
    m.classList.remove("modal-open");
  });
  
  
  // 🔥 QUESTO È QUELLO CHE TI MANCAVA
  // panel nuovo sistema
 
  
  // sicurezza scroll / blocchi
  document.body.style.overflow = "auto";
  document.body.style.pointerEvents = "auto";
    mapFunctions.resetMarkersMap();
mapFunctions.updateMap();
mapFunctions.updateTable();
    //resetMarkersMap();
    // refresh UI
    //updateMap();
   // updateTable();
  };

  window.closeForm = function () {
  const panel = document.getElementById("form-panel");
  if (!panel) return;
  document.getElementById("open-add-point")
    ?.classList.remove("hidden");

  document.getElementById("quick-add-point")
    ?.classList.remove("hidden");

  panel.classList.add("hidden");
  panel.classList.remove("active");

  console.log("CLOSE CLICK OK");
};



}