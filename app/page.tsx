"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, useMotionValue, useSpring, useTransform, Variants } from "framer-motion";
import LiquidGoldBackground from "./components/LiquidGoldBackground";
import { client, findGuestByNameQuery } from "@/app/lib/sanity";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    y: [0, -10, 0],
    transition: {
      y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
      staggerChildren: 0.3,
      delayChildren: 0.5,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function Home() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Parallax Effect values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const dx = useSpring(mouseX, springConfig);
  const dy = useSpring(mouseY, springConfig);

  const translateX = useTransform(dx, [-0.5, 0.5], ["-15px", "15px"]);
  const translateY = useTransform(dy, [-0.5, 0.5], ["-15px", "15px"]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleEnter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      setIsLoading(true);
      setError(null);
      try {
        const guest = await client.fetch(findGuestByNameQuery, { name: `${name.trim()}*` });
        if (guest?.slug?.current) {
          router.push(`/invite/${guest.slug.current}`);
        } else {
          setError("Invitation not found. Try your first name or full name.");
        }
      } catch (err) {
        setError("An error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <main 
      onMouseMove={handleMouseMove}
      className="relative flex min-h-screen flex-col items-center justify-center bg-[#0D0D0D] text-white overflow-hidden"
    >
      {/* Liquid Gold Live Shader Background */}
      <LiquidGoldBackground />

      {/* Grain Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] z-50" />
      
      {/* Subtle radial vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none z-10" />

      <motion.div
        style={{ x: translateX, y: translateY }}
        className="relative z-20 w-full flex flex-col items-center justify-center"
      >
        <motion.form 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          onSubmit={handleEnter}
          className="text-center space-y-12 max-w-lg px-6 py-16 bg-[#FFF5EF] backdrop-blur-md rounded-2xl border border-[#A87526]/20 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)]"
        >
          <motion.div variants={itemVariants} className="space-y-6">
            <motion.div
               animate={{ opacity: [0.4, 0.7, 0.4] }}
               transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            >
              <p className="font-inter text-[10px] tracking-[0.6em] text-[#A87526] uppercase">
                An Exclusive Invitation
              </p>
            </motion.div>
            
            <motion.h1 
              animate={{ backgroundPosition: ["0% center", "-200% center"] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="font-playfair text-4xl sm:text-6xl md:text-7xl tracking-tight leading-[1.1] px-2 bg-gradient-to-r from-[#A87526] via-[#D4AF37] to-[#A87526] bg-[length:200%_auto] bg-clip-text text-transparent"
            >
              Lauren <span className="italic">&</span> Joshua
            </motion.h1>
            
            <div className="h-px w-24 bg-gradient-to-r from-transparent via-[#A87526]/40 to-transparent mx-auto mt-8" />
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-8">
            <p className="font-inter text-xs tracking-[0.4em] text-[#A87526]/60 uppercase">
              July 4th, 2026
            </p>

            <div className="relative group max-w-xs mx-auto">
              <input
                type="text"
                placeholder="Guest Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/40 border-b border-[#A87526]/20 py-4 text-center font-playfair text-xl sm:text-3xl focus:outline-none focus:border-[#A87526] transition-all duration-700 placeholder:text-[#A87526]/30 text-[#A87526] relative z-10 rounded-t-lg"
              />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-[#A87526] group-focus-within:w-full transition-all duration-1000 ease-out" />
            </div>

            {error && <p className="text-red-600/80 text-[10px] tracking-widest uppercase">{error}</p>}

            <motion.button
              type="submit"
              disabled={!name.trim() || isLoading}
              whileHover={!name.trim() ? {} : { scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="relative w-full py-5 overflow-hidden border border-[#A87526]/30 bg-[#A87526] text-white text-[11px] uppercase tracking-[0.4em] disabled:opacity-20 disabled:cursor-not-allowed group will-change-transform shadow-lg"
            >
              {/* Shimmer background on hover */}
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              
              <span className="relative z-10">{isLoading ? "Searching..." : "Enter Experience"}</span>
              
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/30" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/30" />
            </motion.button>
          </motion.div>
        </motion.form>
      </motion.div>

      {/* Footer Branding */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ delay: 2, duration: 2 }}
        className="absolute bottom-10 z-20 text-[9px] tracking-[0.5em] text-[#A87526] uppercase"
      >
        Trinidad & Tobago
      </motion.div>
    </main>
  );
}
