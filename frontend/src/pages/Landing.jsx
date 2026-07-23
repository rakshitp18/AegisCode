import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import Features from "../components/Features";
import TyndallParticles from "../components/ui/TyndallParticles";
import { useAuth } from "../contexts/AuthContext";

function Landing() {
  const navigate = useNavigate();
  const featuresRef = useRef(null);
  const { isAuthenticated, logout } = useAuth();
  const [isNavHovered, setIsNavHovered] = useState(false);

  const handleWorkspaceRedirect = () => {
    if (isAuthenticated()) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans relative overflow-x-hidden selection:bg-white selection:text-black scroll-smooth">
      
      {/* Tyndall Dust Particle Background */}
      <TyndallParticles className="z-0" />

      {/* Hero Section Container */}
      <div className="min-h-screen flex flex-col justify-between relative z-10 w-full pt-12">
        {/* 1. Header Navigation (Fixed top bar with hover-to-expand center tab) */}
        <header className="fixed top-0 left-0 right-0 h-12 bg-black border-b border-white/5 z-50">
          <div className="flex items-center justify-between px-6 h-full w-full max-w-7xl mx-auto relative">
            
            {/* Left: Brand Logo */}
            <div 
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2 font-bold text-sm tracking-tight select-none cursor-pointer"
            >
              <div className="flex gap-0.5">
                <div className="w-1 h-3.5 bg-white transform skew-x-[-15deg]"></div>
                <div className="w-1 h-3.5 bg-white transform skew-x-[-15deg]"></div>
              </div>
              <span>AegisCode</span>
            </div>
            
            {/* Center: Hover-to-Expand Hanging Tab */}
            <div className="absolute left-1/2 -translate-x-1/2 top-full -translate-y-[1px] z-50">
              <div
                onMouseEnter={() => setIsNavHovered(true)}
                onMouseLeave={() => setIsNavHovered(false)}
                className="group relative bg-black border-b border-x border-white/10 flex items-center justify-center transition-all duration-500 ease-out px-4 h-11 rounded-b-[22px] cursor-pointer"
                style={{ width: isNavHovered ? '370px' : '56px' }}
              >
                {/* Seamless top connection mask to cover header border-b */}
                <div className="absolute -top-[2px] left-0 right-0 h-[3px] bg-black z-20" />

                {/* Concave Left Corner */}
                <div
                  className="absolute top-0 right-full w-5 h-5 bg-transparent pointer-events-none z-10"
                  style={{
                    borderTopRightRadius: '20px',
                    boxShadow: '5px -5px 0 0 #000000',
                  }}
                />
                
                {/* Concave Right Corner */}
                <div
                  className="absolute top-0 left-full w-5 h-5 bg-transparent pointer-events-none z-10"
                  style={{
                    borderTopLeftRadius: '20px',
                    boxShadow: '-5px -5px 0 0 #000000',
                  }}
                />

                {/* Left Side Links (Slides out to the left) */}
                <div 
                  className={`flex gap-6 select-none text-[11px] font-semibold text-white/50 whitespace-nowrap transition-all duration-500 ease-out absolute top-1/2 -translate-y-1/2 ${
                    isNavHovered 
                      ? "right-[58%] opacity-100 pointer-events-auto translate-x-0 scale-100" 
                      : "right-1/2 translate-x-12 opacity-0 pointer-events-none scale-75"
                  }`}
                >
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-[11px] font-semibold"
                  >
                    Home
                  </button>
                  <button
                    onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-[11px] font-semibold"
                  >
                    About
                  </button>
                </div>

                {/* Center Stylized Shield / Slash Logo */}
                <div className="z-20 shrink-0 transition-transform duration-700 group-hover:rotate-[360deg] flex items-center justify-center w-8 h-8">
                  <svg className="w-5.5 h-5.5 text-white" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="11" />
                    <path d="M35 65 L65 35" stroke="currentColor" strokeWidth="11" strokeLinecap="round" />
                    <path d="M48 65 L65 48" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
                  </svg>
                </div>

                {/* Right Side Links (Slides out to the right) */}
                <div 
                  className={`flex gap-6 select-none text-[11px] font-semibold text-white/50 whitespace-nowrap transition-all duration-500 ease-out absolute top-1/2 -translate-y-1/2 ${
                    isNavHovered 
                      ? "left-[58%] opacity-100 pointer-events-auto translate-x-0 scale-100" 
                      : "left-1/2 -translate-x-12 opacity-0 pointer-events-none scale-75"
                  }`}
                >
                  <button
                    onClick={() => featuresRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-[11px] font-semibold"
                  >
                    Blog
                  </button>
                  <button
                    onClick={handleWorkspaceRedirect}
                    className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-[11px] font-semibold"
                  >
                    Contact
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Auth Controls */}
            <div className="flex items-center gap-4">
              {isAuthenticated() ? (
                <>
                  <button
                    onClick={logout}
                    className="text-xs text-white/60 hover:text-white font-semibold py-1 px-2 transition-colors cursor-pointer"
                  >
                    Log out
                  </button>
                  <button 
                    onClick={() => navigate("/workspace")}
                    className="flex items-center gap-1.5 bg-white text-black px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-white/90 active:scale-95 transition-all shadow-md cursor-pointer tracking-wider uppercase"
                  >
                    <span>Workspace</span>
                    <span className="text-xs font-light">→</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => navigate("/login")}
                    className="text-xs text-white/80 hover:text-white font-semibold py-1 px-2.5 transition-colors cursor-pointer"
                  >
                    Log in
                  </button>
                  <button 
                    onClick={handleWorkspaceRedirect}
                    className="flex items-center gap-1.5 bg-white text-black px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-white/90 active:scale-95 transition-all shadow-md cursor-pointer tracking-wider uppercase border border-white/10"
                  >
                    <span>Start Free</span>
                    <span className="text-xs font-light">→</span>
                  </button>
                </>
              )}
            </div>

          </div>
        </header>

        {/* 2. Hero Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest text-white/50 mb-6 font-semibold select-none">
            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
            AegisCode AI Analyzer
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-4 text-white/90 select-none">
            Automated codebase quality & architectural diagnostics.
          </h1>
          
          <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto leading-relaxed mb-8 select-none font-sans">
            Deploy deep multi-file AI scans to map architecture structures, reveal critical security flaws, identify performance bottlenecks, and refactor duplicate logic.
          </p>

          <div className="flex gap-4">
            <button 
              onClick={handleWorkspaceRedirect}
              className="bg-white text-black text-xs px-6 py-3 rounded-full font-bold hover:bg-white/95 transition-all cursor-pointer tracking-wider uppercase shadow-xl shadow-white/5 hover:scale-105"
            >
              Open Analyzer
            </button>
            <button 
              onClick={() => window.open("https://github.com", "_blank")}
              className="bg-[#141414] hover:bg-[#1a1a1a] text-white/80 hover:text-white border border-white/10 text-xs px-6 py-3 rounded-full font-semibold transition-all cursor-pointer tracking-wider uppercase hover:scale-105"
            >
              View on GitHub
            </button>
          </div>
        </div>

        {/* Bottom Spacing Spacer */}
        <div className="h-16"></div>
      </div>

      {/* 3. Features Section Container */}
      <div 
        ref={featuresRef}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 border-t border-white/5 bg-[#09090b]/40 backdrop-blur-md"
      >
        <Features />
      </div>

      {/* 4. Footer */}
      <footer className="relative z-10 flex flex-col sm:flex-row items-center justify-between p-8 max-w-7xl w-full mx-auto border-t border-white/5 gap-4">
        <div className="text-[10px] text-white/40 tracking-wider font-medium select-none">
          AegisCode Platform &copy; 2026. Built for secure, high-performance software auditing.
        </div>
        
        <div className="flex gap-6 text-[10px] text-white/40 font-semibold tracking-widest uppercase">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">System Status</a>
        </div>
      </footer>
    </div>
  );
}

export default Landing;