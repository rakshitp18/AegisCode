import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import Features from "../components/Features";
import TyndallParticles from "../components/ui/TyndallParticles";
import { useAuth } from "../contexts/AuthContext";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Cloud, Code, Cpu, Globe, Lock, Zap, User, FolderOpen, ShieldCheck } from "lucide-react";
import { cn } from "../lib/utils";
import AuthModal from "../components/common/AuthModal";

const TILT_MAX = 9;
const TILT_SPRING = { stiffness: 300, damping: 28 };
const GLOW_SPRING = { stiffness: 180, damping: 22 };

function SpotlightCard({ icon: Icon, title, description, stepNumber, color, dimmed, onHoverStart, onHoverEnd }) {
  const cardRef = useRef(null);

  const normX = useMotionValue(0.5);
  const normY = useMotionValue(0.5);

  const rawRotateX = useTransform(normY, [0, 1], [TILT_MAX, -TILT_MAX]);
  const rawRotateY = useTransform(normX, [0, 1], [-TILT_MAX, TILT_MAX]);

  const rotateX = useSpring(rawRotateX, TILT_SPRING);
  const rotateY = useSpring(rawRotateY, TILT_SPRING);
  const glowOpacity = useSpring(0, GLOW_SPRING);

  const handleMouseMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    normX.set((e.clientX - rect.left) / rect.width);
    normY.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseEnter = () => {
    glowOpacity.set(1);
    if (onHoverStart) onHoverStart();
  };

  const handleMouseLeave = () => {
    normX.set(0.5);
    normY.set(0.5);
    glowOpacity.set(0);
    if (onHoverEnd) onHoverEnd();
  };

  return (
    <motion.div
      animate={{
        scale: dimmed ? 0.96 : 1,
        opacity: dimmed ? 0.4 : 1,
      }}
      className={cn(
        "group relative flex flex-col gap-5 overflow-hidden rounded-3xl border p-6 select-none",
        "border-white/5 bg-[#141417]/35 backdrop-blur-sm",
        "transition-[border-color] duration-300",
        "hover:border-white/15"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      ref={cardRef}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 900,
      }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {/* Static accent tint — always visible */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{
          background: `radial-gradient(ellipse at 20% 20%, ${color}08, transparent 65%)`,
        }}
      />

      {/* Hover glow layer */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{
          opacity: glowOpacity,
          background: `radial-gradient(ellipse at 20% 20%, ${color}1e, transparent 65%)`,
        }}
      />

      {/* Shimmer sweep */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[55%] -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[280%]"
      />

      {/* Icon/Step Badge */}
      <div className="flex justify-between items-center relative z-10">
        {Icon ? (
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: `${color}14`,
              boxShadow: `inset 0 0 0 1px ${color}25`,
            }}
          >
            <Icon size={17} strokeWidth={1.9} style={{ color: color }} />
          </div>
        ) : (
          <div />
        )}
        {stepNumber && (
          <span className="text-[28px] font-black text-white/5 font-mono select-none group-hover:text-white/10 transition-colors">
            {stepNumber}
          </span>
        )}
      </div>

      {/* Text */}
      <div className="relative z-10 flex flex-col gap-2">
        <h3 className="font-semibold text-[14px] text-white tracking-tight">
          {title}
        </h3>
        <p className="text-[12px] text-white/50 leading-relaxed font-sans font-light">
          {description}
        </p>
      </div>

      {/* Accent bottom line */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full transition-all duration-500 group-hover:w-full"
        style={{
          background: `linear-gradient(to right, ${color}80, transparent)`,
        }}
      />
    </motion.div>
  );
}

function Landing() {
  const navigate = useNavigate();
  const featuresRef = useRef(null);
  const aboutRef = useRef(null);
  const guideRef = useRef(null);
  const { isAuthenticated, logout } = useAuth();
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [hoveredAboutTitle, setHoveredAboutTitle] = useState(null);
  const [hoveredGuideStep, setHoveredGuideStep] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState("login");

  const [scrollRotation, setScrollRotation] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollRotation((window.scrollY * 0.45) % 360);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openLoginModal = () => {
    setAuthModalMode("login");
    setIsAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalMode("register");
    setIsAuthModalOpen(true);
  };

  const handleWorkspaceRedirect = () => {
    if (isAuthenticated()) {
      navigate("/dashboard");
    } else {
      openRegisterModal();
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans relative overflow-x-hidden selection:bg-white selection:text-black scroll-smooth">
      
      {/* Tyndall Dust Particle Background */}
      <TyndallParticles className="z-0" />

      {/* 1. Header Navigation (Fixed transparent bar with floating center menu) */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-transparent z-[100]">
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
          
          {/* Center: Hover-to-Expand Floating Pill */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
            <div
              onMouseEnter={() => setIsNavHovered(true)}
              onMouseLeave={() => setIsNavHovered(false)}
              className="group relative bg-[#141417]/85 border border-white/10 flex items-center justify-center transition-all duration-500 ease-out px-4 h-10 rounded-full cursor-pointer backdrop-blur-md"
              style={{ width: isNavHovered ? '370px' : '44px' }}
            >
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
                  Features
                </button>
              </div>

              {/* Center Stylized Shield / Slash Logo */}
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="z-20 shrink-0 flex items-center justify-center w-7 h-7 cursor-pointer hover:scale-110 active:scale-95"
              >
                <svg 
                  className="w-5 h-5 text-white transition-transform duration-300"
                  style={{ transform: `rotate(${scrollRotation}deg)` }}
                  viewBox="0 0 100 100" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
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
                  onClick={() => aboutRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-[11px] font-semibold"
                >
                  About
                </button>
                <button
                  onClick={() => guideRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-[11px] font-semibold"
                >
                  Guide
                </button>
              </div>
            </div>
          </div>

          {/* Right: Auth Controls */}
          <div className="flex items-center gap-4">
            {isAuthenticated() ? (
              <>
                <button
                  onClick={() => logout(true)}
                  className="text-xs text-white/60 hover:text-white font-semibold py-1 px-2 transition-colors cursor-pointer"
                >
                  Log out
                </button>
                <button 
                  onClick={() => navigate("/dashboard")}
                  className="flex items-center gap-1.5 bg-white text-black px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-white/90 active:scale-95 transition-all shadow-md cursor-pointer tracking-wider uppercase"
                >
                  <span>Workspace</span>
                  <span className="text-xs font-light">→</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={openLoginModal}
                  className="text-xs text-white/80 hover:text-white font-semibold py-1 px-2.5 transition-colors cursor-pointer"
                >
                  Log in
                </button>
                <button 
                  onClick={openRegisterModal}
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

      {/* Auth Modal Popup Overlay */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Hero Section Container */}
      <div className="min-h-screen flex flex-col justify-between relative z-10 w-full pt-16">
        {/* 2. Hero Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-widest text-white/50 mb-6 font-semibold select-none">
            <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>
            AegisCode AI Analyzer
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-4 text-white/90 select-none">
            Smart repository auditing & AI code intelligence.
          </h1>
          
          <p className="text-sm sm:text-base text-white/60 max-w-xl mx-auto leading-relaxed mb-8 select-none font-sans">
            Import GitHub projects to automatically analyze structure, find bugs, review code, and chat with files.
          </p>

          <div className="flex justify-center">
            <button 
              onClick={handleWorkspaceRedirect}
              className="bg-white text-black text-xs px-6 py-3 rounded-full font-bold hover:bg-white/95 transition-all cursor-pointer tracking-wider uppercase shadow-xl shadow-white/5 hover:scale-105"
            >
              Open Analyzer
            </button>
          </div>
        </div>

        {/* Bottom Spacing Spacer */}
        <div className="h-16"></div>
      </div>

      {/* 3. Features Section Container */}
      <div 
        ref={featuresRef}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12"
      >
        <Features />
      </div>

      {/* 4. About Section Container */}
      <div 
        ref={aboutRef}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24"
      >
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase text-white/90">
              About AegisCode
            </h2>
            <div className="w-12 h-1 bg-white mx-auto rounded-full"></div>
            <p className="text-xs uppercase tracking-widest text-white/40 font-semibold pt-1">
              Secure Codebase Auditing & Architectural Intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 pt-4">
            <SpotlightCard
              icon={Cpu}
              title="AegisCode vs Other AI Agents"
              description="Generic AI agents review single files in isolation without compiling contextual scopes. AegisCode builds a unified multi-file dependency representation, cross-referencing imports, calls, and files to detect deep structural vulnerabilities."
              color="#38bdf8"
              dimmed={hoveredAboutTitle !== null && hoveredAboutTitle !== "AegisCode vs Other AI Agents"}
              onHoverStart={() => setHoveredAboutTitle("AegisCode vs Other AI Agents")}
              onHoverEnd={() => setHoveredAboutTitle(null)}
            />
            <SpotlightCard
              icon={Globe}
              title="Deep AST Static Diagnostics"
              description="Instead of relying purely on LLM guesses, AegisCode merges AI intelligence with physical AST metric analyzers. We calculate exact method complexity, line statistics, and modular duplication scores for precise audits."
              color="#f59e0b"
              dimmed={hoveredAboutTitle !== null && hoveredAboutTitle !== "Deep AST Static Diagnostics"}
              onHoverStart={() => setHoveredAboutTitle("Deep AST Static Diagnostics")}
              onHoverEnd={() => setHoveredAboutTitle(null)}
            />
            <SpotlightCard
              icon={ShieldCheck}
              title="Active Integrated Workspace"
              description="Other agents output passive markdown text guidelines. AegisCode embeds a full, interactive code explorer workspace and code editor, allowing developers to inspect logs, query chat context, and navigate codebase elements seamlessly."
              color="#f472b6"
              dimmed={hoveredAboutTitle !== null && hoveredAboutTitle !== "Active Integrated Workspace"}
              onHoverStart={() => setHoveredAboutTitle("Active Integrated Workspace")}
              onHoverEnd={() => setHoveredAboutTitle(null)}
            />
          </div>
        </div>
      </div>

      {/* 5. Guide Section Container */}
      <div 
        ref={guideRef}
        className="relative z-10 w-full max-w-7xl mx-auto px-6 py-24"
      >
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight uppercase text-white/90">
              Getting Started Guide
            </h2>
            <div className="w-12 h-1 bg-white mx-auto rounded-full"></div>
            <p className="text-xs uppercase tracking-widest text-white/40 font-semibold pt-1">
              Six Simple Steps to Codebase Security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
            <SpotlightCard
              stepNumber="01"
              icon={User}
              title="Register Profile"
              description="Create a secure developer profile or login to access your custom code analytics dashboard."
              color="#38bdf8"
              dimmed={hoveredGuideStep !== null && hoveredGuideStep !== "01"}
              onHoverStart={() => setHoveredGuideStep("01")}
              onHoverEnd={() => setHoveredGuideStep(null)}
            />
            <SpotlightCard
              stepNumber="02"
              icon={FolderOpen}
              title="Sync Workspace"
              description="Drop your local project folder directly into the drag upload zone, or paste a public GitHub URL to sync repositories recursively."
              color="#f59e0b"
              dimmed={hoveredGuideStep !== null && hoveredGuideStep !== "02"}
              onHoverStart={() => setHoveredGuideStep("02")}
              onHoverEnd={() => setHoveredGuideStep(null)}
            />
            <SpotlightCard
              stepNumber="03"
              icon={Globe}
              title="Explore Directory"
              description="Review and manage the full project workspace hierarchy inside our VS Code-style recursive file tree explorer."
              color="#34d399"
              dimmed={hoveredGuideStep !== null && hoveredGuideStep !== "03"}
              onHoverStart={() => setHoveredGuideStep("03")}
              onHoverEnd={() => setHoveredGuideStep(null)}
            />
            <SpotlightCard
              stepNumber="04"
              icon={Zap}
              title="Run AI Audits"
              description="Launch single-file static analysis diagnostics, full-project architecture scans, or ask code-context queries."
              color="#a78bfa"
              dimmed={hoveredGuideStep !== null && hoveredGuideStep !== "04"}
              onHoverStart={() => setHoveredGuideStep("04")}
              onHoverEnd={() => setHoveredGuideStep(null)}
            />
            <SpotlightCard
              stepNumber="05"
              icon={Lock}
              title="Inspect Reports"
              description="Read detailed diagnostic logs highlighting security vulnerabilities, logic bugs, code complexity, and redundant duplicates."
              color="#f472b6"
              dimmed={hoveredGuideStep !== null && hoveredGuideStep !== "05"}
              onHoverStart={() => setHoveredGuideStep("05")}
              onHoverEnd={() => setHoveredGuideStep(null)}
            />
            <SpotlightCard
              stepNumber="06"
              icon={Code}
              title="Chat with AI"
              description="Interact with our active code chat assistant to ask questions, write tests, generate scripts, and explore code structures."
              color="#60a5fa"
              dimmed={hoveredGuideStep !== null && hoveredGuideStep !== "06"}
              onHoverStart={() => setHoveredGuideStep("06")}
              onHoverEnd={() => setHoveredGuideStep(null)}
            />
          </div>
        </div>
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