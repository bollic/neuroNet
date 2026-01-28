

// services/categoryService.js
function validateCategory(office, category) {
  const clean = (category || "").trim();
  const found = office.categories.find(
    c => c.name.trim() === clean
  );

  if (!found) {
    throw new Error("Categoria non valida");
  }

  return {
    name: clean,
    icon: found.icon || "❓"
  };
}

module.exports = { validateCategory };