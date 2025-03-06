'use client';

import React, { useEffect, useState } from 'react';
import Select, { SingleValue, StylesConfig } from 'react-select';
import { fetchFromAPI } from '../utils/communication';

export interface Category {
  id: string;
  name: string;
}

interface Option {
  value: string;
  label: string;
  isDisabled?: boolean;
}

interface CategorySelectorProps {
  onCategoryChange: (category: Category | null) => void;
  disabledCategoryIds?: string[];
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  onCategoryChange,
  disabledCategoryIds = [],
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetchFromAPI('/sound/categories');
        if (!res.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data: Category[] = await res.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchCategories();
  }, []);

  const options: Option[] = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
    isDisabled: disabledCategoryIds.includes(cat.id),
  }));

  const handleChange = (option: SingleValue<Option>) => {
    setSelectedOption(option);
    const selectedCategory = option
      ? categories.find((cat) => cat.id === option.value) || null
      : null;
    onCategoryChange(selectedCategory);
  };

  // **Custom Styles for react-select**
  const customStyles: StylesConfig<Option, false> = {
    control: (styles, { isFocused }) => ({
      ...styles,
      backgroundColor: 'var(--tw-bg-opacity) var(--tw-bg)',
      borderColor: isFocused ? '#8B5CF6' : 'var(--tw-border-opacity) var(--tw-border)',
      borderWidth: '1px',
      borderRadius: '6px',
      padding: '2px',
      boxShadow: isFocused ? '0 0 0 2px rgba(139, 92, 246, 0.5)' : 'none',
      transition: 'all 0.2s ease-in-out',
    }),
    menu: (styles) => ({
      ...styles,
      backgroundColor: 'var(--tw-bg-opacity) var(--tw-bg)',
      borderRadius: '6px',
      padding: '4px 0',
      boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
    }),
    option: (styles, { isFocused, isDisabled }) => ({
      ...styles,
      backgroundColor: isFocused ? '#8B5CF6' : 'transparent',
      color: isFocused ? '#ffffff' : 'var(--tw-text-opacity) var(--tw-text)',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.5 : 1,
      transition: 'background-color 0.2s ease-in-out, color 0.2s ease-in-out',
    }),
    placeholder: (styles) => ({
      ...styles,
      color: 'var(--tw-text-opacity) var(--tw-text)',
      fontSize: '0.875rem',
    }),
    singleValue: (styles) => ({
      ...styles,
      color: 'var(--tw-text-opacity) var(--tw-text)',
    }),
  };

  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={handleChange}
      isClearable
      placeholder="Select a category"
      styles={customStyles}
      className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
    />
  );
};

export default CategorySelector;
