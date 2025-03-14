import React, { useState, useEffect, useRef, useCallback } from 'react';
import AudioCard from './AudioCard';
import { Category, Tag } from './types';
import { fetchFromAPI } from '../utils/communication';
import { SearchFilters } from './types';

export type SortField = 'title' | 'creator' | 'category' | 'private';

export interface Audio {
  id: string;
  title: string;
  creator: string;
  description: string;
  audio_url: string;
  private: boolean;
  category: Category;
  tags: Tag[];
}

interface AudioListProps {
  audios: Audio[];
}

const PAGE_SIZE = 20;

const AudioList: React.FC<AudioListProps> = ({ audios }) => {

  if (!audios) {
    return null;
  }


  return (
    <div className="space-y-6">
      {audios.map((audio, index) => (
        <div
          key={audio.id}
        >
          <AudioCard {...audio} />
        </div>
      ))}

    </div>
  );
};

export default AudioList;
