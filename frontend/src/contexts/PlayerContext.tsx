import React, { createContext, useState, useContext, useEffect } from 'react';

export interface Track {
  id: string;
  title: string;
  url: string; // Audio source URL
  
}

interface PlayerContextProps {
  currentTrack: Track | null;
  setCurrentTrack: (track: Track) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

const PlayerContext = createContext<PlayerContextProps | undefined>(undefined);

interface PlayerProviderProps {
  children: React.ReactNode;
}

export const PlayerProvider: React.FC<PlayerProviderProps> = ({ children }) => {
  // Flag to check if component is mounted (client-side)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Start with default values matching the server render
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Once mounted, update state from localStorage
  useEffect(() => {
    if (mounted) {
      const storedTrack = localStorage.getItem('currentTrack');
      if (storedTrack) {
        setCurrentTrack(JSON.parse(storedTrack));
      }
      const storedPlaying = localStorage.getItem('isPlaying');
      if (storedPlaying) {
        setIsPlaying(JSON.parse(storedPlaying));
      }
    }
  }, [mounted]);

  // Persist currentTrack changes in the browser
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('currentTrack', JSON.stringify(currentTrack));
    }
  }, [currentTrack, mounted]);

  // Persist isPlaying changes in the browser
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('isPlaying', JSON.stringify(isPlaying));
    }
  }, [isPlaying, mounted]);

  // Until mounted, render nothing (or a fallback UI if needed)
  if (!mounted) return null;

  return (
    <PlayerContext.Provider
      value={{ currentTrack, setCurrentTrack, isPlaying, setIsPlaying }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = (): PlayerContextProps => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
