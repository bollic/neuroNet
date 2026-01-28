// public/js/zone.js — comune a indexZoneGeo e indexZoneParcelle

document.addEventListener("DOMContentLoaded", () => {
  console.log("zone.js loaded");

  const openProfileBtn = document.getElementById("open-profile");
  const goPlanBtn = document.getElementById("go-plan");

  const profileSection = document.getElementById("profile-section");
  const mapSection =
    document.getElementById("map-section") ||
    document.getElementById("map"); // Parcelles usa #map

  function openProfile() {
    if (!profileSection || !mapSection) return;

    mapSection.classList.add("hidden");
    profileSection.classList.remove("hidden");
  }

  function closeProfile() {
    if (!profileSection || !mapSection) return;

    profileSection.classList.add("hidden");
    mapSection.classList.remove("hidden");

    // Fix Leaflet resize
    if (window.map && typeof window.map.invalidateSize === "function") {
      setTimeout(() => window.map.invalidateSize(), 300);
    }
  }

  if (openProfileBtn) openProfileBtn.addEventListener("click", openProfile);
  if (goPlanBtn) goPlanBtn.addEventListener("click", closeProfile);

  // Chiudi profilo con ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeProfile();
  });

  // -----------------------------------------
  // Lettura di ?view= points/plan/parcelles
  // -----------------------------------------

  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");

  // Queste funzioni LE CREERAI DOPO in indexZoneGeo
  if (view === "points" && window.showPointsOnly) {
    window.showPointsOnly();
  }

  if (view === "plan" && window.showAllLayers) {
    window.showAllLayers();
  }
});
