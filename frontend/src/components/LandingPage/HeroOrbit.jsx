import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const avatars = [
  "/avatars/a1.png",
  "/avatars/a2.png",
  "/avatars/a3.png",
  "/avatars/a4.png",
  "/avatars/a5.png",
  "/avatars/a6.png",
];

export default function HeroOrbit() {
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAngle((prev) => prev + 0.2);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const radius = 180;

  return (
    <div className="relative flex items-center justify-center min-h-screen  to-slate-900 overflow-hidden">
      {/* Concentric rings */}
      {[1, 2, 3].map((ring) => (
        <motion.div
          key={ring}
          className="absolute rounded-full border border-white/10"
          style={{
            width: radius * ring,
            height: radius * ring,
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 40 - ring * 10, ease: "linear" }}
        />
      ))}

      {/* Orbiting Avatars */}
      {avatars.map((src, index) => {
        const theta = (2 * Math.PI * index) / avatars.length + angle * 0.01;
        const x = radius * Math.cos(theta);
        const y = radius * Math.sin(theta);

        return (
          <motion.img
            key={index}
            src={src}
            alt="specialist"
            className="absolute w-14 h-14 rounded-full object-cover shadow-xl ring-2 ring-white/40"
            style={{ transform: `translate(${x}px, ${y}px)` }}
            whileHover={{ scale: 1.2 }}
            transition={{ type: "spring", stiffness: 200 }}
          />
        );
      })}
    </div>
  );
}


