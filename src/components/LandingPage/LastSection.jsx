import { shadesOfPurple } from "@clerk/themes";
import { motion } from "framer-motion";
import { Heart, Users, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import {SignIn} from '@clerk/clerk-react';

export default function LastSection() {
  const [sigin, setShowSignin] = useState(false);
  const cards = [
    {
      icon: <Users className="w-8 h-8 text-blue-500" />,
      title: "Not Everyone Has a Crowd",
      desc: "Some students move quietly through college with small circles and big dreams. Compend is built for those who don’t always have a group, but still have ambition.",
      delay: 0.1
    },
    {
      icon: <Heart className="w-8 h-8 text-pink-500" />,
      title: "Built With Empathy",
      desc: "This platform exists because someone believed that what they felt, others might feel too — and that no one should build their future alone.",
      delay: 0.2
    },
    {
      icon: <Sparkles className="w-8 h-8 text-amber-400" />,
      title: "Turn Feelings Into Fuel",
      desc: "Compend helps you transform loneliness into consistency, effort into streaks, and small steps into visible progress.",
      delay: 0.3
    }
  ];

   useEffect(() => {
      if (sigin) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "auto";
      }
    }, [sigin]);

  const handleOverlay = (e) => {
    if(e.target === e.currentTarget) {
        setShowSignin(false);
    }
  }
  return (
    <section className="w-full px-6 py-16 bg-transparent selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto">
        
        {/* Editorial Header */}
        <header className="max-w-4xl mb-24">
          <motion.span 
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="text-blue-500 font-mono text-sm tracking-widest uppercase mb-4 block"
          >
            // Our Origin Story
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-black text-white leading-[0.9] tracking-tighter mb-10"
          >
            Built From a <br /> 
            <span className="">
              Real College Story
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-400 text-xl md:text-2xl font-medium leading-relaxed max-w-2xl"
          >
            Compend didn’t start in a boardroom. It started in quiet hallways, 
            born from the hunger for a circle that understands the grind.
          </motion.p>
        </header>

        {/* Unique Feature Layout - No Boxes, just spatial flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">
          {cards.map((card, i) => (
            <motion.article
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: card.delay }}
              viewport={{ once: true }}
              className="group relative flex flex-col items-start"
            >
              {/* Icon with a subtle glow instead of a container */}
              <div className="mb-8 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                {card.icon}
                <div className="absolute -inset-2 bg-current opacity-0 blur-2xl group-hover:opacity-20 transition-opacity" />
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">
                {card.title}
              </h3>
              
              <p className="text-slate-400 leading-relaxed text-base md:text-lg font-light group-hover:text-slate-200 transition-colors">
                {card.desc}
              </p>
            </motion.article>
          ))}
        </div>

        {/* Minimalist Signature Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="mt-32 pt-16 border-t border-white/5"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <p className="text-2xl md:text-3xl font-semibold text-white/90 max-w-2xl leading-snug">
              If you’ve ever built in silence — <br />
              <span className="text-blue-500 underline decoration-blue-500/30 underline-offset-8 italic">
                your journey matters.
              </span>
            </p>
            
            <motion.button
              onClick={() => setShowSignin(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="text-white font-bold border-b-2 border-white pb-1 hover:text-blue-400 hover:border-blue-400 transition-all"
            >
              Join the circle →
            </motion.button>

            
          </div>

          {sigin && ( 
        <div 
        onClick={handleOverlay}
        className='fixed inset-0 flex items-center justify-center bg-black/60'>
          <SignIn
          appearance={{
            theme:[shadesOfPurple]
          }}
          forceRedirectUrl={'/community'}
          fallbackRedirectUrl={'/'}/>
        </div>
      )}
        </motion.footer>
      </div>
    </section>
  );
}