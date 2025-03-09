import React from 'react';
import { usePlayer, Track } from '../contexts/PlayerContext';

interface PlayButtonProps {
  track: Track;
}

const PlayButton: React.FC<PlayButtonProps> = ({ track }) => {
  const { currentTrack, setCurrentTrack, isPlaying, setIsPlaying } = usePlayer();

  const handleClick = () => {
    if (currentTrack?.id !== track.id) {
      // Set the new track and start playback if it's not the current one.
      setCurrentTrack(track);
      setIsPlaying(true);
    } else {
      // Toggle play/pause if it's the same track.
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="w-12 h-12 bg-rose-600 text-white rounded-md flex items-center justify-center hover:bg-rose-700 transition"
    >
      {currentTrack?.id === track.id && isPlaying ? (
        // Pause Icon
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M6 4h4v12H6V4zm6 0h4v12h-4V4z" />
        </svg>
      ) : (
        // Play Icon
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M5 3l12 7-12 7V3z" />
        </svg>
      )}
    </button>
  );
};

export default PlayButton;
