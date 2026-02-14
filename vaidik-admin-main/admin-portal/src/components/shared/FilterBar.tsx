'use client';

import { Search, X } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface Filter {
  value: string;
  onChange: (value: string) => void;
  options: FilterOption[];
  placeholder?: string;
  label?: string;
}

export interface SearchConfig {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface FilterBarProps {
  filters: Filter[];
  onReset?: () => void;
  
  // Support both patterns
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  search?: SearchConfig;
}

export function FilterBar({
  filters,
  onReset,
  searchQuery,
  onSearchChange,
  searchPlaceholder,
  search,
}: FilterBarProps) {
  // Support both search patterns
  const finalSearchValue = search?.value ?? searchQuery ?? '';
  const finalSearchOnChange = search?.onChange ?? onSearchChange;
  const finalSearchPlaceholder = search?.placeholder ?? searchPlaceholder ?? 'Search...';

  const hasActiveFilters = filters.some((f) => f.value) || (finalSearchValue && finalSearchValue.length > 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        {finalSearchOnChange && (
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={finalSearchValue}
                onChange={(e) => finalSearchOnChange(e.target.value)}
                placeholder={finalSearchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              {finalSearchValue && (
                <button
                  onClick={() => finalSearchOnChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filter Dropdowns */}
        {filters.map((filter, index) => (
          <div key={index} className="min-w-[200px]">
            {filter.label && (
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {filter.label}
              </label>
            )}
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="">{filter.placeholder || 'All'}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Reset Button */}
        {hasActiveFilters && onReset && (
          <div className="flex items-end">
            <button
              onClick={onReset}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
