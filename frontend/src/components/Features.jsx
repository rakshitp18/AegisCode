import { useRef } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame
} from "framer-motion";
import FeatureCard from "./FeatureCard";

// Helper function to wrap values (like the framer-motion wrap utility)
const wrap = (min, max, v) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

function ParallaxRow({ children, baseVelocity = 1.5 }) {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 50,
    stiffness: 400,
  });
  const velocityFactor = useTransform(smoothVelocity, [0, 1000], [0, 5], {
    clamp: false,
  });

  // Since we repeat the set of cards 4 times, wrapping past -25% creates a seamless loop
  const x = useTransform(baseX, (v) => `${wrap(-25, 0, v)}%`);

  const directionFactor = useRef(1);
  useAnimationFrame((t, delta) => {
    // Increased speed multiplier from 2.5 to 3.0
    let moveBy = directionFactor.current * baseVelocity * (delta / 1000) * 3.0;

    if (velocityFactor.get() < 0) {
      directionFactor.current = -1;
    } else if (velocityFactor.get() > 0) {
      directionFactor.current = 1;
    }

    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  return (
    <div className="overflow-hidden whitespace-nowrap flex flex-nowrap w-full py-4 select-none">
      <motion.div className="flex whitespace-nowrap gap-6" style={{ x }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-6 pr-6">
            {children}
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function Features() {
  const featuresRow1 = [
    {
      icon: "🏛️",
      title: "Architectural Audit",
      description: "Reveal layout patterns, design principles, and overall directory structures."
    },
    {
      icon: "🐞",
      title: "Bug Detection",
      description: "Locate logical oversights, syntax errors, and potential execution bugs."
    },
    {
      icon: "🔒",
      title: "Security Auditor",
      description: "Identify potential vulnerabilities, SQL exposures, and credentials leakage."
    }
  ];

  const featuresRow2 = [
    {
      icon: "📊",
      title: "Complexity Diagnostics",
      description: "Analyze code metrics including lines of code, class, and method counts."
    },
    {
      icon: "💬",
      title: "Code Chat Assistant",
      description: "Ask questions and write scripts with context of active files and statistics."
    },
    {
      icon: "👥",
      title: "Redundancy Checker",
      description: "Detect duplicate functions and logic segments across project modules."
    }
  ];

  return (
    <section className="py-24 px-4 overflow-hidden">
      <div className="max-w-4xl mx-auto text-center mb-16 px-6">
        <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4 select-none">
          Why Choose AegisCode?
        </h2>
        <p className="text-sm text-white/50 select-none">
          Scroll down or move your mouse to watch our diagnostic engines speed up in real-time.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full">
        {/* Row 1: Scrolling Left - Increased base speed from -0.4 to -0.65 */}
        <ParallaxRow baseVelocity={-0.65}>
          {featuresRow1.map((feature, index) => (
            <div key={index} className="w-[300px] sm:w-[350px] shrink-0 whitespace-normal">
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </div>
          ))}
        </ParallaxRow>

        {/* Row 2: Scrolling Right - Increased base speed from 0.4 to 0.65 */}
        <ParallaxRow baseVelocity={0.65}>
          {featuresRow2.map((feature, index) => (
            <div key={index} className="w-[300px] sm:w-[350px] shrink-0 whitespace-normal">
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            </div>
          ))}
        </ParallaxRow>
      </div>
    </section>
  );
}

export default Features;