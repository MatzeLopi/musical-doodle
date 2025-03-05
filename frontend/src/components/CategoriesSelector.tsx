'use client';

import React, { useEffect, useState } from 'react';
import Select, { SingleValue } from 'react-select';
import { fetchFromAPI } from '../utils/communication';

export interface Category {
  id: string;
  name: string;
}

interface Option {
  value: string;
  label: string;
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
  }));

  // Filter out options based on disabledCategoryIds
  const filteredOptions = options.filter(
    (option) => !disabledCategoryIds.includes(option.value)
  );

  const handleChange = (option: SingleValue<Option>) => {
    setSelectedOption(option);
    const selectedCategory = option
      ? categories.find((cat) => cat.id === option.value) || null
      : null;
    onCategoryChange(selectedCategory);
  };

  return (
    <Select
      options={filteredOptions}
      value={selectedOption}
      onChange={handleChange}
      isClearable
      className="mb-2"
      placeholder="Select a category"
    />
  );
};

export default CategorySelector;
