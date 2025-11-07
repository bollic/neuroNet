
// /public/js/toast.js
(function() {
  // Inietta il CSS dell’animazione se non esiste già
  if (!document.getElementById('toast-animation-style')) {
    const style = document.createElement('style');
    style.id = 'toast-animation-style';
    style.innerHTML = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .animate-fadeIn {
        animation: fadeIn 0.3s ease-out;
      }
    `;
    document.head.appendChild(style);
  }

  window.showToast = function(message, type = "success", duration = 7000) {
    const toast = document.createElement("div");
    toast.textContent = message;

    const bgColor =
      type === "error" ? "bg-red-600" :
      type === "warning" ? "bg-yellow-500 text-black" :
      type === "info" ? "bg-blue-600" :
      "bg-green-600";

    toast.className = `
      fixed top-4 right-4 z-50
      ${bgColor} text-white px-4 py-2 rounded-2xl shadow-lg
      animate-fadeIn
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = "opacity 0.8s";
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 800);
    }, duration);
  };
})();
