import React, { useRef, useState, useEffect } from "react";


interface PlayerProps {
    src?: string;
    title?: string;
}

const Player: React.FC<PlayerProps> = ({ src, title }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [duration, setDuration] = useState<number>(0);
    const [currentTime, setCurrentTime] = useState<number>(0);
    const [audioTitle, setAudioTitle] = useState<string>("");

    useEffect(() => {
        const fetchDuration = async () => {
            console.log("Fetching headers for:", src);
            if (src === undefined) {
                return;
            }
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

                const title = response.headers.get("X-Title");
                if (title) {
                    setAudioTitle(title);
                } else {
                    console.error("X-Title header not found");
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
            // Play the new audio when the `src` changes
            audio.load();
            audio.play().catch((err) => console.error("Playback error:", err));
        }
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
        <div className="player bg-gray-200 text-gray-800 shadow-md rounded-lg p-4 w-full max-w-xs mx-auto">
            {/* Title */}
            <h2 className="text-center font-semibold text-lg text-gray-700 mb-4">
                {audioTitle || title}
            </h2>
            {/* Time and Seek Bar */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium">{formatTime(currentTime)}</span>
                <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full mx-2 h-2 bg-gray-300 rounded-lg cursor-pointer appearance-none"
                />
                <span className="text-xs font-medium">{formatTime(duration)}</span>
            </div>

            <audio ref={audioRef} className="hidden">
                <source src={src} type="audio/wav" />
                Your browser does not support the audio element.
            </audio>

            {/* Control Buttons */}
            <div className="flex justify-around">
                {/* Back to beginning */}
                <button
                    onClick={() => {
                        const audio = audioRef.current;
                        if (audio) {
                            audio.currentTime = 0;
                        }
                    }}
                    className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-400 transition focus:outline-none"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M12 2.181a.75.75 0 0 1 1.177-.616l4.432 3.068a.75.75 0 0 1 0 1.234l-4.432 3.068A.75.75 0 0 1 12 8.32V6a7 7 0 1 0 7 7 1 1 0 1 1 2 0 9 9 0 1 1-9-9V2.181z"
                            clipRule="evenodd"
                        />
                    </svg>

                </button>
                {/* Play */}
                <button
                    onClick={() => audioRef.current?.play()}
                    className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-400 transition focus:outline-none"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M8.286 3.407A1.5 1.5 0 0 0 6 4.684v14.632a1.5 1.5 0 0 0 2.286 1.277l11.888-7.316a1.5 1.5 0 0 0 0-2.555L8.286 3.407z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
                {/* Pause */}
                <button
                    onClick={() => audioRef.current?.pause()}
                    className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-400 transition focus:outline-none"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M5.163 3.819C5 4.139 5 4.559 5 5.4v13.2c0 .84 0 1.26.163 1.581a1.5 1.5 0 0 0 .656.655c.32.164.74.164 1.581.164h.2c.84 0 1.26 0 1.581-.163a1.5 1.5 0 0 0 .656-.656c.163-.32.163-.74.163-1.581V5.4c0-.84 0-1.26-.163-1.581a1.5 1.5 0 0 0-.656-.656C8.861 3 8.441 3 7.6 3h-.2c-.84 0-1.26 0-1.581.163a1.5 1.5 0 0 0-.656.656zm9 0C14 4.139 14 4.559 14 5.4v13.2c0 .84 0 1.26.164 1.581a1.5 1.5 0 0 0 .655.655c.32.164.74.164 1.581.164h.2c.84 0 1.26 0 1.581-.163a1.5 1.5 0 0 0 .655-.656c.164-.32.164-.74.164-1.581V5.4c0-.84 0-1.26-.163-1.581a1.5 1.5 0 0 0-.656-.656C17.861 3 17.441 3 16.6 3h-.2c-.84 0-1.26 0-1.581.163a1.5 1.5 0 0 0-.655.656z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
                {/* Forward 10 seconds */}
                <button
                    onClick={() => {
                        const audio = audioRef.current;
                        if (audio) {
                            audio.currentTime = Math.min(audio.currentTime + 10, duration);
                        }
                    }}
                    className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-400 transition focus:outline-none"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M3 5.625C3 4.6 4.167 4.01 4.992 4.619L12 9.787V5.625c0-1.025 1.167-1.615 1.992-1.006l8.371 6.174a1.5 1.5 0 0 1 0 2.414l-8.371 6.174c-.825.609-1.992.02-1.992-1.006v-4.163l-7.008 5.169C4.167 19.99 3 19.401 3 18.375V5.625z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Player;
