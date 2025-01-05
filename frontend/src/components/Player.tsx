import React, { useRef, useState, useEffect } from "react";

interface PlayerProps {
    src: string;
}

const Player: React.FC<PlayerProps> = ({ src }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [duration, setDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            const handleLoadedMetadata = () => {
                setDuration(audio.duration);
            };

            const handleTimeUpdate = () => {
                setCurrentTime(audio.currentTime);
            };

            audio.addEventListener("loadedmetadata", handleLoadedMetadata);
            audio.addEventListener("timeupdate", handleTimeUpdate);

            return () => {
                audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
                audio.removeEventListener("timeupdate", handleTimeUpdate);
            };
        }
    }, []);

    const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (audio) {
            audio.currentTime = Number(event.target.value);
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    };

    return (
        <div className="player bg-white shadow-md rounded-lg p-4 w-full max-w-md mx-auto mt-4">
            <audio ref={audioRef} controls className="w-full">
                <source src={src} type="audio/wav" />
                Your browser does not support the audio element.
            </audio>
            <div className="flex items-center justify-between mt-2">
                <span>{formatTime(currentTime)}</span>
                <input
                    type="range"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full mx-2"
                />
                <span>{formatTime(duration)}</span>
            </div>
        </div>
    );
};

export default Player;