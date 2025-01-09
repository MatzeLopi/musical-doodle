import React from "react";

interface AudioType {
    title: string;
    id: number;
    source: string;
}

interface AudioProps {
    audio: AudioType;
}

const Audio: React.FC<AudioProps> = ({ audio }) => {
    return (
        <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 transition">
            <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div> {/* Placeholder for album art or icon */}
                <p className="text-gray-800 font-medium text-base">{audio.title}</p>
            </div>
            <div className="flex items-center space-x-2">
                <button className="text-green-500 hover:underline text-sm">
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
            </div>
        </div>
    );
};

export default Audio;
export type { AudioType };