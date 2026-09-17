// public/js/mobileService.js

export function initMobileServiceTracking(
    map,
    points,
    currentUserId,
    getPointUserId
) {

    const notifiedPoints = new Set();

    console.log("🚚 Tracking camion attivato");

    const truckIcon = L.divIcon({
        html: "🚚",
        className: "truck-icon",
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    setInterval(async () => {

        try {

            const response = await fetch('/api/driver-position');

            if (!response.ok) {
                console.log(
                    "❌ Erreur API driver-position:",
                    response.status
                );
                return;
            }

            const driverPosition = await response.json();

            console.log("🚚 Posizione camion:", driverPosition);

            if (!driverPosition) {
                console.log("🚚 Aucun chauffeur disponible");
                return;
            }

            const { lat, lng } = driverPosition;

            if (lat == null || lng == null) {
                console.log("🚚 Position camion invalide");
                return;
            }

            // 🚚 MARKER CAMION
            if (!window.truckMarker) {

                window.truckMarker = L.marker(
                    [lat, lng],
                    {
                        icon: truckIcon
                    }
                ).addTo(map);

            } else {

                window.truckMarker.setLatLng([lat, lng]);

            }

            // 📍 SOLO I MIEI PUNTI
            const myPoints = points.filter(p => {

                const userId = getPointUserId(p);

                return String(userId) === String(currentUserId);

            });

            // 📏 DISTANZE
            myPoints.forEach(point => {

                const distance = map.distance(
                    [lat, lng],
                    [
                        point.coordinates[1],
                        point.coordinates[0]
                    ]
                );

                console.log(
                    `🚚 → ${point.name}: ${Math.round(distance)} m`
                );

                // 🔔 NOTIFICA
                if (
                    distance < 100 &&
                    !notifiedPoints.has(point._id)
                ) {

                    notifiedPoints.add(point._id);

                    if (
                        document.getElementById(
                            "truck-notification"
                        )
                    ) {
                        return;
                    }

                    const notif = document.createElement("div");

                    notif.id = "truck-notification";

                    notif.textContent =
                        `🚚 Il camion est proche de ${point.name}`;

                    notif.className =
                        "fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-3 rounded-xl shadow-xl z-[9999]";

                    document.body.appendChild(notif);
                }

                if (distance >= 100) {
                    notifiedPoints.delete(point._id);
                }

            });

        } catch (err) {

            console.error(
                "❌ Erreur récupération camion:",
                err
            );

        }

    }, 10000);
}