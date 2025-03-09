import React, { useEffect, useRef, useState, useCallback } from 'react';
import { usePlayer } from '../contexts/PlayerContext';

const Player: React.FC = () => {
  const { currentTrack, isPlaying, setIsPlaying } = usePlayer();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  // Phase used to animate the played portion (sine wave)
  const [phase, setPhase] = useState(0);

  // SVG and wave parameters.
  const viewBoxWidth = 120;
  const viewBoxHeight = 20;
  const amplitude = 2; // amplitude of the wave
  const center = viewBoxHeight / 2; // vertical center
  const period = 12; // period length in viewBox units

  // Update the phase continuously when playing.
  useEffect(() => {
    let animationFrame: number;
    const phaseSpeed = 0.05; // adjust for faster or slower fluctuation

    const updatePhase = () => {
      setPhase(prev => prev + phaseSpeed);
      animationFrame = requestAnimationFrame(updatePhase);
    };

    if (isPlaying) {
      animationFrame = requestAnimationFrame(updatePhase);
    }

    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying]);

  // Generate a high-resolution sine wave path between startX and endX.
  const generateWaveSegment = useCallback(
    (startX: number, endX: number, phase: number) => {
      let d = "";
      for (let x = startX; x <= endX; x += 0.5) {
        const y = center + amplitude * Math.sin((Math.PI * 2 * x) / period + phase);
        d += x === startX ? `M${x.toFixed(2)},${y.toFixed(2)}` : ` L${x.toFixed(2)},${y.toFixed(2)}`;
      }
      return d;
    },
    [amplitude, center, period]
  );

  // Calculate the current x position based on progress.
  const currentX = (progress / (duration || 1)) * viewBoxWidth;
  // Played portion as an animated sine wave.
  const playedPath = isPlaying && currentX > 0 
    ? generateWaveSegment(0, currentX, phase)
    : `M0,${center} L${currentX},${center}`;
  // Upcoming portion as a flat line.
  const upcomingPath = `M${currentX.toFixed(2)},${center} L${viewBoxWidth},${center}`;

  // Indicator is a vertical bar fixed on the flat (upcoming) segment.
  const indicatorWidth = 2;
  const indicatorHeight = 10;
  const indicatorX = currentX - indicatorWidth / 2;
  const indicatorY = center - indicatorHeight / 2;

  // Helper: Format seconds into mm:ss.
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

  // Toggle play/pause.
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handleTimeUpdate = () => {
        setProgress(audio.currentTime);
      };
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
      };
      const handleEnded = () => {
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

  // Reset audio element when the current track changes.
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      setProgress(0);
      if (audioRef.current.readyState >= 1) {
        setDuration(audioRef.current.duration);
      }
      if (isPlaying) {
        audioRef.current.play();
      }
    }
  }, [currentTrack]);

  // Handle seek changes.
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setProgress(newTime);
    }
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-800 p-4 shadow-lg">
      {/* Audio element */}
      <audio ref={audioRef} src={currentTrack.url} preload="metadata" key={currentTrack.id} />

      {/* Header */}
      <div className="grid grid-cols-3 items-center px-4 max-w-md lg:max-w-lg justify-center mx-auto">
        <div></div>
        <div className="text-center">
          <h4 className="text-zinc-900 dark:text-zinc-100 font-semibold text-lg">{currentTrack.title}</h4>
        </div>
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
        <span className="text-sm text-zinc-900 dark:text-zinc-100">{formatTime(progress)}</span>
        <div className="relative mx-2 w-full" style={{ height: `${viewBoxHeight}px` }}>
          <svg className="w-full h-full" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} preserveAspectRatio="none">
            {isPlaying ? (
              <>
                {/* Played portion as an animated sine wave */}
                <path d={playedPath} fill="none" stroke="#a1a1aa" strokeWidth="1" />
                {/* Upcoming portion as a flat line */}
                <path d={upcomingPath} fill="none" stroke="#a1a1aa" strokeWidth="1" />
              </>
            ) : (
              // When paused, display a complete flat line.
              <path d={`M0,${center} L${viewBoxWidth},${center}`} fill="none" stroke="#a1a1aa" strokeWidth="1" />
            )}
            {/* Indicator bar on the flat line */}
            <rect x={indicatorX} y={center - indicatorHeight / 2} width={1} height={indicatorHeight} className='fill-zinc-900 dark:fill-zinc-100' />
          </svg>
          {/* Invisible range input overlay for seeking */}
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={progress}
            onChange={handleSeek}
            onInput={handleSeek}
            className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <span className="text-sm text-zinc-900 dark:text-zinc-100">{formatTime(duration)}</span>
      </div>

      {/* Custom Styles */}
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
