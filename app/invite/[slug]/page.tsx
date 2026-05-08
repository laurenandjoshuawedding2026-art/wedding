"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Float, Environment, Clone } from "@react-three/drei";
import LiquidGoldBackground from "../../components/LiquidGoldBackground";
import { client, guestBySlugQuery } from "@/app/lib/sanity";
import { submitRSVP } from "@/app/actions/rsvp";
import { submitWish } from "@/app/actions/submitWish";
import * as THREE from "three";

function RoseModel({ url, position, rotation, scale = 1 }: any) {
  // useGLTF caches the asset, but we must clone the scene to use it multiple times
  const { scene } = useGLTF(url) as any;
  
  const groupRef = useRef<THREE.Group>(null);

  return (
    <group
      ref={groupRef}
      position={position} 
      rotation={rotation} 
      scale={scale}
    >
      <Clone object={scene} />
    </group>
  );
}

interface Guest {
  _id: string;
  name: string;
  table_number: number;
  seats_reserved: number;
  RSVP_status?: "attending" | "declined";
  timeline?: Array<{ time: string; event: string }>;
  slug: { current: string };
  dietary_restrictions?: string; // Added for dietary restrictions
}

export default function InvitePage() {
  const { slug } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [guest, setGuest] = useState<Guest | null>(null);
  const [musicUrl, setMusicUrl] = useState<string | null>(null);
  const [roseModelTopLeftUrl, setRoseModelTopLeftUrl] = useState<string | null>(null);
  const [roseModelTopRightUrl, setRoseModelTopRightUrl] = useState<string | null>(null);
  const [roseModelBottomLeftUrl, setRoseModelBottomLeftUrl] = useState<string | null>(null);
  const [roseModelBottomRightUrl, setRoseModelBottomRightUrl] = useState<string | null>(null);
  const [thankYouVideoUrl, setThankYouVideoUrl] = useState<string | null>(null);
  const [weddingDate, setWeddingDate] = useState<string | null>(null);
  const [venueName, setVenueName] = useState<string | null>(null);
  const [venueAddress, setVenueAddress] = useState<string | null>(null);
  const [venueDetails, setVenueDetails] = useState<string | null>(null);
  const [attireDescription, setAttireDescription] = useState<string | null>(null);
  const [giftingDescription, setGiftingDescription] = useState<string | null>(null);
  const [globalTimeline, setGlobalTimeline] = useState<Array<{ time: string; event: string }> | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [stage, setStage] = useState<"envelope" | "opening" | "revealing" | "invitation">("envelope");
  const [activeTab, setActiveTab] = useState("Details");
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [rsvpStatus, setRsvpStatus] = useState<null | "attending" | "declined">(null);
  const [attendingCount, setAttendingCount] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [guestNameInput, setGuestNameInput] = useState("");
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [wishMessage, setWishMessage] = useState("");
  const [isSubmittingWish, setIsSubmittingWish] = useState(false);
  const [wishSubmitted, setWishSubmitted] = useState(false);
  const [wishCount, setWishCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFlapOpen, setIsFlapOpen] = useState(false);
  const navContainerRef = useRef<HTMLDivElement>(null);
  const [nameError, setNameError] = useState("");
  const [isMobile, setIsMobile] = useState(false); // State for mobile detection
  const [isTablet, setIsTablet] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [userHasSwiped, setUserHasSwiped] = useState(false);

  useEffect(() => {
    // Register Service Worker for Offline Capabilities
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => console.log('SW registration failed:', err));
    }

    // Check if user has already opened the envelope on this device
    const hasOpened = localStorage.getItem(`envelopeOpened_${slug}`);
    if (hasOpened === "true") {
      setStage("invitation");
    }
  }, [slug]);

  const saveToLocalCache = (key: string, data: any) => {
    localStorage.setItem(`offline_cache_${key}_${slug}`, JSON.stringify(data));
  };

  const getFromLocalCache = (key: string) => {
    const data = localStorage.getItem(`offline_cache_${key}_${slug}`);
    return data ? JSON.parse(data) : null;
  };

  useEffect(() => {
    async function fetchGuest() {
      try {
        const [guestData, settingsData] = await Promise.all([
          client.fetch(guestBySlugQuery, { slug }),
          client.fetch(`*[_type == "eventSettings"][0]{
            "musicUrl": backgroundMusic[0].asset->url,
            "thankYouVideoUrl": thankYouVideo.asset->url,
            weddingDate,
            venueName,
            venueAddress,
            venueDetails,
            attireDescription,
            giftingDescription,
            "roseModelTopLeftUrl": roseModelTopLeft.asset->url,
            "roseModelTopRightUrl": roseModelTopRight.asset->url,
            "roseModelBottomLeftUrl": roseModelBottomLeft.asset->url,
            "roseModelBottomRightUrl": roseModelBottomRight.asset->url,
            timeline
          }`)
        ]);

        // Cache successful data for offline venue use
        if (guestData) saveToLocalCache('guest', guestData);
        if (settingsData) saveToLocalCache('settings', settingsData);

        if (guestData && guestData.slug?.current === slug) {
          setGuest(guestData);
          if (guestData.RSVP_status) setRsvpStatus(guestData.RSVP_status);
          if (guestData.attending_count) setAttendingCount(guestData.attending_count);
          if (guestData.name) setGuestNameInput(guestData.name);
          if (guestData.dietary_restrictions) setDietaryRestrictions(guestData.dietary_restrictions);
        }
        if (settingsData?.musicUrl) {
          setMusicUrl(settingsData.musicUrl);
          // Attempt autoplay on entry since user interacted on the home page
          if (audioRef.current) {
            audioRef.current.play().catch(() => {
              console.log("Autoplay prevented; will start on interaction.");
            });
          }
        }
        if (settingsData?.thankYouVideoUrl) {
          setThankYouVideoUrl(settingsData.thankYouVideoUrl);
        }
        if (settingsData) {
          setRoseModelTopLeftUrl(settingsData.roseModelTopLeftUrl);
          setRoseModelTopRightUrl(settingsData.roseModelTopRightUrl);
          setRoseModelBottomLeftUrl(settingsData.roseModelBottomLeftUrl);
          setRoseModelBottomRightUrl(settingsData.roseModelBottomRightUrl);
        }
        if (settingsData?.weddingDate) {
          setWeddingDate(settingsData.weddingDate);
        }
        if (settingsData?.venueName) setVenueName(settingsData.venueName);
        if (settingsData?.venueAddress) setVenueAddress(settingsData.venueAddress);
        if (settingsData?.venueDetails) setVenueDetails(settingsData.venueDetails);
        if (settingsData?.attireDescription) setAttireDescription(settingsData.attireDescription);
        if (settingsData?.giftingDescription) setGiftingDescription(settingsData.giftingDescription);
        if (settingsData?.timeline) setGlobalTimeline(settingsData.timeline);
      } catch (error) {
        console.error("Fetch failed, attempting to load from offline cache:", error);
        const cachedGuest = getFromLocalCache('guest');
        const cachedSettings = getFromLocalCache('settings');
        
        if (cachedGuest) {
          setGuest(cachedGuest);
          if (cachedGuest.RSVP_status) setRsvpStatus(cachedGuest.RSVP_status);
          if (cachedGuest.attending_count) setAttendingCount(cachedGuest.attending_count);
        }
        if (cachedSettings) {
          setWeddingDate(cachedSettings.weddingDate);
          setVenueName(cachedSettings.venueName);
          setVenueAddress(cachedSettings.venueAddress);
          setVenueDetails(cachedSettings.venueDetails);
          setAttireDescription(cachedSettings.attireDescription);
          setGiftingDescription(cachedSettings.giftingDescription);
          setGlobalTimeline(cachedSettings.timeline);
        }
      }
      finally {
        setIsLoading(false);
        // Initialize wish count from local storage
        const savedWishes = localStorage.getItem(`wishCount_${slug}`);
        if (savedWishes) setWishCount(parseInt(savedWishes));
      }
    }
    fetchGuest();
  }, [slug]);

  // Countdown Timer Logic
  useEffect(() => {
    if (!weddingDate) return;

    const target = new Date(weddingDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference < 0) {
        clearInterval(interval);
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [weddingDate]);

  // Detect mobile for responsive scaling of 3D models
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial value

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper to format the display date
  const formattedDate = useMemo(() => {
    if (!weddingDate) return "Saturday, July 4th, 2026";
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(weddingDate));
  }, [weddingDate]);

  useEffect(() => {
    if (audioRef.current) {
      if (isMusicOn) audioRef.current.play().catch(() => {});
      else audioRef.current.pause();
    }
  }, [isMusicOn]);

  // Get name from query param for immediate personalization, fallback to guest data
  const displayName = searchParams.get("name") || guest?.name || "Guest";

  const handleRSVPAction = async (status: "attending" | "declined") => {
    if (!guest || isSubmitting) return;

    // Validation: Firstname Lastname (Capitalized)
    const nameRegex = /^[A-Z][a-z]+ [A-Z][a-z]+$/;
    if (!nameRegex.test(guestNameInput.trim())) {
      setNameError("Please enter your name as 'Firstname Lastname' (e.g., John Doe)");
      return;
    }
    
    setNameError("");
    
    setIsSubmitting(true);
    const count = status === "attending" ? attendingCount : 0;
    const result = await submitRSVP(guest._id, status, count, guestNameInput.trim(), dietaryRestrictions.trim());
    
    if (result.success) {
      setRsvpStatus(status);
      setIsEditing(false);
    }
    setIsSubmitting(false);
  };

  const handleSubmitWish = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guest || !wishMessage.trim() || isSubmittingWish) return;

    setIsSubmittingWish(true);
    const result = await submitWish(guest.name, wishMessage.trim());

    if (result.success) {
      const newCount = wishCount + 1;
      setWishCount(newCount);
      localStorage.setItem(`wishCount_${slug}`, newCount.toString());
      setWishSubmitted(true);
      setWishMessage("");
    }
    setIsSubmittingWish(false);
  };


  const handleEnvelopeClick = () => {
    if (stage !== "envelope" || isFlapOpen) return;
    
    // Trigger audio on first interaction
    if (isMusicOn && audioRef.current) audioRef.current.play().catch(() => {});
    
    setIsFlapOpen(true);
    setTimeout(() => {
      setStage("revealing");
      // Persist the state to localStorage
      localStorage.setItem(`envelopeOpened_${slug}`, "true");
    }, 1200); // Wait for seal break + flap + slide sequence
  };

  useEffect(() => {
    if (stage !== "invitation") return;

    const el = navContainerRef.current;
    if (!el) return;

    const checkScrollable = () => {
      setShowSwipeHint(el.scrollWidth > el.clientWidth + 2);
    };

    const handleScroll = () => {
      if (el.scrollLeft > 15) setUserHasSwiped(true);
    };

    // Small delay to allow DOM/Framer layout to finish
    const timeoutId = setTimeout(checkScrollable, 100);

    window.addEventListener('resize', checkScrollable);
    el.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkScrollable);
      el.removeEventListener('scroll', handleScroll);
    };
  }, [stage, guest, rsvpStatus, activeTab]);

  // Animation variants for tab content staggering
  const tabContentVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
  };

  const childItemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <main className="relative min-h-screen bg-[#0D0D0D] flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Grain Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] z-50" />
      
      {/* Dynamic radial shadow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />

      <LiquidGoldBackground />

      <AnimatePresence mode="wait">
        {stage === "envelope" && (
          <motion.div
            key="envelope-container"
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.8 }}
            className="z-10 relative cursor-pointer perspective-2000 mx-auto"
            onClick={handleEnvelopeClick}
          >
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6 sm:mb-8"
            >
              <p className="font-playfair text-2xl sm:text-3xl md:text-5xl text-[#A87526] italic drop-shadow-sm px-4">Welcome, {displayName}</p>
            </motion.div>

            <motion.div 
              className="relative w-[300px] h-[210px] sm:w-[340px] sm:h-[240px] md:w-[620px] md:h-[420px] bg-[#FFF5EF] rounded-sm shadow-[0_60px_120px_-30px_rgba(0,0,0,0.4)] flex items-center justify-center border border-black/10 overflow-visible transition-shadow duration-500"
              whileHover={{ scale: 1.03 }}
            >
              {/* Envelope Back Body */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] opacity-20" />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/5 via-transparent to-white/10 pointer-events-none" />
              
              {/* Inner Construction Lines (Seams visible when open) */}
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="50" y2="55" stroke="#A87526" strokeWidth="0.5" />
                  <line x1="100" y1="0" x2="50" y2="55" stroke="#A87526" strokeWidth="0.5" />
                  <line x1="0" y1="100" x2="50" y2="55" stroke="#A87526" strokeWidth="0.5" />
                  <line x1="100" y1="100" x2="50" y2="55" stroke="#A87526" strokeWidth="0.5" />
                </svg>
              </div>
              
              {/* Top Flap (Behind the seal) */}
              <motion.div
                className="absolute top-0 left-0 w-full h-full bg-[#FFF5EF] z-30 shadow-sm"
                style={{ 
                  clipPath: "polygon(0 0, 100% 0, 50% 55%)",
                  transformOrigin: "top"
                }}
                animate={{ rotateX: isFlapOpen ? -160 : 0 }}
                transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
              />

              {/* Front Side/Bottom Flaps (Static Overlay) */}
              <div 
                className="absolute inset-0 bg-[#FFF5EF] z-20 pointer-events-none overflow-hidden"
                style={{ clipPath: "polygon(0 0, 0 100%, 100% 100%, 100% 0, 50% 55%)" }}
              >
                {/* Subtle depth for the meeting points of the flaps */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent" style={{ clipPath: 'polygon(0 0, 50% 55%, 0 100%)' }} />
                <div className="absolute inset-0 bg-gradient-to-bl from-black/5 to-transparent" style={{ clipPath: 'polygon(100% 0, 50% 55%, 100% 100%)' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/[0.02] to-transparent" style={{ clipPath: 'polygon(0 100%, 50% 55%, 100% 100%)' }} />
              </div>

              {/* Wax Seal (Positioned on the outside) */}
              <motion.div 
                className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-28 md:h-28 z-40"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ 
                  scale: isFlapOpen ? 1.4 : 1,
                  opacity: isFlapOpen ? 0 : 1,
                  rotate: isFlapOpen ? 25 : 0,
                  filter: isFlapOpen ? "blur(12px)" : "blur(0px)"
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-[#8B0000] via-[#700000] to-[#4A0000] rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.5),inset_0_2px_10px_rgba(255,255,255,0.3)] border border-[#D4AF37]/30">
                  <div className="w-full h-full flex items-center justify-center rounded-full border-2 border-[#D4AF37]/10 m-2 overflow-hidden relative">
                    <span className="font-playfair text-[#D4AF37] text-2xl md:text-4xl select-none drop-shadow-lg z-10">L&J</span>
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent animate-[shimmer_3s_infinite]" />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ opacity: isFlapOpen ? 0 : 1 }}
                className="absolute bottom-6 left-0 w-full text-center z-20"
              >
                <p className="font-inter text-[10px] tracking-[0.4em] text-[#D4AF37] animate-pulse">BREAK THE SEAL</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {(stage === "revealing" || stage === "invitation") && (
          <motion.div
            key="invitation-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: 0 }} // Ensure y is reset
            className="z-20 w-full max-w-2xl flex flex-col items-center"
            transition={{ duration: 1 }}
          >
            <motion.div
              layoutId="invitation-card"
              style={{ transformStyle: "preserve-3d" }}
              className="w-full max-h-[calc(100dvh-120px)] bg-[#FFF5EF] p-4 sm:p-6 md:p-12 border border-[#A87526]/20 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] relative flex flex-col justify-start"
              onLayoutAnimationComplete={() => setStage("invitation")}
              animate={stage === "invitation" ? { y: [0, -5, 0] } : {}}
              transition={{ y: { duration: 5, repeat: Infinity, ease: "easeInOut" } }}
            >
              {/* Heavy Premium Paper Texture & Dramatic Lighting */}
              <div className="absolute inset-0 pointer-events-none z-0 bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')] opacity-[0.8] mix-blend-multiply" style={{ backgroundSize: '120px' }} />
              <div className="absolute inset-0 pointer-events-none z-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.25] mix-blend-overlay" />
              <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,1)_0%,transparent_95%)]" />
              <div className="absolute inset-0 pointer-events-none z-0 shadow-[inset_0_0_150px_rgba(104,71,23,0.35),inset_0_0_60px_rgba(0,0,0,0.2)]" />
              <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-transparent via-transparent to-black/[0.1]" />

              {/* Decorative Botanical Outlines (Randomized Scatter) */}
              <div className="absolute top-0 right-0 w-48 h-48 opacity-[0.12] pointer-events-none z-0 overflow-hidden translate-x-8 -translate-y-8">
                <svg viewBox="0 0 200 200" className="w-full h-full stroke-[#A87526] fill-none stroke-[0.75]">
                  <path d="M40,180 Q60,100 160,40 M160,40 Q120,80 80,100 M80,100 Q40,120 40,180" />
                  <path d="M110,70 Q130,30 170,20 Q140,60 110,70" />
                  <path d="M70,120 Q50,90 40,50 Q80,80 70,120" />
                  <path d="M140,110 Q160,80 190,70 Q170,100 140,110" />
                </svg>
              </div>
              <div className="absolute top-1/4 left-0 w-40 h-40 opacity-[0.10] pointer-events-none z-0 overflow-hidden -translate-x-12 rotate-45">
                <svg viewBox="0 0 200 200" className="w-full h-full stroke-[#A87526] fill-none stroke-[0.75]">
                  <path d="M20,160 Q80,140 140,20 M140,20 Q100,60 70,80" />
                  <path d="M50,110 Q30,70 20,30 Q60,60 50,110" />
                  <path d="M90,130 Q120,110 150,100 Q130,140 90,130" />
                </svg>
              </div>
              {/* New Central Sprig Outline */}
              <div className="absolute top-[8%] left-1/2 -translate-x-1/2 w-32 h-32 opacity-[0.08] pointer-events-none z-0">
                <svg viewBox="0 0 200 200" className="w-full h-full stroke-[#A87526] fill-none stroke-[0.5]">
                  <path d="M100,180 Q100,100 120,40 M120,40 Q90,70 70,100 M70,100 Q100,130 100,180" />
                  <path d="M100,120 Q130,100 150,60 Q110,80 100,120" />
                </svg>
              </div>
              {/* Large side botanical scatter */}
              <div className="absolute bottom-[40%] right-[2%] w-64 h-64 opacity-[0.09] pointer-events-none z-0 rotate-12">
                <svg viewBox="0 0 200 200" className="w-full h-full stroke-[#A87526] fill-none stroke-[0.6]">
                  <path d="M50,150 Q80,80 160,50 M160,50 Q120,90 90,110" />
                  <path d="M80,100 Q110,60 140,40 Q110,80 80,100" />
                  <path d="M120,120 Q150,90 180,80 Q150,110 120,120" />
                </svg>
              </div>
              {/* Tiny details / "Little Stuff" */}
              <div className="absolute top-[35%] left-[8%] w-20 h-20 opacity-[0.1] pointer-events-none z-0 -rotate-12">
                <svg viewBox="0 0 100 100" className="w-full h-full stroke-[#A87526] fill-none stroke-[1]">
                  <circle cx="50" cy="50" r="1.5" />
                  <path d="M20,20 L25,25 M75,75 L80,80 M20,80 L25,75" strokeWidth="0.5" />
                </svg>
              </div>
              <div className="absolute top-[15%] right-[15%] w-12 h-12 opacity-[0.1] pointer-events-none z-0">
                <svg viewBox="0 0 100 100" className="w-full h-full stroke-[#A87526] fill-none stroke-[0.8]">
                  <path d="M50,20 Q60,50 50,80 M30,50 Q50,60 70,50" />
                </svg>
              </div>
              {/* 3D Scene Overlay for GLB Roses - Commented out for now (Internal comments removed to prevent syntax errors)
              {(roseModelTopLeftUrl || roseModelTopRightUrl || roseModelBottomLeftUrl || roseModelBottomRightUrl) && (
                <div className="absolute inset-[-100px] pointer-events-none z-30">
                  <Canvas 
                    camera={{ position: [0, 0, 10], fov: 35 }} 
                    gl={{ alpha: true, antialias: true }}
                    dpr={[1, 2]}
                  >
                    <ambientLight intensity={1.5} />
                    <pointLight position={[5, 5, 5]} intensity={3} color="#D4AF37" />
                    <spotLight position={[-5, 10, 5]} angle={0.15} penumbra={1} intensity={3} />
                    <Environment preset="city" />
                    <Suspense fallback={null}>
                      {roseModelTopLeftUrl && (
                        <RoseModel 
                          url={roseModelTopLeftUrl} 
                          position={isMobile ? [-1.375, 1.6, 0] : isTablet ? [-1.8, 1.5, 0] : [-2.175, 1.4, 0]} 
                          rotation={[0, 4, 0]} 
                          scale={isMobile ? 4.5 : isTablet ? 4.8 : 5} 
                        />
                      )}
                      {roseModelTopRightUrl && (
                        <RoseModel 
                          url={roseModelTopRightUrl} 
                          position={isMobile ? [1.5, 2.2, 0] : isTablet ? [2.0, 2.2, 0] : [2.4, 2.2, 0]} 
                          rotation={[0, 1.5, Math.PI / 2]} 
                          scale={isMobile ? 0.0175 : isTablet ? 0.019 : 0.02} 
                        />
                      )}
                      {roseModelBottomLeftUrl && (
                        <RoseModel 
                          url={roseModelBottomLeftUrl} 
                          position={isMobile ? [-1.14, -2.375, 0] : isTablet ? [-1.5, -2.4, 0] : [-1.8, -2.45, 0]} 
                          rotation={[0, 2.5, -Math.PI / 4]} 
                          scale={isMobile ? 0.1 : isTablet ? 0.1 : 0.1} 
                        />
                      )}
                      {roseModelBottomRightUrl && (
                        <RoseModel 
                          url={roseModelBottomRightUrl} 
                          position={isMobile ? [1.5, -2.0, 0] : isTablet ? [2.0, -1.9, 0] : [2.4, -1.9, 0]} 
                          rotation={[5, 0, Math.PI]} 
                          scale={isMobile ? 0.0075 : isTablet ? 0.009 : 0.01} 
                        />
                      )}
                    </Suspense>
                  </Canvas>
                </div>
              )}
              */}

              {/* Enhanced 3D Borders (Static) */}
              <div 
                style={{ 
                  borderColor: "rgba(212, 175, 55, 0.6)",
                  boxShadow: "0 0 25px rgba(212, 175, 55, 0.4), inset 0 0 15px rgba(168, 117, 38, 0.25)"
                }}
                className="absolute inset-2 border-2 pointer-events-none z-10" 
              />
              <div 
                style={{ 
                  borderColor: "rgba(212, 175, 55, 0.4)",
                  boxShadow: "inset 0 0 12px rgba(168, 117, 38, 0.15)"
                }}
                className="absolute inset-4 border pointer-events-none hidden sm:block z-10" 
              />
              
              {/* Content Stage (Updated to deep color theme) */}
              <div className="text-center text-[#A87526] h-full flex flex-col py-2 overflow-y-auto relative z-40">
                {/* Top Section: Anchored Header and Countdown - Pushed down on mobile */}
                <div className="flex-1 flex flex-col justify-start pt-12 md:pt-8 space-y-0.5 md:space-y-2 min-h-0 overflow-hidden">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="shrink-0"
                  >
                    <p className="font-playfair italic text-sm md:text-lg text-[#A87526]">We are honored to have you, {displayName}</p>
                    <div className="h-px w-12 bg-[#A87526]/20 mx-auto mt-2" />
                  </motion.div>

                  <header className="space-y-0.5 md:space-y-1 shrink-0">
                    <p className="font-inter text-[10px] tracking-[0.5em] uppercase text-[#A87526]">The Wedding Of</p>
                    <motion.h1 
                      animate={{ backgroundPosition: ["0% center", "-200% center"] }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="font-playfair text-4xl sm:text-5xl md:text-7xl tracking-tight leading-tight bg-gradient-to-r from-[#8B5E1F] via-[#D4AF37] to-[#8B5E1F] bg-[length:200%_auto] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(212,175,55,0.4)]"
                      style={{ textShadow: "0px 1.5px 2px rgba(255,255,255,0.7), 0 0 40px rgba(212,175,55,0.25)" }}
                    >
                      Lauren & Joshua
                    </motion.h1>
                    <p className="font-playfair text-sm md:text-base pt-1 italic opacity-80">{formattedDate}</p>
                  </header>

                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="flex justify-center items-center space-x-4 md:space-x-8 py-1 shrink-0"
                  >
                    {[
                      { label: "Days", value: timeLeft.days },
                      { label: "Hours", value: timeLeft.hours },
                      { label: "Mins", value: timeLeft.minutes },
                      { label: "Secs", value: timeLeft.seconds }
                    ].map((unit, i) => (
                      <div key={i} className="text-center">
                        <p className="font-playfair text-base md:text-xl text-[#A87526]">{unit.value.toString().padStart(2, '0')}</p>
                        <p className="font-inter text-[6px] md:text-[7px] uppercase tracking-[0.2em] opacity-40">{unit.label}</p>
                      </div>
                    ))}
                  </motion.div>
                </div>

                {/* Interactive Tabs: Raised divider and increased height for mobile visibility */}
                <div className="pt-2 border-t border-[#A87526]/10 h-[45%] md:h-[35%] flex-none flex flex-col overflow-hidden">
                  <div className="relative w-full mb-2">
                    {/* New Styled Navigation Bar Container */}
                    <motion.div 
                      initial={{ x: 0 }}
                      animate={stage === "invitation" ? { x: [0, -20, 0] } : { x: 0 }}
                      transition={{ delay: 3, duration: 0.8, ease: "easeInOut" }}
                      className="bg-[#A87526]/5 rounded-full p-0.5 backdrop-blur-sm border border-[#A87526]/10 w-full shadow-inner flex justify-start"
                    >
                      <div 
                        ref={navContainerRef}
                        className="flex space-x-2 overflow-x-auto no-scrollbar px-4 py-0.5 scroll-smooth justify-start"
                      >
                        {["Details", "Attire", "Timeline", "Gifting", "RSVP", ...(rsvpStatus ? ["Wishes"] : [])].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`font-inter text-[9px] md:text-[10px] uppercase tracking-[0.1em] transition-all px-3 py-2 rounded-full shrink-0 relative ${
                              activeTab === tab 
                                ? "bg-[#A87526] text-[#FFF5EF] shadow-md" 
                                : "text-[#A87526]/60 hover:text-[#A87526] hover:bg-[#A87526]/5"
                            }`}
                          >
                            {tab}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                    {/* Enhanced Swipe Affordance */}
                    <div className={`absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#FFF5EF] via-[#FFF5EF]/40 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${userHasSwiped ? 'opacity-0' : 'opacity-100'}`} />
                    <div className={`absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#FFF5EF] via-[#FFF5EF]/40 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${!showSwipeHint || userHasSwiped ? 'opacity-0' : 'opacity-100'}`} />
                  </div>

                  {/* Visual Swipe Hint */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: (showSwipeHint && !userHasSwiped && stage === "invitation") ? [0, 1, 0.5, 1] : 0,
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 3 }}
                    className="flex justify-center items-center space-x-2 mb-0.5 h-3"
                  >
                    <span className="font-inter text-[10px] uppercase tracking-[0.4em] text-[#D6AA67] font-bold">Swipe for more</span>
                    <span className="text-[#D6AA67] text-sm">→</span>
                  </motion.div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      variants={tabContentVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      className="flex-1 flex flex-col justify-start py-2 overflow-y-auto pr-1 custom-scrollbar"
                    >
                      {activeTab === "Details" && guest && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-8 items-center px-4">
                          <motion.div variants={childItemVariants} className="space-y-1 md:space-y-4">
                            <p className="font-inter text-[14px] tracking-[0.2em] uppercase text-[#D6AA67] font-bold">Venue</p>
                            <p className="font-inter text-[15px] font-semibold text-[#D6AA67]">{venueName || "Dennis P. Ramdhan Complex"}</p>
                            <p className="font-inter text-[13px] text-[#D6AA67] font-medium opacity-70">{venueAddress || "Couva, Trinidad & Tobago"}</p>
                            <div className="h-px w-8 bg-[#A87526]/20 mx-auto my-4 md:hidden" />
                            <p className="font-inter text-[12px] pt-1 italic font-medium text-[#D6AA67] hidden md:block">{venueDetails || "Ceremony begins at 3:00 PM"}</p>
                          </motion.div>
                          <motion.div variants={childItemVariants} className="bg-[#A87526]/5 border border-[#A87526]/10 p-3 md:p-6 space-y-1 md:space-y-2">
                             <p className="font-inter text-[12px] text-[#D6AA67] font-bold uppercase tracking-[0.3em]">Your Reserved Seat</p>
                             <p className="font-playfair text-3xl font-bold text-[#D6AA67]">Table No. {guest.table_number}</p>
                             <p className="font-inter text-[12px] text-[#D6AA67] font-semibold opacity-60 uppercase tracking-[0.1em]">{guest.seats_reserved || 0} Seats reserved for you</p>
                          </motion.div>
                        </div>
                      )}

                      {activeTab === "Attire" && (
                        <motion.div variants={tabContentVariants} className="space-y-2">
                          <h4 className="font-playfair text-lg md:text-xl font-bold text-[#D6AA67]">The Palette</h4>
                          <p className="text-[13px] uppercase tracking-[0.2em] font-bold text-[#D6AA67]">Formal Attire</p>
                          <p className="text-[13px] leading-relaxed text-[#D6AA67] font-medium opacity-80 max-w-xs mx-auto font-inter">
                            {attireDescription || "We kindly request our guests to dress in formal attire. Please avoid wearing Champagne, Gold, or White."}
                          </p>
                        </motion.div>
                      )}

                      {activeTab === "Timeline" && (
                        <motion.div variants={tabContentVariants} className="space-y-2 max-w-xs mx-auto text-left px-2">
                          {(guest?.timeline || globalTimeline)?.map((item: { time: string; event: string }, i: number) => (
                            <motion.div variants={childItemVariants} key={i} className="flex items-center space-x-6">
                              <span className="font-inter text-[12px] text-[#D6AA67] font-bold w-16">{item.time}</span>
                              <div className="h-2 w-2 rounded-full bg-[#D6AA67]/60" />
                              <span className="font-inter text-[13px] font-bold tracking-widest uppercase text-[#D6AA67]">{item.event}</span>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}

                      {activeTab === "Gifting" && (
                        <motion.div variants={tabContentVariants} className="space-y-2">
                          <h4 className="font-playfair text-lg md:text-xl font-bold text-[#D6AA67]">With Love</h4>
                          <p className="text-[13px] leading-relaxed text-[#D6AA67] font-medium opacity-80 max-w-xs mx-auto font-inter">
                            {giftingDescription || "Your presence at our wedding is the greatest gift of all. Should you wish to contribute, a monetary gift would be warmly appreciated."}
                          </p>
                        </motion.div>
                      )}

                      {activeTab === "RSVP" && (
                        <motion.div variants={tabContentVariants} className="space-y-4">
                          {(!rsvpStatus || isEditing) ? ( // Added space-y-4 for mobile
                            <motion.div variants={childItemVariants} className="space-y-4 md:space-y-6">
                              <p className="font-inter text-[12px] text-[#D6AA67] font-bold tracking-widest uppercase italic opacity-70">Respond by June 6th, 2026</p>

                              <div className="max-w-xs mx-auto space-y-4 md:space-y-6">
                                <div className="space-y-2 text-left">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#D6AA67]">Your Name</p>
                                  <input
                                    type="text"
                                    value={guestNameInput}
                                    onChange={(e) => setGuestNameInput(e.target.value)}
                                    placeholder="Firstname Lastname"
                                    className="w-full bg-[#A87526]/5 border border-[#A87526]/20 p-2.5 rounded-md font-inter text-xs text-[#D6AA67] placeholder:text-[#D6AA67]/30 focus:outline-none focus:border-[#D6AA67]/50"
                                  />
                                  {nameError && <p className="text-[10px] text-red-400 italic">{nameError}</p>}
                                </div>

                                {guest && guest.seats_reserved > 1 && (
                                  <div className="space-y-3">
                                    <p className="text-[12px] font-bold uppercase tracking-widest text-[#D6AA67]">Number of Guests</p>
                                    <div className="flex items-center justify-center space-x-6">
                                      <button 
                                        onClick={() => setAttendingCount(Math.max(1, attendingCount - 1))}
                                        className="w-8 h-8 rounded-full border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]"
                                      >–</button>
                                      <span className="font-playfair text-3xl font-bold text-[#D6AA67] w-8">{attendingCount}</span>
                                      <button 
                                        onClick={() => setAttendingCount(Math.min(guest.seats_reserved, attendingCount + 1))}
                                        className="w-8 h-8 rounded-full border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]"
                                      >+</button>
                                    </div>
                                  </div>
                                )}

                                <div className="space-y-2 text-left">
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#D6AA67]">Dietary Requirements</p>
                                  <textarea
                                    value={dietaryRestrictions}
                                    onChange={(e) => setDietaryRestrictions(e.target.value)}
                                    placeholder="Allergies, vegetarian, etc. (optional)"
                                    rows={2}
                                    className="w-full bg-[#A87526]/5 border border-[#A87526]/20 p-2.5 rounded-md font-inter text-xs text-[#D6AA67] placeholder:text-[#D6AA67]/30 focus:outline-none focus:border-[#D6AA67]/50 resize-none"
                                  />
                                </div>

                                <div className="flex flex-col space-y-3">
                                  <button 
                                    onClick={() => handleRSVPAction("attending")}
                                    className="w-full py-3 bg-[#D4AF37] text-black font-inter text-[10px] uppercase tracking-widest hover:bg-[#B8962E] transition-all shadow-lg disabled:opacity-50"
                                    disabled={isSubmitting}
                                  >
                                    {isSubmitting ? "Processing..." : "Confirm Attendance"}
                                  </button>
                                  <button 
                                    onClick={() => handleRSVPAction("declined")}
                                    className="w-full py-3 border border-white/10 text-[#F7E7CE]/40 font-inter text-[10px] uppercase tracking-widest hover:text-[#F7E7CE] transition-all hover:bg-white/5 disabled:opacity-50"
                                    disabled={isSubmitting}
                                  >
                                    Regretfully decline
                                  </button>
                                  {isEditing && (
                                    <button 
                                      onClick={() => setIsEditing(false)}
                                      className="text-[9px] uppercase tracking-[0.3em] opacity-40 pt-2"
                                    >Cancel Edit</button>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          ) : (
                            <motion.div variants={childItemVariants} className="space-y-8">
                              <div className="space-y-4">
                                <p className="font-playfair text-3xl font-bold text-[#D6AA67]">
                                  {rsvpStatus === "attending" ? "See you there!" : "We'll miss you"}
                                </p>
                                <p className="font-inter text-[13px] font-medium text-[#D6AA67] opacity-80 leading-relaxed max-w-xs mx-auto">
                                  {rsvpStatus === "attending" 
                                    ? `Thank you, ${guestNameInput}. We have you down for ${attendingCount} ${attendingCount === 1 ? 'seat' : 'seats'} at Table ${guest?.table_number}.`
                                    : "Thank you for letting us know. We're sorry you can't join us, but we appreciate the response."}
                                </p>
                              </div>
                              
                              <button 
                                onClick={() => setIsEditing(true)}
                                className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#D6AA67] border-b border-[#D6AA67]/40 pb-1 hover:border-[#D6AA67] transition-all"
                              >
                                Update Response
                              </button>
                            </motion.div>
                          )}
                        </motion.div>
                      )}

                      {activeTab === "Wishes" && rsvpStatus && (
                        <motion.div variants={tabContentVariants} className="space-y-4 max-w-xs mx-auto">
                          {wishSubmitted ? (
                            <motion.div variants={childItemVariants} className="text-center py-4 md:py-4 space-y-4">
                              <p className="font-playfair text-2xl md:text-3xl font-bold text-[#D6AA67]">Thank You!</p>
                              <p className="text-[13px] font-medium text-[#D6AA67] opacity-80 leading-relaxed font-inter">
                                Your beautiful wish has been received.
                              </p>
                              {wishCount < 3 ? (
                                <div className="space-y-3 pt-2">
                                  <p className="text-[11px] text-[#D6AA67] opacity-60 italic">Would you like to send another? ({3 - wishCount} remaining)</p>
                                  <button 
                                    onClick={() => setWishSubmitted(false)}
                                    className="px-6 py-2 bg-[#A87526] text-[#FFF5EF] text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-[#8B5E1F] transition-all shadow-md active:scale-95"
                                  >
                                    Yes, Send Another
                                  </button>
                                </div>
                              ) : (
                                <p className="text-[11px] text-[#D6AA67] opacity-60 italic pt-2">You've shared so much love! Maximum wishes reached.</p>
                              )}
                            </motion.div>
                          ) : (
                            <>
                              <h4 className="font-playfair text-xl font-bold text-[#D6AA67]">
                                {wishCount > 0 ? "Share More Love" : "Leave a Wish"}
                              </h4>
                              <p className="text-[12px] font-medium text-[#D6AA67] opacity-70 leading-relaxed font-inter">
                                {wishCount > 0 
                                  ? `You have ${3 - wishCount} ${3 - wishCount === 1 ? 'wish' : 'wishes'} remaining.`
                                  : "Share your well wishes or a special message for Lauren & Joshua."
                                }
                              </p>
                              <form onSubmit={handleSubmitWish} className="space-y-4">
                                <textarea
                                  value={wishMessage}
                                  onChange={(e) => setWishMessage(e.target.value)}
                                  placeholder="Your message..."
                                  rows={4}
                                  className="w-full bg-[#FFF5EF]/50 border border-[#A87526]/20 p-3 font-inter text-xs text-[#A87526] placeholder:text-[#A87526]/40 focus:outline-none focus:border-[#A87526] transition-all rounded-md"
                                  disabled={isSubmittingWish}
                                />
                                <button
                                  type="submit"
                                  className="w-full py-3 bg-[#A87526] text-white font-inter text-[10px] uppercase tracking-widest hover:bg-[#8B5E1F] transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={isSubmittingWish || !wishMessage.trim() || wishCount >= 3}
                                >
                                  {isSubmittingWish ? "Sending..." : wishCount >= 3 ? "Limit Reached" : "Send Wish"}
                                </button>
                              </form>
                            </>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <footer className="pt-2 text-[10px] md:text-[11px] font-bold tracking-[0.4em] uppercase text-[#D6AA67] opacity-60 shrink-0">
                  Lauren & Joshua • 2026
                </footer>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {musicUrl && (
        <audio ref={audioRef} src={musicUrl} loop />
      )}

      {/* Bottom Controls */}
      <div className="fixed bottom-6 left-6 right-6 md:bottom-8 md:left-8 md:right-8 flex justify-between items-center z-50 pointer-events-none">
        {/* Enhanced Mini Record Player Controller */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.5 }}
          className="pointer-events-auto flex items-center group cursor-pointer bg-[#FFF5EF]/20 backdrop-blur-xl p-2 rounded-2xl border border-[#A87526]/30 shadow-2xl transition-all hover:bg-[#FFF5EF]/30"
          onClick={() => setIsMusicOn(!isMusicOn)}
        >
          <div className="relative w-14 h-14 md:w-20 md:h-20 flex items-center justify-center bg-[#2c1810] rounded-xl shadow-inner border border-[#A87526]/30 overflow-hidden">
            {/* Wood Texture Base */}
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
            
            {/* Pulsing Aura & Color Waves when music is on */}
            <AnimatePresence>
              {isMusicOn && (
                <>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 0.5, 0], scale: [1, 1.6, 2.2] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 bg-[#D4AF37] rounded-full blur-2xl"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [0, 0.2, 0], scale: [1, 1.8, 2.5] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeOut", delay: 1 }}
                    className="absolute inset-0 bg-[#D6AA67] rounded-full blur-3xl"
                  />
                </>
              )}
            </AnimatePresence>

            {/* The Platter & Record */}
            <div className="relative w-11 h-11 md:w-16 md:h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800 shadow-lg overflow-hidden">
              {/* Internal Smooth Light Waves (Adjusted size for smaller player) */}
              <AnimatePresence>
                {isMusicOn && (
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-[radial-gradient(circle,rgba(212,175,55,0.2)_0%,transparent_70%)]"
                  />
                )}
              </AnimatePresence>

              <motion.div
                animate={isMusicOn ? { rotate: 360 } : { rotate: 0 }} // Keep rotation for visual effect
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-9 h-9 md:w-14 md:h-14 rounded-full relative"
                style={{ 
                  background: 'conic-gradient(#111 0deg, #222 45deg, #111 90deg, #222 135deg, #111 180deg, #222 225deg, #111 270deg, #222 315deg, #111 360deg)'
                }}
              >
                {/* Record Grooves */}
                <div className="absolute inset-1 rounded-full border border-white/5 opacity-30" />
                <div className="absolute inset-2 rounded-full border border-white/5 opacity-30" />
                <div className="absolute inset-3 rounded-full border border-white/5 opacity-10" />
                
                {/* Gold Label */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 md:w-4 md:h-4 bg-[#D4AF37] rounded-full border border-[#A87526]/30 shadow-sm flex items-center justify-center">
                   <div className="w-1 h-1 bg-black/40 rounded-full" />
                </div>
              </motion.div>
            </div>

            {/* Tone Arm */}
            <motion.div
              className="absolute top-1.5 right-1.5 w-0.5 md:w-1.5 h-5 md:h-10 origin-top-right z-10 pointer-events-none"
              initial={{ rotate: -45 }}
              animate={isMusicOn ? { rotate: -12 } : { rotate: -45 }}
              transition={{ duration: 1, ease: "easeInOut" }}
            >
               <div className="w-full h-full bg-[#D4AF37] rounded-full shadow-lg" />
               <div className="absolute bottom-0 right-0 w-2 h-3 bg-[#A87526] rounded-[2px] transform translate-x-1" />
            </motion.div>
          </div>
          
          <div className="ml-2 flex flex-col items-start overflow-hidden">
            <span className="text-[7px] md:text-[9px] tracking-[0.4em] uppercase text-[#A87526]/60 font-semibold">Melody</span>
            <span className="text-[9px] md:text-[11px] tracking-[0.1em] uppercase text-[#A87526] font-bold transition-all duration-500">
              {isMusicOn ? "Live" : "Muted"}
            </span>
          </div>
        </motion.div>
        
        <div className="flex flex-col items-end space-y-2">
          {stage === "invitation" && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => {
                localStorage.removeItem(`envelopeOpened_${slug}`);
                router.push("/");
              }}
              className="pointer-events-auto text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase text-[#8B5E1F] hover:text-[#A87526] transition-all bg-[#FFF5EF]/60 backdrop-blur-md px-5 py-2.5 rounded-full border-2 border-[#A87526]/40 shadow-lg active:scale-95"
            >
              Replay Intro
            </motion.button>
          )}
          <p className="text-[8px] md:text-[9px] tracking-[0.3em] text-[#A87526]/40 uppercase">L & J • 2026</p>
        </div>
      </div>

      <style jsx global>{`
        .perspective-2000 {
          perspective: 2000px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #A87526;
          border-radius: 10px;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #A87526 transparent;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .light-sweep::after {
          content: '';
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(
            to right,
            transparent,
            rgba(255,255,255,0.1),
            transparent
          );
          animation: shimmer 5s infinite;
        }
      `}</style>
    </main>
  );
}