import React, { useRef, useState, useEffect } from "react";

interface PlayerProps {
    src: string;
}

const Player: React.FC<PlayerProps> = ({ src }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [duration, setDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);

    useEffect(() => {
        const fetchDuration = async () => {
            try {
                const response = await fetch(src, {
                    method: "HEAD",
                });

                const totalDuration = response.headers.get("X-Total-Duration");
                if (totalDuration) {
                    setDuration(parseFloat(totalDuration));
                } else {
                    console.error("X-Total-Duration header not found");
                }
            } catch (error) {
                console.error("Failed to fetch headers:", error);
            }
        };

        fetchDuration();
    }, [src]);

    useEffect(() => {
        const audio = audioRef.current;
        if (audio) {
            const handleLoadedMetadata = () => {
                if (!duration) {
                    setDuration(audio.duration);
                }
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
    }, [duration]);

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
        <div className="player bg-gray-500 bg-opacity-75 text-white shadow-lg rounded-lg p-6 w-full max-w-md mx-auto mt-8">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm">{formatTime(currentTime)}</span>
                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full mx-4 cursor-pointer appearance-none h-2 bg-gray-100 rounded-lg"
                />
                <span className="text-sm">{formatTime(duration)}</span>
            </div>
            <audio ref={audioRef} className="hidden">
                <source src={src} type="audio/wav" />
                Your browser does not support the audio element.
            </audio>

            <div className="flex justify-center gap-4">

                <button
                    onClick={() => {
                        const audio = audioRef.current;
                        if (audio) {
                            audio.currentTime = Math.max(audio.currentTime - 10, 0);
                        }
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-400 transition"
                >
                    -10s
                </button>

                <button
                    onClick={() => audioRef.current?.play()}
                    className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-400 transition flex items-center justify-center"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L14 12.586a1 1 0 010 1.414l-8.293 8.293a1 1 0 01-1.414-1.414L11.586 13 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
                <button
                    onClick={() => audioRef.current?.pause()}
                    className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-400 transition flex items-center justify-center"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M6 4a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1zm7 0a1 1 0 011 1v10a1 1 0 11-2 0V5a1 1 0 011-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
                <button
                    onClick={() => {
                        const audio = audioRef.current;
                        if (audio) {
                            audio.currentTime = Math.min(audio.currentTime + 10, duration);
                        }
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-400 transition"
                >
                    +10s
                </button>
            </div>
        </div>
    );
};

export default Player;
