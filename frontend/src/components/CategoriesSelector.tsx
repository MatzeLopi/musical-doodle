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
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ onCategoryChange }) => {
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

  const handleChange = (option: SingleValue<Option>) => {
    setSelectedOption(option);
    const selectedCategory = option
      ? categories.find((cat) => cat.id === option.value) || null
      : null;
    onCategoryChange(selectedCategory);
  };

  return (
    <Select
      options={options}
      value={selectedOption}
      onChange={handleChange}
      className="mb-2"
      placeholder="Select a category"
    />
  );
};

export default CategorySelector;