// public/js/service.js
import { initializeMap } from "./mapCore.js";

let userPosition = null;

document.addEventListener("userLocated", (e) => {
    userPosition = e.detail;
    console.log("📍 Position mémorisée :", userPosition);
});

document.addEventListener("DOMContentLoaded", () => {

    const res = initializeMap();
    const map = res.map;

    const buttons = document.querySelectorAll(".category-btn");
    console.log("Catégories trouvées :", buttons.length);

      buttons.forEach(button => {

        button.addEventListener("click", async () => {

            if (!userPosition) {
                alert("Utilisez d'abord votre position.");
                return;
            }

            const category = button.dataset.category;


            const formData = new FormData();

formData.append("name", "📍 Signalement");

formData.append("category", category);

formData.append("description", "");
formData.append("groupId", window.location.pathname.split("/").pop());

formData.append(
    "point",
    JSON.stringify({
        type: "Feature",
        geometry: {
            type: "Point",
            coordinates: [
                userPosition.lng,
                userPosition.lat
            ]
        }
    })
);
            console.log("Catégorie :", category);

            try {
              
                    const res = await fetch("/service/addPoint", {
                        method: "POST",
                        body: formData,
                        credentials: "include"
                    });
               

                const data = await res.json();

                if (!data.success) {
                    alert(data.message || "Erreur");
                    return;
                }

                alert("✅ Signalement envoyé");
                console.log("Point créé :", data.point);

            } catch (err) {
                console.error("Erreur création point :", err);
            }
});
/*
        button.addEventListener("click", () => {

            if (!userPosition) {
                alert("Utilisez d'abord votre position.");
                return;
            }

            console.log("Catégorie :", button.dataset.category);

        });
*/
    });

});

