import { CircleFadingPlus, Flame, MessageCircleIcon, Presentation, ShieldHalf, Video } from "lucide-react";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const items = [
  { id: 1, icon: <MessageCircleIcon className="w-4 h-4 md:w-5 md:h-5" />, name: "Chat", img: "/chat.webp" },
  { id: 2, icon: <Video className="w-4 h-4 md:w-5 md:h-5" />, name: "Meeting", img: "/video.webp" },
  { id: 3, icon: <Flame className="w-4 h-4 md:w-5 md:h-5" />, name: "Streak", img: "/streak.jpg" },
  { id: 4, icon: <Presentation className="w-4 h-4 md:w-5 md:h-5" />, name: "Project", img: "/project.webp" }, // Shortened name for mobile
  { id: 5, icon: <ShieldHalf className="w-4 h-4 md:w-5 md:h-5" />, name: "Ranks", img: "/rank.png" },
  { id: 6, icon: <CircleFadingPlus className="w-4 h-4 md:w-5 md:h-5" />, name: "Blogs", img: "/blog.webp" },
];

const Features = () => {
  const [active, setActive] = useState(0);

  return (
    <section className="w-full px-4 py-12 md:py-24">
      <div className="relative max-w-5xl mx-auto rounded-3xl border border-white/10 bg-white backdrop-blur-xl overflow-hidden shadow-2xl text-black">
        
        {/* NAV BAR - Improved for Mobile Scroll */}
        <div className="border-b border-white/10 bg-black/20">
          <ul className="flex items-center gap-2 overflow-x-auto px-4 py-4 md:justify-center scrollbar-hide no-scrollbar">
            {items.map((item, index) => (
              <li
                key={item.id}
                onClick={() => setActive(index)}
                className={`flex items-center gap-2 cursor-pointer px-4 py-2.5 rounded-xl whitespace-nowrap transition-all duration-300 flex-shrink-0
                  ${
                    active === index
                      ? "bg-white text-black shadow-lg scale-100"
                      : "bg-white/5 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                {item.icon}
                <span className="text-xs md:text-sm font-bold uppercase tracking-wider">{item.name}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* PREVIEW AREA - Optimized aspect ratio */}
        <div className="relative w-full aspect-video md:aspect-[16/9] lg:aspect-[21/9] flex items-center justify-center overflow-hidden bg-gradient-to-b from-transparent to-black/40">
          <AnimatePresence mode="wait">
            <motion.div
              key={items[active].img}
              initial={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.02, filter: "blur(10px)" }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="w-full h-full p-4 md:p-8"
            >
              <img
                src={items[active].img}
                alt={items[active].name}
                className="w-full h-full object-cover rounded-xl border border-white/10 shadow-2xl shadow-blue-500/10"
              />
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

export default Features;