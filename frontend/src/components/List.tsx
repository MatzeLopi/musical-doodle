import React from "react";
import Audio, { AudioType } from "./Audio";

interface AudioListProps {
    audios: AudioType[];
}

const AudioList: React.FC<AudioListProps> = ({ audios }) => {
    if (audios.length === 0) {
        return <p className="text-center text-gray-500">No audios to display</p>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-200">
                {audios.map((audio) => (
                    <Audio key={audio.id} audio={audio} />
                ))}
            </div>
        </div>
    );
};


export default AudioList;
