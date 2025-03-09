import React, { useState, useEffect, useRef, useCallback } from 'react';
import AudioCard from './AudioCard';
import { Category, Tag } from './types';

export type SortField = 'title' | 'creator' | 'category' | 'private';

interface Audio {
  id: string;
  title: string;
  creator: string;
  description: string;
  audio_url: string;
  private: boolean;
  category: Category;
  tags: Tag[];
}

// Simulate a backend that returns 10 items per page.
export const generateMockAudios = (page: number, count: number = 10): Audio[] => {
  const audios: Audio[] = [];
  for (let i = 0; i < count; i++) {
    const index = (page - 1) * count + i + 1;
    audios.push({
      id: `id-${index}`,
      title: `Audio Title ${index}`,
      creator: `creator-${(index % 5) + 1}`, // Simulate 5 different creators.
      description: `This is a description for audio ${index}.`,
      audio_url: `https://example.com/audio${index}.mp3`,
      private: index % 2 === 0, // Alternate privacy status.
      category: {id: `category-${(index % 3) + 1}`, name: `Category ${index % 3 + 1}`},
      tags: [{id: `tag-${index % 5 + 1}`, name: `Tag ${index % 5 + 1}`}],
    });
  }
  return audios;
};

const AudioList: React.FC = () => {
  const [audios, setAudios] = useState<Audio[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Observer to detect when the last item is visible.
  const observer = useRef<IntersectionObserver | null>(null);
  const lastAudioElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0] && entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [hasMore]
  );

  // Simulate a backend fetch whenever page, sortField, or sortOrder changes.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const newAudios = generateMockAudios(page);
      // Simulate backend sorting.
      const sortedAudios = newAudios.sort((a, b) => {
        let comparison = 0;
        if (a[sortField] < b[sortField]) {
          comparison = -1;
        } else if (a[sortField] > b[sortField]) {
          comparison = 1;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
      if (sortedAudios.length === 0) {
        setHasMore(false);
      } else {
        setAudios((prev) => [...prev, ...sortedAudios]);
      }
    }, 500); // Simulate network delay.
    return () => clearTimeout(timeoutId);
  }, [page, sortField, sortOrder]);

  // Handle sort field change. In production, this would trigger a new backend request.
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const field = e.target.value as SortField;
    setSortField(field);
    // Reset list to simulate fetching sorted data from the backend.
    setAudios([]);
    setPage(1);
    setHasMore(true);
  };

  // Toggle sort order.
  const toggleSortOrder = () => {
    setSortOrder((prev) => {
      const newOrder = prev === 'asc' ? 'desc' : 'asc';
      // Reset list to simulate fetching sorted data from the backend.
      setAudios([]);
      setPage(1);
      setHasMore(true);
      return newOrder;
    });
  };

  return (
    <div className="p-4">
    {/* Sorting Controls */}
    <div className="flex items-center space-x-4 mb-6">
        <label htmlFor="sortField" className="text-sm text-zinc-700 dark:text-zinc-300">
        Sort by:
        </label>

        {/* Sort Dropdown */}
        <select
        id="sortField"
        value={sortField}
        onChange={handleSortChange}
        className="p-2 border border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md focus:outline-none focus:ring-purple-500 focus:border-purple-500"
        >
        <option value="title">Title</option>
        <option value="creator">Creator</option>
        <option value="category">Category</option>
        <option value="private">Privacy</option>
        </select>

        {/* Sort Order Button */}
        <button
        onClick={toggleSortOrder}
        className="p-2 text-white bg-rose-600 rounded-md hover:bg-rose-700 transition-all"
        >
        {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        </button>
    </div>

    {/* Audio List */}
    <div className="space-y-6">
        {audios.map((audio, index) => (
        <div key={audio.id} ref={index === audios.length - 1 ? lastAudioElementRef : undefined}>
            <AudioCard {...audio} />
        </div>
        ))}
    </div>

    {/* No More Audios Message */}
    {!hasMore && (
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-6">
        No more audios to load.
        </p>
    )}
    </div>

  );
};

export default AudioList;
