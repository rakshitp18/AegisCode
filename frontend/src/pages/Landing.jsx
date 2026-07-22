import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import Features from "../components/Features";
import { PixelCanvas } from "../components/ui/PixelCanvas";

function Landing() {
  const navigate = useNavigate();
  const featuresRef = useRef(null);
  const [activeTab, setActiveTab] = useState("Home");

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans relative overflow-x-hidden selection:bg-white selection:text-black scroll-smooth">
      
      {/* Dynamic Background Pixel Canvas */}
      <PixelCanvas 
        className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-55"
        variant="glow"
        colors={["#3b82f6", "#f1f5f9", "#10b981"]}
        gap={7}
        speed={0.022}
      />

      {/* Hero Section Container */}
      <div className="min-h-screen flex flex-col justify-between relative z-10 w-full">
        {/* 1. Header Navigation */}
        <header className="flex items-center justify-between p-6 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-10">
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight select-none">
              <div className="flex gap-0.5">
                <div className="w-1.5 h-4 bg-white transform skew-x-[-15deg]"></div>
                <div className="w-1.5 h-4 bg-white transform skew-x-[-15deg]"></div>
              </div>
              AegisCode
            </div>
            
            <nav className="hidden md:flex gap-1.5 bg-[#141414]/60 border border-white/5 p-1 rounded-full backdrop-blur-md">
              {["Home", "Features", "Docs"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === "Home") {
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    } else if (tab === "Features") {
                      featuresRef.current?.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    activeTab === tab 
                      ? "bg-white text-black font-semibold" 
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div>
            <button 
              onClick={() => navigate("/workspace")}
              className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-full text-xs font-bold hover:bg-white/90 active:scale-95 transition-all shadow-md cursor-pointer tracking-wider uppercase"
            >
              <span>Start Workspace</span>
              <span className="text-sm font-light">→</span>
            </button>
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
              onClick={() => navigate("/workspace")}
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