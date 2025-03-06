'use client';

import React, { useEffect, useState } from 'react';
import Select, { MultiValue, StylesConfig } from 'react-select';
import { fetchFromAPI } from '../utils/communication';

export interface Tag {
  id: string;
  name: string;
}

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

  // **Custom Styles for react-select**
  const customStyles: StylesConfig<Option, true> = {
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
    multiValue: (styles) => ({
      ...styles,
      backgroundColor: '#8B5CF6',
      borderRadius: '4px',
      padding: '2px 6px',
      color: '#ffffff',
    }),
    multiValueLabel: (styles) => ({
      ...styles,
      color: '#ffffff',
    }),
    multiValueRemove: (styles) => ({
      ...styles,
      color: '#ffffff',
      ':hover': {
        backgroundColor: '#7C3AED',
        color: '#ffffff',
      },
    }),
    singleValue: (styles) => ({
      ...styles,
      color: 'var(--tw-text-opacity) var(--tw-text)',
    }),
  };

  return (
    <Select
      isMulti
      options={options}
      value={selectedOptions}
      onChange={handleChange}
      placeholder="Select tags"
      styles={customStyles}
      className="bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-300 dark:border-zinc-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
    />
  );
};

export default TagSelector;
