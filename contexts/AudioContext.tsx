import React, { createContext, useContext, useState, useCallback } from 'react';

interface AudioContextType {
  isMuted: boolean;
  toggleMute: () => void;
}

const AudioContext = createContext<AudioContextType>({
  isMuted: false,
  toggleMute: () => {},
});

export const useAudio = () => useContext(AudioContext);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState(false);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return (
    <AudioContext.Provider value={{ isMuted, toggleMute }}>
      {children}
    </AudioContext.Provider>
  );
}; 