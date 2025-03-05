'use client';

import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { fetchFromAPI } from '../utils/communication';

export interface Tag {
  id: string;
  name: string;
}

interface Option {
  value: string;
  label: string;
}

interface TagSelectorProps {
  onTagChange: (tags: Tag[]) => void;
  // Array of tag IDs to be disabled/filtered out
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
  }));

  // Filter out options whose IDs appear in disabledTagIds
  const filteredOptions = options.filter(
    (option) => !disabledTagIds.includes(option.value)
  );

  const handleChange = (selected: Option[] | null) => {
    const tags: Tag[] = selected
      ? selected.map((option) => ({ id: option.value, name: option.label }))
      : [];
    setSelectedOptions(selected || []);
    onTagChange(tags);
  };

  return (
    <Select
      isMulti
      options={filteredOptions}
      value={selectedOptions}
      onChange={handleChange}
      className="mb-2"
    />
  );
};

export default TagSelector;
