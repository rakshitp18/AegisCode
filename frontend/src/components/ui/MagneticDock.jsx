import * as React from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { cn } from "../../lib/utils";

function DockItem({
  item,
  mouseX,
  iconSize,
  maxScale,
  magneticDistance,
  showLabels,
  isVertical,
}) {
  const ref = React.useRef(null);
  const [isHovered, setIsHovered] = React.useState(false);

  const distance = useTransform(mouseX, (val) => {
    if (!ref.current) return magneticDistance + 1;
    const rect = ref.current.getBoundingClientRect();
    const center = isVertical
      ? rect.top + rect.height / 2
      : rect.left + rect.width / 2;
    return val - center;
  });

  const scale = useTransform(
    distance,
    [-magneticDistance, 0, magneticDistance],
    [1, maxScale, 1]
  );

  const springConfig = { damping: 30, stiffness: 500, mass: 0.2 };
  const smoothScale = useSpring(scale, springConfig);
  const size = useTransform(smoothScale, (s) => s * iconSize);
  const y = useTransform(smoothScale, (s) => (s - 1) * -6);
  const smoothY = useSpring(y, springConfig);

  return (
    <motion.button
      ref={ref}
      onClick={item.onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative flex items-center justify-center",
        "rounded-2xl transition-colors duration-200",
        "focus:outline-none",
        item.isActive && "bg-white/10"
      )}
      style={{
        width: size,
        height: size,
        y: isVertical ? 0 : smoothY,
        x: isVertical ? smoothY : 0,
      }}
      whileTap={{ scale: 0.9 }}
    >
      {/* Icon Container */}
      <motion.div
        className={cn(
          "relative w-full h-full rounded-2xl overflow-hidden",
          "bg-gradient-to-b from-neutral-800 to-neutral-900",
          "backdrop-blur-sm",
          "border border-white/10",
          "shadow-lg shadow-black/30",
          "flex items-center justify-center"
        )}
        style={{
          boxShadow: isHovered
            ? "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12)"
            : "0 4px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <div className="w-[58%] h-[58%] flex items-center justify-center text-white/80">
          {item.icon}
        </div>

        {/* Shine */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 55%)",
            opacity: isHovered ? 1 : 0.5,
          }}
        />
      </motion.div>

      {/* Badge */}
      <AnimatePresence>
        {item.badge !== undefined && item.badge > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border border-black/40 shadow-md"
          >
            {item.badge > 99 ? "99+" : item.badge}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active dot */}
      <AnimatePresence>
        {item.isActive && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -bottom-2 w-1 h-1 rounded-full bg-white/70"
          />
        )}
      </AnimatePresence>

      {/* Tooltip */}
      <AnimatePresence>
        {showLabels && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.92 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={cn(
              "absolute -top-9 left-1/2 -translate-x-1/2",
              "px-2.5 py-1 rounded-lg",
              "bg-neutral-900/95 backdrop-blur-sm",
              "text-white/90 text-[11px] font-medium whitespace-nowrap",
              "border border-white/10",
              "shadow-xl shadow-black/30",
              "pointer-events-none z-50"
            )}
          >
            {item.label}
            <div className="absolute left-1/2 -translate-x-1/2 -bottom-[3px] w-1.5 h-1.5 rotate-45 bg-neutral-900/95 border-r border-b border-white/10" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        animate={{
          boxShadow: isHovered
            ? "0 0 24px rgba(255,255,255,0.08)"
            : "0 0 0px rgba(255,255,255,0)",
        }}
        transition={{ duration: 0.25 }}
      />
    </motion.button>
  );
}

function MagneticDock({
  items,
  iconSize = 52,
  maxScale = 1.55,
  magneticDistance = 140,
  showLabels = true,
  position = "bottom",
  variant = "glass",
  className,
}) {
  const mousePosition = useMotionValue(Infinity);
  const isVertical = position === "left" || position === "right";

  const handleMouseMove = React.useCallback(
    (e) => {
      mousePosition.set(isVertical ? e.clientY : e.clientX);
    },
    [mousePosition, isVertical]
  );

  const handleMouseLeave = () => mousePosition.set(Infinity);

  const variantStyles = {
    glass: "bg-white/5 backdrop-blur-2xl backdrop-saturate-150 border border-white/10",
    solid: "bg-neutral-900 border border-white/10",
    transparent: "bg-transparent border-0",
  };

  const positionStyles = {
    bottom: "flex-row",
    top: "flex-row",
    left: "flex-col",
    right: "flex-col",
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "inline-flex items-end gap-1.5 p-2.5 rounded-3xl",
        variantStyles[variant],
        positionStyles[position],
        "shadow-2xl shadow-black/40",
        className
      )}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {items.map((item) => (
        <DockItem
          key={item.id}
          item={item}
          mouseX={mousePosition}
          iconSize={iconSize}
          maxScale={maxScale}
          magneticDistance={magneticDistance}
          showLabels={showLabels}
          isVertical={isVertical}
        />
      ))}
    </motion.div>
  );
}

export { MagneticDock };
