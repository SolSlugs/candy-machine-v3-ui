import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useAudio } from '@/contexts/AudioContext';

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
  const { isMuted } = useAudio();
  const [stage, setStage] = useState<'start' | 'solslugs' | 'incinerator' | 'complete'>('start');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const incineratorAudioRef = useRef<HTMLAudioElement | null>(null);
  const startTimeRef = useRef<number>(0);
  const stageStartTimeRef = useRef<number>(0);

  const handleInitialClick = () => {
    setStage('solslugs');
    stageStartTimeRef.current = Date.now();
    
    if (!isMuted) {
      audioRef.current = new Audio('/ss.ogg');
      audioRef.current.play().catch(console.error);
    }

    setTimeout(() => {
      setStage('incinerator');
      stageStartTimeRef.current = Date.now();
      
      if (!isMuted) {
        incineratorAudioRef.current = new Audio('/dkc.ogg');
        incineratorAudioRef.current.play().catch(console.error);
      }

      setTimeout(() => {
        setStage('complete');
        setTimeout(onIntroComplete, 300);
      }, 5442);
    }, 1772);
  };

  // Add effect to handle mute state changes
  useEffect(() => {
    if (isMuted) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (incineratorAudioRef.current) {
        incineratorAudioRef.current.pause();
      }
    } else {
      // Resume audio if we're in the appropriate stage
      if (stage === 'solslugs' && audioRef.current) {
        audioRef.current.play().catch(console.error);
      } else if (stage === 'incinerator' && incineratorAudioRef.current) {
        incineratorAudioRef.current.play().catch(console.error);
      }
    }
  }, [isMuted, stage]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (incineratorAudioRef.current) {
        incineratorAudioRef.current.pause();
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
              exit={{ opacity: 0 }}
              transition={{ 
                duration: stage === 'solslugs' ? 1.172 : 0.3,
                ease: [0.23, 1, 0.32, 1]
              }}
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
              {/* Logo with enhanced squish animations */}
              <motion.div
                className="relative w-[420px]"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: [
                    0.8, // Start
                    1,   // Clean fade in to normal size
                    0.9,  // First squish (2073ms)
                    1.1,  // First expand
                    0.85, // Second squish (2327ms)
                    1.15, // Second expand
                    0.9,  // Third squish (2684ms)
                    1.1,  // Third expand
                    0.85, // Fourth squish (3047ms)
                    1.15, // Fourth expand
                    0.9,  // Fifth squish (3415ms)
                    1.1,  // Fifth expand
                    0.85, // Sixth squish (3811ms)
                    1.15, // Sixth expand
                    0.9,  // Seventh squish (4213ms)
                    1.1,  // Seventh expand
                    1,    // Final position
                    1,    // Hold
                    0     // Fade out
                  ],
                  opacity: [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0]
                }}
                transition={{
                  duration: 5.181,
                  times: [
                    0,
                    2073/5181,  // Clean fade in
                    2073/5181,  // First squish
                    2200/5181,
                    2327/5181,  // Second squish
                    2500/5181,
                    2684/5181,  // Third squish
                    2800/5181,
                    3047/5181,  // Fourth squish
                    3200/5181,
                    3415/5181,  // Fifth squish
                    3600/5181,
                    3811/5181,  // Sixth squish
                    4000/5181,
                    4213/5181,  // Seventh squish
                    4400/5181,
                    4800/5181,  // Final position
                    5000/5181,  // Hold
                    1           // Complete fade
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

              {/* Fire particle effects */}
              {[2327, 3047, 3811].map((timing) => (
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
                  {Array.from({ length: 12 }).map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-8 h-12"
                      style={{
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: `linear-gradient(to top, 
                          rgba(148, 228, 72, 0.1) 0%, 
                          rgba(148, 228, 72, 0.4) 50%, 
                          rgba(148, 228, 72, 0.1) 100%)`,
                        clipPath: 'polygon(50% 0%, 100% 90%, 50% 100%, 0% 90%)', // Flame shape
                        filter: 'blur(4px)',
                      }}
                      initial={{ scale: 0 }}
                      animate={{
                        x: Math.cos(i * Math.PI/6) * 210,
                        y: Math.sin(i * Math.PI/6) * 210,
                        scale: [0, 1.2, 0],
                        opacity: [0, 0.8, 0],
                        rotate: [0, Math.random() * 45 - 22.5]
                      }}
                      transition={{
                        duration: 0.6,
                        delay: timing/1000,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </motion.div>
              ))}

              {/* Fire ring effect */}
              {[2073, 2684, 3415, 4219].map((timing) => (
                <motion.div
                  key={timing}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <motion.div
                    className="w-[420px] h-[420px]"
                    style={{
                      background: 'radial-gradient(circle, rgba(148, 228, 72, 0.2) 60%, transparent 70%)',
                      filter: 'blur(8px)',
                    }}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ 
                      scale: [0.5, 1.5],
                      opacity: [0, 0.8, 0]
                    }}
                    transition={{
                      duration: 0.8,
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