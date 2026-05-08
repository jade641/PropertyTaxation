import { useState, type ChangeEvent } from 'react';
import { Input } from './ui/input.tsx';
import { Button } from './ui/button.tsx';
import { Badge } from './ui/badge.tsx';
import { Card, CardContent } from './ui/card.tsx';
import { 
  Search, 
  Calendar, 
  X,
  SlidersHorizontal
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover.tsx';

interface FilterOption {
  id: string;
  label: string;
  value: string;
  category: string;
}

interface SearchAndFilterProps {
  placeholder?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters?: FilterOption[];
  activeFilters: string[];
  onFilterChange: (filters: string[]) => void;
  userRole: 'patient' | 'dentist' | 'admin';
  context: 'appointments' | 'patients' | 'treatments' | 'records';
}

export function SearchAndFilter({
  placeholder = 'Search...',
  searchValue,
  onSearchChange,
  filters = [],
  activeFilters,
  onFilterChange,
  userRole,
  context
}: SearchAndFilterProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Default filters based on context and user role
  const getDefaultFilters = (): FilterOption[] => {
    const baseFilters: FilterOption[] = [];

    if (context === 'appointments') {
      baseFilters.push(
        { id: 'today', label: 'Today', value: 'today', category: 'Date' },
        { id: 'week', label: 'This Week', value: 'week', category: 'Date' },
        { id: 'month', label: 'This Month', value: 'month', category: 'Date' },
        { id: 'confirmed', label: 'Confirmed', value: 'confirmed', category: 'Status' },
        { id: 'pending', label: 'Pending', value: 'pending', category: 'Status' },
        { id: 'completed', label: 'Completed', value: 'completed', category: 'Status' },
        { id: 'cancelled', label: 'Cancelled', value: 'cancelled', category: 'Status' }
      );

      if (userRole !== 'patient') {
        baseFilters.push(
          { id: 'emergency', label: 'Emergency', value: 'emergency', category: 'Type' },
          { id: 'routine', label: 'Routine', value: 'routine', category: 'Type' },
          { id: 'followup', label: 'Follow-up', value: 'followup', category: 'Type' }
        );
      }
    } else if (context === 'patients' && userRole !== 'patient') {
      baseFilters.push(
        { id: 'active', label: 'Active', value: 'active', category: 'Status' },
        { id: 'treatment', label: 'In Treatment', value: 'treatment', category: 'Status' },
        { id: 'overdue', label: 'Overdue', value: 'overdue', category: 'Status' },
        { id: 'new', label: 'New Patients', value: 'new', category: 'Status' }
      );
    } else if (context === 'treatments') {
      baseFilters.push(
        { id: 'cleaning', label: 'Cleaning', value: 'cleaning', category: 'Type' },
        { id: 'filling', label: 'Filling', value: 'filling', category: 'Type' },
        { id: 'root-canal', label: 'Root Canal', value: 'root-canal', category: 'Type' },
        { id: 'crown', label: 'Crown', value: 'crown', category: 'Type' },
        { id: 'extraction', label: 'Extraction', value: 'extraction', category: 'Type' },
        { id: 'in-progress', label: 'In Progress', value: 'in-progress', category: 'Status' },
        { id: 'completed', label: 'Completed', value: 'completed', category: 'Status' },
        { id: 'scheduled', label: 'Scheduled', value: 'scheduled', category: 'Status' }
      );
    }

    return filters.length > 0 ? filters : baseFilters;
  };

  const availableFilters = getDefaultFilters();
  const groupedFilters = availableFilters.reduce((acc, filter) => {
    if (!acc[filter.category]) {
      acc[filter.category] = [];
    }
    acc[filter.category].push(filter);
    return acc;
  }, {} as Record<string, FilterOption[]>);

  const handleFilterToggle = (filterId: string) => {
    const newFilters = activeFilters.includes(filterId)
      ? activeFilters.filter(f => f !== filterId)
      : [...activeFilters, filterId];
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange([]);
  };

  const getFilterLabel = (filterId: string) => {
    const filter = availableFilters.find(f => f.id === filterId);
    return filter?.label || filterId;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={placeholder}
            value={searchValue}
            onChange={(e: ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            className="pl-10 border-gray-200 focus:border-teal-500 focus:ring-teal-500/20 transition-all duration-200"
          />
        </div>

        {/* Filter Button */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="border-gray-200 hover:border-teal-300 transition-colors relative"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filters
              {activeFilters.length > 0 && (
                <Badge className="ml-2 bg-teal-500 text-white">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Filter Options</h4>
                  {activeFilters.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-gray-500 hover:text-red-600"
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {Object.entries(groupedFilters).map(([category, filters]) => (
                    <div key={category}>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">{category}</h5>
                      <div className="space-y-2">
                        {filters.map((filter) => (
                          <label
                            key={filter.id}
                            className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={activeFilters.includes(filter.id)}
                              onChange={() => handleFilterToggle(filter.id)}
                              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500/20"
                            />
                            <span className="text-sm text-gray-700">{filter.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </PopoverContent>
        </Popover>

        {/* Quick Actions based on context */}
        {context === 'appointments' && userRole === 'patient' && (
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Calendar className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {activeFilters.map((filterId) => (
            <Badge
              key={filterId}
              variant="secondary"
              className="bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 cursor-pointer transition-colors"
              onClick={() => handleFilterToggle(filterId)}
            >
              {getFilterLabel(filterId)}
              <X className="w-3 h-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}

      {/* Search Results Summary */}
      {searchValue && (
        <div className="text-sm text-gray-600">
          Searching for: <span className="font-medium text-gray-900">"{searchValue}"</span>
        </div>
      )}
    </div>
  );
}