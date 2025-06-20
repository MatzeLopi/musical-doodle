'use client';

import React, { useState } from 'react';
import TagSelector from './TagSelector';
import CategorySelector from './CategoriesSelector';
import { Category, Tag, SearchFilters } from './types';


interface SearchComponentProps {
  onSearch: (filters: SearchFilters) => void;
}

const SearchComponent: React.FC<SearchComponentProps> = ({ onSearch }) => {
  const [tags_included, setTagsIncluded] = useState<Tag[]>([]);
  const [tags_excluded, setTagsExcluded] = useState<Tag[]>([]);
  const [categories_included, setCategoryIncluded] = useState<Category[]>([]);
  const [categories_excluded, setCategoryExcluded] = useState<Category[]>([]);
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch({
      tags_included: tags_included.length ? tags_included : undefined,
      tags_excluded: tags_excluded.length ? tags_excluded : undefined,
      categories_included: categories_included.length ? categories_included : undefined,
      categories_excluded: categories_excluded.length ? categories_excluded : undefined,
      creator: username.trim() ? username : undefined,
      title: title.trim() ? title : undefined,
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
        className="w-32 p-2 border border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
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
        className="w-32 p-2 border border-zinc-300 dark:border-zinc-600 bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
      />
    </div>

    {/* Tags Included */}
    <div className="flex flex-col">
      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Tags In</label>
      <div className="min-w-[150px]">
        <TagSelector
          onTagChange={setTagsIncluded}
          disabledTagIds={tags_excluded.map((tag) => tag.id)}
        />
      </div>
    </div>

    {/* Tags Excluded */}
    <div className="flex flex-col">
      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Tags Out</label>
      <div className="min-w-[150px]">
        <TagSelector
          onTagChange={setTagsExcluded}
          disabledTagIds={tags_included.map((tag) => tag.id)}
        />
      </div>
    </div>

    {/* Category Included */}
    <div className="flex flex-col">
      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Cat In</label>
      <div className="min-w-[120px]">
        <CategorySelector
          onCategoryChange={setCategoryIncluded}
          disabledCategoryIds={categories_excluded.map((cat) => cat.id)}
        />
      </div>
    </div>

    {/* Category Excluded */}
    <div className="flex flex-col">
      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Cat Out</label>
      <div className="min-w-[120px]">
        <CategorySelector
          onCategoryChange={setCategoryExcluded}
          disabledCategoryIds={categories_included.map((cat) => cat.id)}
        />
      </div>
    </div>

    {/* Search Button */}
    <div className="flex flex-col self-end">
      <button
        type="submit"
        className="w-full px-4 py-2 text-white bg-sky-600 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
      >
        Search
      </button>
    </div>
  </form>

  );
};

export default SearchComponent;