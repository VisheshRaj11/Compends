import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, Users, Target, RotateCcwKeyIcon, Goal } from 'lucide-react';
import Autoplay from "embla-carousel-autoplay";
import { Carousel, CarouselContent, CarouselItem } from "../../components/ui/carousel";
import { Area, AreaChart, ResponsiveContainer, ReferenceDot, LabelList } from "recharts";
import { shadesOfPurple } from '@clerk/themes';
import { SignIn } from '@clerk/clerk-react';

// Data with specific milestones for the individual user
const graphData = [
  { x: 1, y: 10, label: "" }, 
  { x: 2, y: 25, label: "Chat" }, // Point 1
  { x: 3, y: 15, label: "" }, 
  { x: 4, y: 45, label: "Video Sync" }, // Point 2
  { x: 5, y: 35, label: "" }, 
  { x: 6, y: 70, label: "Project Collab" }, // Point 3
  { x: 7, y: 60, label: "" }, 
  { x: 8, y: 95, label: "Mastery" } // Point 4
];

const HeroSection = () => {
  const [showSignin, setShowSignin] = useState(false);
  const plugin = useRef(
    Autoplay({
      delay: 2000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      speed: 0.7,
    })
  );

   const handleOverlay = (e) => {
    if(e.target === e.currentTarget) {
        setShowSignin(false);
    }
  }

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden text-white py-24 px-6 md:px-12">
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        
        {/* LEFT SIDE: Content */}
        <div className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-blue-400 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Next Generation Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl md:text-8xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500"
          >
            Compend
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-2xl font-light text-gray-400 max-w-2xl mx-auto lg:mx-0 mb-10 leading-relaxed"
          >
            <span className="text-white font-medium">Collaborate.</span>
            <span className="text-blue-500 font-medium"> Compete.</span>
            <span className="text-white font-medium"> Consistent.</span>
            <br className="hidden md:block" />
            The all-in-one ecosystem for elite developers.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
          >
            <button 
            onClick={() => setShowSignin(prev => !prev)}
            className="cursor-pointer px-8 py-4 bg-white/20 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 w-full sm:w-auto">
              Get Started Free
            </button>
          </motion.div>
        </div>

        {showSignin && ( 
        <div 
        onClick={handleOverlay}
        className='fixed h-screen inset-0 flex items-center justify-center bg-black/60 backdrop-blur-2xl z-1200 '>
         <div>
           <SignIn
          appearance={{
            theme:[shadesOfPurple]
          }}
          forceRedirectUrl={'/community'}
          fallbackRedirectUrl={'/'}/>
         </div>
        </div>
      )}

        {/* RIGHT SIDE: The Graph with Feature Points */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="hidden md:block w-full h-[350px] lg:h-[450px] bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8 shadow-2xl"
        >
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white">Your Growth Journey</h3>
            <p className="text-sm text-slate-400">Unlock features as your skills climb</p>
          </div>
          
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={graphData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="heroGraphGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <Area
                type="monotone"
                dataKey="y"
                stroke="#3b82f6"
                strokeWidth={4}
                fill="url(#heroGraphGradient)"
                animationDuration={2500}
                dot={{ r: 6, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
              >
                <LabelList 
                  dataKey="label" 
                  position="top" 
                  offset={15} 
                  content={({ x, y, value }) => (
                    value ? (
                      <g>
                        <rect x={x - 40} y={y - 35} width={80} height={25} rx={12} fill="#3b82f6" />
                        <text x={x} y={y - 18} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold" className="uppercase tracking-tighter">
                          {value}
                        </text>
                      </g>
                    ) : null
                  )}
                />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Full-width Carousel at bottom */}
      <div className="absolute bottom-10 left-0 w-full">
        <Carousel
          opts={{ align: "start", loop: true, dragFree: true }}
          plugins={[plugin.current]}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {[
              { icon: <Users className="w-5 h-5 text-gray-500" />, label: "Team-Collaboration" },
              { icon: <Rocket className="w-5 h-5 text-gray-500" />, label: "Communication" },
              { icon: <Goal className="w-5 h-5 text-gray-500" />, label: "Streak System" },
              { icon: <Target className="w-5 h-5 text-gray-500" />, label: "Project Designing" },
              { icon: <RotateCcwKeyIcon className="w-5 h-5 text-gray-500" />, label: "Ranking System" },
              { icon: <Users className="w-5 h-5 text-gray-500" />, label: "Team-Collaboration" },
              { icon: <Rocket className="w-5 h-5 text-gray-500" />, label: "Communication" },
              { icon: <Goal className="w-5 h-5 text-gray-500" />, label: "Streak System" },
              { icon: <Target className="w-5 h-5 text-gray-500" />, label: "Project Designing" },
              { icon: <RotateCcwKeyIcon className="w-5 h-5 text-gray-500" />, label: "Ranking System" },
            ].map((item, index) => (
              <CarouselItem key={index} className="pl-4 basis-auto">
                <div className="flex items-center justify-center gap-3 px-6 py-3 text-white backdrop-blur-md whitespace-nowrap font-bold border-r-3 border-gray-400 border-b">
                  {item.icon}
                  <span className="md:text-lg uppercase tracking-widest">{item.label}</span>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
};

export default HeroSection;