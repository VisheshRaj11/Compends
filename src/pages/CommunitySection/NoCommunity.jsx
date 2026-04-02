import React from "react";
import { motion } from "framer-motion"; // Make sure to: npm install framer-motion
import { MessageCircle, Video, FolderOpenDot, Users, MousePointer2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: <MessageCircle size={24} />,
    title: "Chat",
    desc: "Instant messaging",
    // color: "bg-blue-50 text-blue-600",
  },
  {
    icon: <Video size={24} />,
    title: "Video",
    desc: "Face-to-face calls",
    // color: "bg-purple-50 text-purple-600",
  },
  {
    icon: <FolderOpenDot size={24} />,
    title: "Projects",
    desc: "Team collaboration",
    // color: "bg-orange-50 text-orange-600",
  },
  {
    icon: <Users size={24} />,
    title: "Network",
    desc: "Grow your circle",
    // color: "bg-emerald-50 text-emerald-600",
  },
];

const NoCommunity = () => {
  // Animation Variants
  const containerVars = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVars = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 sm:py-6 bg-gradient-to-br from-white to-slate-100 bg-[radial-gradient(#0c1287_1px,transparent_1px)] [background-size:26px_26px] overflow-hidden">
      
      {/* Animated Main Icon */}
      <motion.div 
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="relative mb-8"
      >
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="w-38 h-24 rounded-3xl bg-gray-200 text-white flex items-center justify-center shadow-xl shadow-slate-500"
        >
         <img src="./logo.png" alt="" />
        </motion.div>
        {/* Decorative Ring */}
        <div className="absolute -inset-4 border-2 border-dashed border-slate-200 rounded-full animate-[spin_20s_linear_infinite] -z-10" />
      </motion.div>

      {/* Text Content */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3 mb-12"
      >
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-blue-900">
          Ready to dive in?
        </h1>
        <p className="text-slate-500 max-w-sm mx-auto text-lg leading-relaxed">
          Select a community from the sidebar to unlock your workspace.
        </p>
      </motion.div>

      {/* Interactive Cards Grid */}
      <motion.div 
        variants={containerVars}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl"
      >
        {features.map((item, index) => (
          <motion.div 
            key={index} 
            variants={itemVars}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="h-full border-none bg-white/60 backdrop-blur-md shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-slate-100 group cursor-pointer">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                <div className={`p-3 rounded-xl mb-4 transition-colors ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <h3 className="font-bold text-slate-800 text-base mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-tight">
                  {item.desc}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Footer Instruction */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-16 flex items-center gap-2 text-slate-400 font-medium"
      >
        <MousePointer2 size={16} className="animate-bounce" />
        <span className="text-sm tracking-wide uppercase">Pick a channel to begin</span>
      </motion.div>
    </div>
  );
};

export default NoCommunity;