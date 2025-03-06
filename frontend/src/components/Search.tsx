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

  return (<form
    onSubmit={handleSubmit}
    className="max-w-full mx-auto p-4 bg-white dark:bg-zinc-800 rounded-lg shadow-md flex flex-wrap md:flex-row items-center gap-4"
  >
    {/* Username */}
    <div className="flex flex-col">
      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">User</label>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="User"
        className="w-32 p-2 border border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
      />
    </div>

    {/* Title */}
    <div className="flex flex-col">
      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Title</label>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="w-32 p-2 border border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
      />
    </div>

    {/* Tags Included */}
    <div className="flex flex-col">
      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Tags In</label>
      <div className="min-w-[150px]">
        <TagSelector
          onTagChange={setTagsIncluded}
          disabledTagIds={tagsExcluded.map((tag) => tag.id)}
        />
      </div>
    </div>

    {/* Tags Excluded */}
    <div className="flex flex-col">
      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Tags Out</label>
      <div className="min-w-[150px]">
        <TagSelector
          onTagChange={setTagsExcluded}
          disabledTagIds={tagsIncluded.map((tag) => tag.id)}
        />
      </div>
    </div>

    {/* Category Included */}
    <div className="flex flex-col">
      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Cat In</label>
      <div className="min-w-[120px]">
        <CategorySelector
          onCategoryChange={setCategoryIncluded}
          disabledCategoryIds={categoryExcluded ? [categoryExcluded.id] : []}
        />
      </div>
    </div>

    {/* Category Excluded */}
    <div className="flex flex-col">
      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Cat Out</label>
      <div className="min-w-[120px]">
        <CategorySelector
          onCategoryChange={setCategoryExcluded}
          disabledCategoryIds={categoryIncluded ? [categoryIncluded.id] : []}
        />
      </div>
    </div>

    {/* Search Button */}
    <div className="flex flex-col">
      <button
        type="submit"
        className="px-4 py-2 bg-purple-600 text-white rounded-md shadow-md hover:bg-purple-700 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 whitespace-nowrap"
      >
        Search
      </button>
    </div>
  </form>

  );
};

export default SearchComponent;
