import { initializeMap, updateMap } from './map.js';
import { initCategories } from './categories.js';

document.addEventListener("DOMContentLoaded", function () {
  initializeMap();

  document.addEventListener("categories:updated", (e) => {
  console.log("🔔 Evento categories:updated ricevuto", e.detail.categories);
  updateMap(); // usa window.POINTS + window.CATEGORIES aggiornate
});

  initCategories("category-list", "add-category", "categories-form");

  setTimeout(() => {
    map.invalidateSize();
    updateMap(window.POINTS);
  }, 200);

  // Event listener filtri
  $("#filter-category, #filter-date").on("change", function () {
    const filterCategory = $("#filter-category").val();
    const filterDate = $("#filter-date").val();
    updateMap(window.POINTS, filterCategory, filterDate);
  });

  // DataTables
  const dtPoints = (window.POINTS || []).map((p) => ({
    name: p.name,
    category: p.category,
    createdAtFormatted: p.createdAtFormatted,
    createdAtISO: p.createdAtISO,
    userEmail: p.userEmail || "❓utente sconosciuto",
    userId: p.userId || null,
    _id: p._id,
  }));

  $("#main-table").DataTable({
    data: dtPoints,
    columns: [
      { data: 'name', title: 'Name' },
      { data: 'category', title: 'Categorie' },
      { data: 'createdAtFormatted', title: 'Date' },
      { data: 'createdAtISO', visible: false },
    ],
    order: [[1, 'asc']],
  });
});
