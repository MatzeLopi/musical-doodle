import React from "react";

interface PlayerProps {
    src: string;
}

const Player: React.FC<PlayerProps> = ({ src }) => {
    return (
        <div className="player bg-white shadow-md rounded-lg p-4 w-full max-w-md mx-auto mt-4">
            <audio controls className="w-full">
                <source src={src} type="audio/wav" />
                Your browser does not support the audio element.
            </audio>
        </div>
    );
};

export default Player;