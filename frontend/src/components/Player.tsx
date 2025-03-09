import React, { useEffect, useRef, useState } from 'react';
import { usePlayer } from '../contexts/PlayerContext';

const Player: React.FC = () => {
  const { currentTrack, isPlaying, setIsPlaying } = usePlayer();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // Helper to format seconds into mm:ss
  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };


  useEffect(() => {
    if (audioRef.current) {
      isPlaying ? audioRef.current.play() : audioRef.current.pause();
    }
  }, [isPlaying]);

  
  // Toggle play/pause state
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleTimeUpdate = () => {
        console.log("Time update", audio.currentTime);
        setProgress(audio.currentTime);
      };
      const handleLoadedMetadata = () => {
        console.log("Metadata loaded", audio.duration);
        setDuration(audio.duration);
      };
      const handleEnded = () => {
        console.log("Track ended");
        setIsPlaying(false);
        setProgress(0);
      };
  
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('ended', handleEnded);
  
      return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentTrack, setIsPlaying]);

  // Reset audio element when the current track changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      setProgress(0);
      // If metadata is already loaded, set duration immediately.
      if (audioRef.current.readyState >= 1) {
        setDuration(audioRef.current.duration);
      }
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrack]);

  // Handle seek bar changes
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  // If no track is set, don’t render the player.
  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-800 p-4 shadow-lg">
      {/* Audio element with track URL */}
      <audio ref={audioRef} src={currentTrack.url} preload="metadata" key={currentTrack.id} />
      
      {/* Header: Grid with three columns for spacing */}
      <div className="grid grid-cols-3 items-center px-4 max-w-md  lg:max-w-lg justify-center mx-auto">
        {/* Empty left column */}
        <div></div>
        {/* Centered title */}
        <div className="text-center">
          <h4 className="text-zinc-900 dark:text-zinc-100 font-semibold text-lg">
            {currentTrack.title}
          </h4>
        </div>
        {/* Play/Pause button on the right */}
        <div className="flex justify-end">
          <button
            onClick={togglePlay}
            className="w-12 h-12 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md flex items-center justify-center transition"
          >
            {isPlaying ? (
              <svg
                className="w-6 h-6 text-zinc-900 dark:text-zinc-100"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M6 4h4v12H6V4zm6 0h4v12h-4V4z" />
              </svg>
            ) : (
              <svg
                className="w-6 h-6 text-zinc-900 dark:text-zinc-100"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path d="M5 3l12 7-12 7V3z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar with Time Labels */}
      <div className="mt-4 flex items-center justify-between w-full max-w-sm lg:max-w-lg mx-auto">
        <span className="text-sm text-zinc-900 dark:text-zinc-100">
          {formatTime(progress)}
        </span>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={progress}
          onChange={handleSeek}
          onInput={handleSeek}
          className="mx-2 w-full h-1 cursor-pointer appearance-none bg-transparent"
        />
        <span className="text-sm text-zinc-900 dark:text-zinc-100">
          {formatTime(duration)}
        </span>
      </div>

      {/* Custom Styles for the Range Input */}
      <style jsx>{`
        input[type="range"] {
          -webkit-appearance: none;
          background: transparent;
        }
        input[type="range"]::-webkit-slider-runnable-track {
          height: 1px;
          background: #d4d4d8;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #a1a1aa;
          margin-top: -5px;
        }
        input[type="range"]::-moz-range-track {
          height: 1px;
          background: #d4d4d8;
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #a1a1aa;
        }
        input[type="range"]:focus {
          outline: none;
        }
      `}</style>
    </div>
  );
};

export default Player;
