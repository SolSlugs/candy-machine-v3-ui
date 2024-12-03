import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

interface RetroDialogProps {
  text: string;
  dialogKey?: string;
  avatarSrc?: string;
}

export const RetroDialog = ({ text, dialogKey = 'default', avatarSrc = '/ts.png' }: RetroDialogProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const textSpeed = 50;

  useEffect(() => {
    audioRef.current = new Audio('/textdialog.ogg');
    audioRef.current.volume = 0.3;
  }, []);

  useEffect(() => {
    if (isTypingRef.current) return;
    
    let currentIndex = 0;
    isTypingRef.current = true;

    const typeText = () => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        
        if (audioRef.current && currentIndex < text.length) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(console.error);
        }

        setTimeout(() => {
          if (textContainerRef.current) {
            textContainerRef.current.scrollTop = textContainerRef.current.scrollHeight;
          }
        }, 0);

        currentIndex++;

        if (currentIndex <= text.length) {
          timeoutRef.current = setTimeout(typeText, textSpeed);
        } else {
          isTypingRef.current = false;
          setIsComplete(true);
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
        }
      }
    };

    typeText();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      isTypingRef.current = false;
    };
  }, [text, dialogKey]);

  return (
    <motion.div 
      className="w-full bg-black/80 border-2 border-primary rounded-sm"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex h-24">
        {/* Character Avatar */}
        <div className="h-full aspect-square flex-shrink-0 p-2">
          <img 
            src={avatarSrc}
            alt="Character Avatar" 
            className="h-full w-full object-contain"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        {/* Text Area */}
        <div 
          ref={textContainerRef}
          className="flex-grow font-press-start text-[10px] text-primary overflow-y-auto pointer-events-none"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            padding: "8px",
            height: '96px',
            lineHeight: '16px',
            clipPath: 'inset(0)',
          }}
        >
          <div 
            className="whitespace-pre-wrap relative"
            style={{
              display: 'grid',
              gridAutoRows: '16px',
            }}
          >
            {displayedText}
            {!isComplete && (
              <motion.span
                animate={{ opacity: [0, 1] }}
                transition={{ 
                  duration: 0.5, 
                  repeat: Infinity, 
                  repeatType: "reverse" 
                }}
                className="absolute -bottom-4 right-0"
              >
                ▼
              </motion.span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 