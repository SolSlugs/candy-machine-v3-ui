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
  const [stage, setStage] = useState<'start' | 'solslugs' | 'incinerator' | 'complete'>('start');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const incineratorAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleInitialClick = () => {
    setStage('solslugs');
    audioRef.current = new Audio('/ss.ogg');
    audioRef.current.play().catch(console.error);

    // Schedule the transition to incinerator stage
    setTimeout(() => {
      setStage('incinerator');
      incineratorAudioRef.current = new Audio('/dkc.ogg');
      incineratorAudioRef.current.play().catch(console.error);

      // Schedule the final transition
      setTimeout(() => {
        setStage('complete');
        setTimeout(onIntroComplete, 300);
      }, 5442); // Length of dkc.ogg
    }, 1472); // Length of ss.ogg + 300ms buffer
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (incineratorAudioRef.current) {
        incineratorAudioRef.current.pause();
        incineratorAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  const particles = Array.from({ length: 35 }, (_, i) => ({
    id: i,
    delay: (i * 0.02) + 0.2
  }));

  return (
    <AnimatePresence mode="wait">
      {stage !== 'complete' && (
        <motion.div
          className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {stage === 'start' && (
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
          )}

          {stage === 'solslugs' && (
            <motion.div
              className="relative"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.172, ease: [0.23, 1, 0.32, 1] }}
            >
              {particles.map(particle => (
                <Particle key={particle.id} delay={particle.delay} />
              ))}
              <div className="relative w-48 h-48">
                <motion.img
                  src="/solslugs.png"
                  alt="Sol Slugs Logo"
                  className="w-full h-full object-contain relative z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.5, 1] }}
                  transition={{ duration: 1.172, times: [0, 0.5, 1], ease: "easeOut" }}
                />
              </div>
            </motion.div>
          )}

          {stage === 'incinerator' && (
            <motion.div className="relative w-[560px] h-[560px] flex items-center justify-center">
              {/* Logo */}
              <motion.div
                className="relative w-[420px]"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [0.8, 1, 0.9, 1.1, 0.95, 1.05, 0.98, 1.02, 1],
                  opacity: [0, 1, 1, 1, 1, 1, 1, 1, 0]
                }}
                transition={{
                  duration: 5.181,
                  times: [
                    0,
                    1523/5181,
                    2073/5181,
                    2327/5181,
                    2684/5181,
                    3047/5181,
                    3415/5181,
                    3811/5181,
                    1
                  ],
                  ease: "easeInOut"
                }}
              >
                <img
                  src="/incinerator-logo.svg"
                  alt="Incinerator Logo"
                  className="w-full h-full object-contain"
                />
              </motion.div>

              {/* Particle effects */}
              {[1523, 2327, 3047, 3811].map((timing) => (
                <motion.div
                  key={timing}
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{
                    duration: 0.5,
                    delay: timing/1000,
                    ease: "easeOut"
                  }}
                >
                  {Array.from({ length: 8 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-6 h-6 rounded-full"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        backgroundColor: '#F44343',
                        boxShadow: '0 0 10px rgba(244, 67, 67, 0.7)'
                      }}
                      initial={{ scale: 0 }}
                      animate={{
                        x: Math.cos(i * Math.PI/4) * 210,
                        y: Math.sin(i * Math.PI/4) * 210,
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: 0.5,
                        delay: timing/1000,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </motion.div>
              ))}

              {/* Ring Animation */}
              {[2073, 2684, 3415, 4219].map((timing) => (
                <motion.div
                  key={timing}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <motion.div
                    className="w-[420px] h-[420px] rounded-full"
                    style={{
                      border: '4px solid #F44343'
                    }}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ 
                      scale: [0.5, 1.5],
                      opacity: [0, 1, 0]
                    }}
                    transition={{
                      duration: 0.6,
                      delay: timing/1000,
                      times: [0, 0.3, 1],
                      ease: "easeOut"
                    }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 