import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

/* ── Minimal SVG icon buttons ─────────────────────────────────── */
function NavIconBtn({ onClick, title, isActive, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={[
        "group relative flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-150 cursor-pointer",
        isActive
          ? "bg-white/12 text-white"
          : "text-white/45 hover:text-white/90 hover:bg-white/8",
      ].join(" ")}
    >
      {children}
      {/* Tooltip */}
      <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-900/95 border border-white/10 px-2 py-0.5 text-[10px] text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-100 z-50">
        {title}
      </span>
    </button>
  );
}

/* ── Icons ───────────────────────────────────────────────────── */
function IcoHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IcoFolder() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <line x1="9" y1="14" x2="15" y2="14" />
    </svg>
  );
}

function IcoAnalysis() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function IcoChat() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

/* ── Navbar ──────────────────────────────────────────────────── */
function Navbar({ onOpenFolder, onShowDashboard, onAIChat, currentFileId }) {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const isAnalysisActive = onOpenFolder && currentFileId === null;

  return (
    <nav className="grid grid-cols-3 items-center px-6 py-2.5 bg-[#0a0a0d]/95 border-b border-white/5 shrink-0 select-none z-40">

      {/* Col 1: Brand */}
      <div
        onClick={() => navigate(isAuthenticated() ? "/dashboard" : "/")}
        className="flex items-center gap-2 font-bold text-sm tracking-tight cursor-pointer hover:opacity-80 transition-opacity text-white w-fit"
      >
        <div className="flex gap-0.5">
          <div className="w-1 h-3.5 bg-white transform skew-x-[-15deg]" />
          <div className="w-1 h-3.5 bg-white transform skew-x-[-15deg]" />
        </div>
        <span>AegisCode</span>
      </div>

      {/* Col 2: Nav actions (workspace only) */}
      <div className="flex justify-center items-center gap-1">
        {onOpenFolder && (
          <>
            {/* Divider */}
            <div className="flex items-center gap-1 bg-white/4 border border-white/8 rounded-xl px-1.5 py-1 gap-0.5">
              <NavIconBtn onClick={() => navigate("/dashboard")} title="Home">
                <IcoHome />
              </NavIconBtn>

              <div className="w-px h-4 bg-white/10 mx-0.5" />

              <NavIconBtn onClick={onOpenFolder} title="Upload Folder">
                <IcoFolder />
              </NavIconBtn>

              <NavIconBtn onClick={onShowDashboard} title="Project Analysis" isActive={isAnalysisActive}>
                <IcoAnalysis />
              </NavIconBtn>

              <NavIconBtn onClick={onAIChat} title="AI Chat">
                <IcoChat />
              </NavIconBtn>
            </div>
          </>
        )}
      </div>

      {/* Col 3: User */}
      <div className="flex items-center gap-3 justify-end">
        {isAuthenticated() ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/30 font-mono hidden sm:inline">{user?.email}</span>
            <button
              onClick={() => { logout(); navigate("/"); }}
              className="text-xs text-white/45 hover:text-white/85 border border-white/8 hover:border-white/18 font-medium py-1.5 px-3 rounded-lg transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="text-xs bg-white text-black font-bold py-1.5 px-3.5 rounded-lg hover:bg-white/90 transition-colors cursor-pointer"
          >
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}

export default Navbar;