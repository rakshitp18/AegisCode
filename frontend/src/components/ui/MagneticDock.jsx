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
}) {
  const ref = React.useRef(null);
  const [isHovered, setIsHovered] = React.useState(false);

  // Distance from cursor to icon center
  const distance = useTransform(mouseX, (val) => {
    if (!ref.current) return magneticDistance + 1;
    const rect = ref.current.getBoundingClientRect();
    return val - (rect.left + rect.width / 2);
  });

  // Scale based on distance — use transform (GPU, no layout reflow)
  const scaleValue = useTransform(
    distance,
    [-magneticDistance, 0, magneticDistance],
    [1, maxScale, 1]
  );

  // High stiffness, low mass = instant, jitter-free response
  const scale = useSpring(scaleValue, { stiffness: 700, damping: 40, mass: 0.1 });

  // slot = the fixed layout footprint each icon always occupies
  const slotSize = Math.ceil(iconSize * maxScale);

  return (
    <div
      className="relative flex flex-col items-center justify-end"
      style={{ width: slotSize, height: slotSize }}
    >
      {/* Tooltip — sits above the slot */}
      <AnimatePresence>
        {showLabels && isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.92 }}
            transition={{ duration: 0.1 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-neutral-900/95 text-white/85 text-[10px] font-medium whitespace-nowrap border border-white/10 shadow-lg pointer-events-none z-50"
          >
            {item.label}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button centered inside slot; scale grows into reserved space */}
      <motion.button
        ref={ref}
        onClick={item.onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn(
          "relative flex items-center justify-center rounded-xl cursor-pointer focus:outline-none",
          item.isActive && "ring-1 ring-white/20"
        )}
        style={{
          width: iconSize,
          height: iconSize,
          scale,
          originX: 0.5,
          originY: 0.5,
        }}
        whileTap={{ scale: 0.88 }}
      >
        {/* Icon box */}
        <div
          className={cn(
            "w-full h-full rounded-xl flex items-center justify-center",
            "bg-gradient-to-b from-neutral-700/80 to-neutral-800/90",
            "border border-white/10",
            "shadow-md shadow-black/40",
            "transition-shadow duration-150",
            isHovered && "shadow-lg shadow-black/50 border-white/15"
          )}
        >
          {/* Shine */}
          <div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 55%)",
            }}
          />
          <div className="w-[55%] h-[55%] flex items-center justify-center text-white/75">
            {item.icon}
          </div>
        </div>

        {/* Active dot */}
        {item.isActive && (
          <div className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-white/60" />
        )}

        {/* Badge */}
        {item.badge > 0 && (
          <div className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border border-black/30">
            {item.badge > 99 ? "99+" : item.badge}
          </div>
        )}
      </motion.button>
    </div>
  );
}

function MagneticDock({
  items,
  iconSize = 32,
  maxScale = 1.4,
  magneticDistance = 80,
  showLabels = true,
  variant = "glass",
  className,
}) {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.clientX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "flex items-end gap-1 px-2 py-1.5 rounded-2xl",
        variant === "glass" && "bg-white/6 backdrop-blur-md border border-white/10 shadow-xl shadow-black/30",
        variant === "solid" && "bg-neutral-900 border border-white/10",
        variant === "transparent" && "bg-transparent",
        className
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {items.map((item) => (
        <DockItem
          key={item.id}
          item={item}
          mouseX={mouseX}
          iconSize={iconSize}
          maxScale={maxScale}
          magneticDistance={magneticDistance}
          showLabels={showLabels}
        />
      ))}
    </motion.div>
  );
}

export { MagneticDock };
