'use client';

import React, { useEffect, useState } from 'react';
import Select, { MultiValue, StylesConfig } from 'react-select';
import { fetchFromAPI } from '../utils/communication';
import { Category } from './types';

interface Option {
  value: string;
  label: string;
  isDisabled?: boolean;
}

interface CategorySelectorProps {
  onCategoryChange: (category: Category[]) => void;
  disabledCategoryIds?: string[];
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  onCategoryChange,
  disabledCategoryIds = [],
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);

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

  const handleChange = (selected: MultiValue<Option>) => {
    const newCategories: Category[] = selected
      ? selected.map((option) => ({ id: option.value, name: option.label }))
      : [];
    setSelectedOptions(selected as Option[]);
    onCategoryChange(newCategories);
  };

  // Custom Styles for react-select to handle dark mode with "sky" theme
  const customStyles: StylesConfig<Option, true> = {
    control: (provided) => ({
      ...provided,
      backgroundColor: 'transparent',
      borderColor: 'rgb(63 63 70 / 1)', // zinc-700
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#0284c7', // sky-600
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: '#3f3f46', // zinc-700
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? '#0369a1' : 'transparent', // sky-700
      color: state.isDisabled ? '#a1a1aa' : '#f4f4f5', // gray out disabled options
      '&:hover': {
        backgroundColor: state.isDisabled ? 'transparent' : '#0284c7', // sky-600
      },
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#0ea5e9', // sky-500
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'white',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'white',
      '&:hover': {
        backgroundColor: '#0284c7', // sky-600
        color: 'white',
      },
    }),
    input: (provided) => ({
      ...provided,
      color: '#f4f4f5', // zinc-100
    }),
  };

  return (
    <Select
      isMulti // Changed to isMulti
      options={options}
      value={selectedOptions}
      onChange={handleChange}
      placeholder="Select categories"
      className="react-select-container"
      classNamePrefix="react-select"
      styles={customStyles}
    />
  );
};

export default CategorySelector;