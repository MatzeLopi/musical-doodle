'use client';

import React, { useState } from 'react';
import TagSelector, { Tag } from './TagSelector';
import CategorySelector, { Category } from './CategoriesSelector';

export interface SearchFilters {
  tagsIncluded: Tag[];
  tagsExcluded: Tag[];
  categoryIncluded: Category | null;
  categoryExcluded: Category | null;
  username: string;
  title: string;
}

interface SearchComponentProps {
  onSearch: (filters: SearchFilters) => void;
}

const SearchComponent: React.FC<SearchComponentProps> = ({ onSearch }) => {
  const [tagsIncluded, setTagsIncluded] = useState<Tag[]>([]);
  const [tagsExcluded, setTagsExcluded] = useState<Tag[]>([]);
  const [categoryIncluded, setCategoryIncluded] = useState<Category | null>(null);
  const [categoryExcluded, setCategoryExcluded] = useState<Category | null>(null);
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch({
      tagsIncluded,
      tagsExcluded,
      categoryIncluded,
      categoryExcluded,
      username,
      title,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-full mx-auto p-2 bg-white rounded shadow flex flex-wrap items-center gap-4"
    >

        {/* Username */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">User</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="User"
          className="w-32 p-1 border border-gray-300 rounded"
        />
      </div>

      {/* Title */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-32 p-1 border border-gray-300 rounded"
        />
      </div>
      
      {/* Tags Included */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Tags In</label>
        <div className="min-w-[150px]">
          <TagSelector
            onTagChange={setTagsIncluded}
            disabledTagIds={tagsExcluded.map((tag) => tag.id)}
          />
        </div>
      </div>

      {/* Tags Excluded */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Tags Out</label>
        <div className="min-w-[150px]">
          <TagSelector
            onTagChange={setTagsExcluded}
            disabledTagIds={tagsIncluded.map((tag) => tag.id)}
          />
        </div>
      </div>

      {/* Category Included */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Cat In</label>
        <div className="min-w-[120px]">
          <CategorySelector
            onCategoryChange={setCategoryIncluded}
            disabledCategoryIds={categoryExcluded ? [categoryExcluded.id] : []}
          />
        </div>
      </div>

      {/* Category Excluded */}
      <div className="flex flex-col">
        <label className="text-xs text-gray-600">Cat Out</label>
        <div className="min-w-[120px]">
          <CategorySelector
            onCategoryChange={setCategoryExcluded}
            disabledCategoryIds={categoryIncluded ? [categoryIncluded.id] : []}
          />
        </div>
      </div>

      

      {/* Search Button */}
      <div className="flex flex-col">
        <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 whitespace-nowrap">
          Search
        </button>
      </div>
    </form>
  );
};

export default SearchComponent;
