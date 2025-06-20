import React from 'react';
import AudioCard from './AudioCard';
import { Audio } from './types';

interface HorizontalCarouselProps {
    audios: Audio[];
}

const HorizontalCarousel: React.FC<HorizontalCarouselProps> = ({ audios }) => {
    if (!audios || audios.length === 0) {
        return <p className="text-center text-zinc-500">No tracks to display yet.</p>;
    }

    // Duplicate the audios to create a seamless loop
    const extendedAudios = [...audios, ...audios];

    return (
        <div className="overflow-hidden relative mb-10" >
            <div className="flex animate-scroll">
                {extendedAudios.map((audio, index) => (
                    <div key={`${audio.id}-${index}`} className="flex-shrink-0 w-80 mx-2">
                        <AudioCard {...audio} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HorizontalCarousel;