import { motion } from "framer-motion";
import * as React from "react";
import { cn } from "../../lib/utils";

export default function SmoothTab({
  items,
  selected,
  onChange,
  activeColor = "bg-[#1F9CFE]",
  className,
}) {
  const [dimensions, setDimensions] = React.useState({ width: 0, left: 0 });

  // Reference for the selected button
  const buttonRefs = React.useRef(new Map());
  const containerRef = React.useRef(null);

  // Update dimensions whenever selected tab changes or on mount
  React.useLayoutEffect(() => {
    const updateDimensions = () => {
      const selectedButton = buttonRefs.current.get(selected);
      const container = containerRef.current;

      if (selectedButton && container) {
        const rect = selectedButton.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        setDimensions({
          width: rect.width,
          left: rect.left - containerRect.left,
        });
      }
    };

    // Initial update
    requestAnimationFrame(() => {
      updateDimensions();
    });

    // Update on resize
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [selected]);

  const handleTabClick = (tabId) => {
    onChange?.(tabId);
  };

  const handleKeyDown = (e, tabId) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTabClick(tabId);
    }
  };

  const selectedItem = items.find((item) => item.id === selected);

  return (
    <div
      aria-label="Smooth tabs"
      className={cn(
        "relative flex items-center justify-between gap-1 py-1",
        "w-[400px] bg-zinc-950/80 backdrop-blur-sm",
        "rounded-xl border border-white/5",
        "transition-all duration-200",
        className
      )}
      ref={containerRef}
      role="tablist"
    >
      {/* Sliding Background */}
      {selectedItem && (
        <motion.div
          animate={{
            width: dimensions.width - 8,
            x: dimensions.left + 4,
            opacity: 1,
          }}
          className={cn(
            "absolute z-[1] rounded-lg transition-colors duration-200",
            selectedItem.color || activeColor
          )}
          initial={false}
          style={{ height: "calc(100% - 8px)", top: "4px" }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 30,
          }}
        />
      )}

      <div className="relative z-[2] flex w-full gap-1 px-1">
        {items.map((item) => {
          const isSelected = selected === item.id;
          return (
            <button
              key={item.id}
              aria-controls={`panel-${item.id}`}
              aria-selected={isSelected}
              className={cn(
                "relative flex-1 flex items-center justify-center gap-0.5 rounded-lg px-2 py-1.5 cursor-pointer select-none",
                "font-medium text-[11px] sm:text-xs transition-all duration-300",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/20",
                "truncate",
                isSelected
                  ? "text-white font-semibold"
                  : "text-zinc-400 hover:text-white"
              )}
              id={`tab-${item.id}`}
              onClick={() => handleTabClick(item.id)}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              ref={(el) => {
                if (el) buttonRefs.current.set(item.id, el);
                else buttonRefs.current.delete(item.id);
              }}
              role="tab"
              tabIndex={isSelected ? 0 : -1}
              type="button"
            >
              <span className="truncate">{item.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
