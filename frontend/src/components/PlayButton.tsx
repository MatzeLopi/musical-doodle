import React from 'react';

interface PlayButtonProps {
    func: () => void;
}

const PlayButton: React.FC<PlayButtonProps> = (func) => {
    return (
        <button
            onClick={() => func}
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
    );
};
export default PlayButton;
