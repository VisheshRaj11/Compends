import React from "react";
import { motion } from "framer-motion";

const About = () => {
  return (
    <section className="w-full py-20 px-6 sm:px-10 lg:px-20 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20 text-white">
        
        {/* Text Content */}
        <div className="w-full lg:w-1/2 space-y-6">
          <motion.h2
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight"
          >
            Why Compend<span className="text-blue-500">.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-gray-300 leading-relaxed max-w-xl"
          >
            Compend is a unified community ecosystem built for the next generation of developers.
            We combine high-performance <span className="text-slate-200 font-semibold">group chat and video calling</span>
            with real-time <span className="text-slate-200 font-semibold">project management</span>.
            Level up your career with integrated coding profiles, daily streak challenges,
            and a global ranking system that rewards your consistency and contribution.
          </motion.p>
        </div>

        {/* Image Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 30 }}
          whileInView={{ opacity: 1, scale: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="w-full lg:w-1/2"
        >
          <div className="relative w-full max-w-xl mx-auto">
            {/* Decorative element */}
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-gray-900/60 rounded-full z-0" />

            {/* FIXED RATIO CONTAINER */}
            <div className="relative z-10 w-full aspect-[16/10] sm:aspect-[4/3] lg:aspect-[11/9] rounded-2xl overflow-hidden border border-slate-100 shadow-2xl">
              <img
                src="/about.png"
                alt="Compend Platform Interface"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gray-900/60 rounded-full z-0" />
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default About;
