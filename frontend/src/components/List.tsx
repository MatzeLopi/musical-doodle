import React from "react";
import Audio, { AudioType } from "./Audio";

interface AudioListProps {
    audios: AudioType[];
    onPlay: (audio: AudioType) => void; // Callback function to handle play events
}

const AudioList: React.FC<AudioListProps> = ({ audios, onPlay }) => {
    if (audios.length === 0) {
        return <div></div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-200">
                {audios.map((audio) => (
                    console.log(audio),
                    <Audio key={audio.id} audio={audio} onPlay={() => onPlay(audio)} />
                ))}
            </div>
        </div>
    );
};


export default AudioList;
