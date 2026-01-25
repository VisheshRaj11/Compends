import React from 'react';
import { motion } from 'framer-motion';

const ModernBackground = () => {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#020617]">
      {/* 1. The Grid Layer */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(#1e293b 1px, transparent 1px), 
                            linear-gradient(90deg, #1e293b 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* 2. Radial Gradient Overlay (Fade the edges) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_80%)]" />

      {/* 3. Revolving Orbits */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        
        {/* Inner Orbit */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute border border-slate-700/50 rounded-full w-[300px] h-[300px] -ml-[150px] -mt-[150px]"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-blue-500 rounded-full blur-[1px]" />
        </motion.div>

        {/* Middle Orbit */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          className="absolute border border-slate-700/30 rounded-full w-[500px] h-[500px] -ml-[250px] -mt-[250px]"
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-500 rounded-full blur-[2px]" />
        </motion.div>

        {/* Outer Orbit */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute border border-slate-800 rounded-full w-[800px] h-[800px] -ml-[400px] -mt-[400px]"
        >
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-500 rounded-full" />
        </motion.div>

      </div>
    </div>
  );
};

export default ModernBackground;