'use client';

import React, { useEffect, useState } from 'react';
import Select, { MultiValue, StylesConfig } from 'react-select';
import { fetchFromAPI } from '../utils/communication';
import { Tag } from './types';

interface Option {
  value: string;
  label: string;
  isDisabled?: boolean;
}

interface TagSelectorProps {
  onTagChange: (tags: Tag[]) => void;
  disabledTagIds?: string[];
}

const TagSelector: React.FC<TagSelectorProps> = ({ onTagChange, disabledTagIds = [] }) => {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetchFromAPI('/sound/tags');
        if (!res.ok) {
          throw new Error('Failed to fetch tags');
        }
        const data: Tag[] = await res.json();
        setAvailableTags(data);
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    fetchTags();
  }, []);

  const options: Option[] = availableTags.map((tag) => ({
    value: tag.id,
    label: tag.name,
    isDisabled: disabledTagIds.includes(tag.id),
  }));

  const handleChange = (selected: MultiValue<Option>) => {
    const tags: Tag[] = selected
      ? selected.map((option) => ({ id: option.value, name: option.label }))
      : [];
    setSelectedOptions(selected as Option[]);
    onTagChange(tags);
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
      color: '#f4f4f5', // zinc-100
      '&:hover': {
        backgroundColor: '#0284c7', // sky-600
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
      isMulti
      options={options}
      value={selectedOptions}
      onChange={handleChange}
      placeholder="Select tags"
      className="react-select-container"
      classNamePrefix="react-select"
      styles={customStyles} // Apply custom styles for better theming
    />
  );
};

export default TagSelector;