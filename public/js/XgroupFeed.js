// groupFeed.js
async function loadGroupFeed() {
    try {
        const feed = document.getElementById('group-feed');
        if (!feed) return; // se il div non esiste, esci subito

        const groupId = feed.dataset.groupId;
        if (!groupId) {
            console.warn("⚠️ groupId non trovato nel DOM");
            return;
        }

        const res = await fetch(`/groups/${groupId}/feed`, {
            credentials: "include"
        });

        if (!res.ok) throw new Error("Errore HTTP " + res.status);

        const html = await res.text();
        const oldHeight = feed.scrollHeight;
        feed.innerHTML = html;

        // Scroll automatico se il feed cresce
        if (feed.scrollHeight > oldHeight) {
            feed.scrollTop = feed.scrollHeight;
        }
    } catch (err) {
        console.error("❌ Errore caricamento feed:", err);
    }
}

// Carica al DOM ready
document.addEventListener('DOMContentLoaded', loadGroupFeed);

// Aggiorna ogni 30 minuti (30 * 60 * 1000 ms)
setInterval(loadGroupFeed, 30 * 60 * 1000);
