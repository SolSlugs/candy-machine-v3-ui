import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

interface RetroIntroProps {
  onIntroComplete: () => void;
}

// Particle component
const Particle = ({ delay }: { delay: number }) => {
  const angle = Math.random() * Math.PI * 2;
  const distance = 150 + Math.random() * 100;
  const duration = 0.8 + Math.random() * 0.4;

  return (
    <motion.div
      className="absolute w-4 h-4"
      style={{
        left: '50%',
        top: '50%',
        background: 'radial-gradient(circle, rgba(148, 228, 72, 1) 0%, rgba(148, 228, 72, 0) 70%)',
        filter: 'blur(1px)',
        boxShadow: '0 0 10px rgba(148, 228, 72, 0.5)',
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ 
        scale: 0, 
        x: 0, 
        y: 0, 
        opacity: 0,
      }}
      animate={{
        scale: [1.5, 0.5, 0],
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        opacity: [0, 0.5, 1, 0.8, 0]
      }}
      transition={{
        duration: duration,
        delay: delay,
        ease: "easeOut",
        times: [0, 0.1, 0.2, 0.6, 1]
      }}
    />
  );
};

export const RetroIntro = ({ onIntroComplete }: RetroIntroProps) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleInitialClick = () => {
    setShowAnimation(true);
    audioRef.current = new Audio('/ss.ogg');
    audioRef.current.play().catch(error => {
      console.log("Audio playback failed:", error);
    });

    setTimeout(() => {
      setIntroComplete(true);
      setTimeout(onIntroComplete, 300);
    }, 1172);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  const particles = Array.from({ length: 35 }, (_, i) => ({
    id: i,
    delay: (i * 0.02) + 0.2
  }));

  return (
    <AnimatePresence mode="wait">
      {!introComplete && (
        <motion.div
          className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {!showAnimation ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0, 1] }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="text-white font-press-start text-xl cursor-pointer"
              onClick={handleInitialClick}
            >
              PRESS START
            </motion.div>
          ) : (
            <motion.div
              className="relative"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ 
                scale: 1,
                opacity: 1
              }}
              transition={{ 
                duration: 1.172,
                ease: [0.23, 1, 0.32, 1]
              }}
            >
              {/* Particles */}
              {particles.map(particle => (
                <Particle key={particle.id} delay={particle.delay} />
              ))}

              {/* Logo Container */}
              <div className="relative w-48 h-48">
                {/* Glow Effect */}
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 1] }}
                  transition={{ 
                    duration: 1.172,
                    times: [0, 0.5, 1],
                    ease: "easeOut"
                  }}
                  style={{
                    background: 'radial-gradient(circle, rgba(148, 228, 72, 0.3) 0%, rgba(148, 228, 72, 0) 70%)',
                    filter: 'blur(15px)',
                  }}
                />

                {/* Logo */}
                <motion.img
                  src="/solslugs.png"
                  alt="Sol Slugs Logo"
                  className="w-full h-full object-contain relative z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 1] }}
                  transition={{ 
                    duration: 1.172,
                    times: [0, 0.5, 1],
                    ease: "easeOut"
                  }}
                  style={{
                    filter: 'drop-shadow(0 0 10px rgba(148, 228, 72, 0.3))'
                  }}
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 