import { useEffect } from "react";

function AlertModal({ isOpen, onClose, message, title = "Notification" }) {
  // Close on Escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md transition-opacity duration-300"
      onClick={onClose}
    >
      <div 
        className="relative bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl shadow-blue-900/20 max-w-md w-full p-6 text-center transform transition-all duration-300 scale-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking modal content
      >
        {/* Subtle decorative glow */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Warning/Alert Icon */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-950 border border-blue-800/50 mb-4 text-blue-400">
          <svg 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={2}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
        </div>

        {/* Modal Title */}
        <h3 className="text-xl font-semibold text-slate-100 mb-2">
          {title}
        </h3>

        {/* Modal Message */}
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          {message}
        </p>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-xl shadow-lg shadow-blue-600/15 transition-all duration-200 active:scale-98"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export default AlertModal;
