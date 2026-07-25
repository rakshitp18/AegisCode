import { Cloud, Code, Cpu, Globe, Lock, Zap } from "lucide-react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { cn } from "../lib/utils";

// ─── Constants ──────────────────────────────────────────────────────────────────
const TILT_MAX = 9;
const TILT_SPRING = { stiffness: 300, damping: 28 };
const GLOW_SPRING = { stiffness: 180, damping: 22 };

// ─── Data ────────────────────────────────────────────────────────────────────────
const DEFAULT_ITEMS = [
  {
    icon: Globe,
    title: "Architectural Audit",
    description: "Reveal codebase layout structures, dependency graphs, and package modularity patterns.",
    color: "#38bdf8",
  },
  {
    icon: Code,
    title: "Bug Detector",
    description: "Locate logic oversights, syntax mismatches, and trace potential runtime execution bugs.",
    color: "#f59e0b",
  },
  {
    icon: Lock,
    title: "Security Auditor",
    description: "Audit code vulnerability exposures, hardcoded credential leaks, and data query concerns.",
    color: "#f472b6",
  },
  {
    icon: Cpu,
    title: "Complexity Diagnostics",
    description: "Extract static metrics including method scores, class dependencies, and physical line counts.",
    color: "#60a5fa",
  },
  {
    icon: Zap,
    title: "Code Chat Assistant",
    description: "Ask questions, write shell scripts, and generate tests with live multi-file context tracking.",
    color: "#a78bfa",
  },
  {
    icon: Cloud,
    title: "Redundancy Checker",
    description: "Examine modules to flag duplicate logic functions and clean redundancy issues.",
    color: "#34d399",
  },
];

// ─── Card Component ─────────────────────────────────────────────────────────────
function Card({ item, dimmed, onHoverStart, onHoverEnd }) {
  const Icon = item.icon;
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
    onHoverStart();
  };

  const handleMouseLeave = () => {
    normX.set(0.5);
    normY.set(0.5);
    glowOpacity.set(0);
    onHoverEnd();
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
          background: `radial-gradient(ellipse at 20% 20%, ${item.color}08, transparent 65%)`,
        }}
      />

      {/* Hover glow layer */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{
          opacity: glowOpacity,
          background: `radial-gradient(ellipse at 20% 20%, ${item.color}1e, transparent 65%)`,
        }}
      />

      {/* Shimmer sweep */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[55%] -translate-x-full -skew-x-12 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-[280%]"
      />

      {/* Icon badge */}
      <div
        className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{
          background: `${item.color}14`,
          boxShadow: `inset 0 0 0 1px ${item.color}25`,
        }}
      >
        <Icon size={17} strokeWidth={1.9} style={{ color: item.color }} />
      </div>

      {/* Text */}
      <div className="relative z-10 flex flex-col gap-2">
        <h3 className="font-semibold text-[14px] text-white tracking-tight">
          {item.title}
        </h3>
        <p className="text-[12px] text-white/50 leading-relaxed font-sans font-light">
          {item.description}
        </p>
      </div>

      {/* Accent bottom line */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-[2px] w-0 rounded-full transition-all duration-500 group-hover:w-full"
        style={{
          background: `linear-gradient(to right, ${item.color}80, transparent)`,
        }}
      />
    </motion.div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────────
export default function Features({
  items = DEFAULT_ITEMS,
  eyebrow = "Features",
  heading = "Why Choose AegisCode?",
}) {
  const [hoveredTitle, setHoveredTitle] = useState(null);

  return (
    <div className="relative w-full rounded-3xl px-8 pt-9 pb-16 bg-transparent">
      {/* Header */}
      <div className="relative mb-12 flex flex-col gap-2 text-center">
        <p className="font-semibold text-[10px] text-white/40 uppercase tracking-[0.22em] select-none">
          {eyebrow}
        </p>
        <h2 className="font-bold text-[28px] text-white tracking-tight uppercase select-none">
          {heading}
        </h2>
        <div className="w-12 h-1 bg-white mx-auto rounded-full mt-1"></div>
      </div>

      {/* Card grid */}
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5">
        {items.map((item) => (
          <Card
            dimmed={hoveredTitle !== null && hoveredTitle !== item.title}
            item={item}
            key={item.title}
            onHoverEnd={() => setHoveredTitle(null)}
            onHoverStart={() => setHoveredTitle(item.title)}
          />
        ))}
      </div>
    </div>
  );
}