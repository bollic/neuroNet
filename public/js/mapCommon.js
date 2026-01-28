
export function createEmojiMarker(latlng, emoji) {
  return L.marker(latlng, {
    icon: new L.divIcon({
      html: `<div style="font-size:22px;">${emoji}</div>`,
      className: '',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    })
  });
}

// mapCommon.js
    // 🔄 Aggiorna le categorie all’avvio
   export async function loadCategories() {
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            if (data.success) {
                window.CATEGORIES = data.categories;
                console.log("✅ Categorie aggiornate:", data.categories);
            } else {
                console.warn("⚠️ Nessuna categoria trovata");
            }
        } catch (err) {
            console.error("❌ Errore fetch categorie:", err);
        }
    }

export  function getIconForCategory(categoryName) {
  if (!window.CATEGORIES || !Array.isArray(window.CATEGORIES)) return '🔴';
  const match = window.CATEGORIES.find(c => c.name === categoryName);
  if (!match) return '🔴';

  const iconKey = match.icon;
  const iconMap = {
    "🟥": "🚚",
    "🟧": "🏠",
    "🟨": "🏪",
    "🟩": "🌳",
    "🟦": "🏭",
    "truck": "🚚",
    "home": "🏠",
    "shop": "🏪",
    "tree": "🌳",
    "factory": "🏭"
  };
  return iconMap[iconKey] || iconKey || '🔴';
}


export function getIconEmoji(point) {
  // 1️⃣ se il punto ha già un'emoji → usala
  if (point.icon && point.icon.trim() !== "") {
    return point.icon;
  }

  // 2️⃣ fallback sulle categorie
  const cat = (window.CATEGORIES || []).find(
    c => c.name.toUpperCase() === point.category.toUpperCase()
  );
   console.log("getIconEmoji:", point.name, "category:", point.category, "matched cat:", cat);

  if (cat && cat.icon) {
    return cat.icon;
  }

  // 3️⃣ fallback finale
  return "📌";
}