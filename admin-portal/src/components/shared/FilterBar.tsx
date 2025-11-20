// src/components/shared/FilterBar.tsx
import { Search, X, Filter } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: FilterOption[];
  placeholder?: string;
}

interface FilterBarProps {
  search?: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
  };
  filters?: FilterSelectProps[];
  onReset?: () => void;
  actions?: React.ReactNode; // For buttons like "Export" or "Create New"
}

export function FilterBar({ search, filters, onReset, actions }: FilterBarProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
      
      {/* Search and Filters Group */}
      <div className="flex-1 flex flex-col md:flex-row gap-3">
        
        {/* Search Input */}
        {search && (
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder || 'Search...'}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        )}

        {/* Dropdown Filters */}
        {filters?.map((filter, idx) => (
          <div key={idx} className="min-w-[160px]">
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
            >
              <option value="">{filter.placeholder || 'Filter'}</option>
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Reset Button */}
        {onReset && (
          <button
            onClick={onReset}
            className="flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            title="Reset Filters"
          >
            <X size={16} className="mr-1" />
            Reset
          </button>
        )}
      </div>

      {/* Right Side Actions (Export, Create, etc) */}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
