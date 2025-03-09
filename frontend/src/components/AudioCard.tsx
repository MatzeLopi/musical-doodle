import React from 'react';
import PlayButton from './PlayButton';
import TagBadge from './Tag';
import CategoryBadge from './Category';
import {Tag, Category} from './types';

interface AudioProps {
  id: string;
  title: string;
  creator: string;
  description: string;
  audio_url: string;
  private: boolean;
  category: Category;
  tags: Tag[];
  showPrivateIndicator?: boolean;
}

// Creator button component
const CreatorButton = ({ creator }: { creator: string }) => (
    <a
      href={`/creator/${creator}`}
      rel="noopener noreferrer"
      className="bg-rose-600 rounded-md hover:bg-rose-700 text-white text-xs font-semibold px-3 py-1 transition"
    >
      Profile
    </a>
  );
  
  
  // Tags list component
  const TagsList = ({ tags }: { tags: Tag[] }) => (
    <div className="flex flex-wrap">
        {tags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
        ))}
    </div>
  );

const cropText = (text:string, maxLength:number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '[...]' : text;
  };

const AudioCard: React.FC<AudioProps> = ({
  id,
  title,
  creator,
  description,
  audio_url,
  private: isPrivate,
  category,
  tags,
  showPrivateIndicator = false // Private indicator disabled by default

}) => {
  return (
    <div className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow rounded-lg p-4 mb-4 transition-all hover:shadow-md">
      
      {/* Header with title, category and play button */}
      <div className="flex items-center justify-center space-x-4 sm:max-w-sm md:max-w-md xl:max-w-xl m-auto">
        <div className="flex-1 flex flex-col">
          <div className="flex items-center space-x-2">
            <h3 className="text-xl font-semibold">{cropText(title, 40)}</h3>
            <CategoryBadge category={category} />
          </div>
          {/* Preview of the description */}
          <p className="text-zinc-600 dark:text-zinc-400 break-words">{cropText(description, 200)}</p>
        </div>
        <div className="flex-none justify-center">
          <PlayButton track={{ id, title, url: audio_url }} />
        </div>
      </div>
      
      {/* Metadata: Creator and Tags on the left; optional Private indicator on the right */}
      <div className="flex items-center justify-center mt-3">
        <div className="flex items-center space-x-2">
          <CreatorButton creator={creator} />
          <TagsList tags={tags} />
        </div>
        {showPrivateIndicator && (
          <div className="flex items-center space-x-2 text-xs">
            <strong>Private:</strong>
            <span
              className={`px-2 py-1 font-semibold rounded-md ${
                isPrivate ? 'bg-rose-600 text-white' : 'bg-emerald-500 text-white'
              }`}
            >
              {isPrivate ? 'Yes' : 'No'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioCard;
