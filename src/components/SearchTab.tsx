import type { CourseRow } from '../types';
import type { CourseFilters } from '../utils/courseData';
import LegendDetails from './LegendDetails';
import FilterPanel from './FilterPanel';
import CoursesTable from './CoursesTable';

interface SearchTabProps {
  active: boolean;
  filters: CourseFilters;
  onFilterChange: (field: keyof CourseFilters, value: string) => void;
  onResetFilters: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  tableStatus: string;
  selectionSummary: string;
  loaded: boolean;
  visibleRows: CourseRow[];
  selectedIds: Set<string>;
  onToggleRow: (idToHoc: string, checked: boolean) => void;
  headSelectAllChecked: boolean;
  headSelectAllIndeterminate: boolean;
  onHeadSelectAllChange: (checked: boolean) => void;
}

interface SearchTabProps {
    active: boolean;
    filters: CourseFilters;
    onFilterChange: (field:keyof CourseFilters, value: string) => void;
    onResetFilters: () => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onRefresh: () => void;
    refreshing: boolean;
    tableStatus: string;
    selectionSummary: string;
    loaded: boolean;
    visibleRows: CourseRow[];
    selectedIds: Set<string>;
    onToggleRow: (idToHoc: string, checked: boolean) => void;
    headSelectAllChecked: boolean;
    headSelectAllIndeterminate: boolean;
    onHeadSelectAllChange: (checked:boolean) => void;
}

export default function SearchTab({
  active,
  filters,
  onFilterChange,
  onResetFilters,
  onSelectAll,
  onDeselectAll,
  onRefresh,
  refreshing,
  tableStatus,
  selectionSummary,
  loaded,
  visibleRows,
  selectedIds,
  onToggleRow,
  headSelectAllChecked,
  headSelectAllIndeterminate,
  onHeadSelectAllChange,
}: SearchTabProps) {
  return (
    <div id="search" className={`tab-panel${active ? ' active' : ''}`}>
      <LegendDetails />

      <FilterPanel
        filters={filters}
        onChange={onFilterChange}
        onReset={onResetFilters}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />

      <div className="status-bar">
        <div className="status" id="tableStatus">{tableStatus}</div>
        <div className="summary" id="selectionSummary">{selectionSummary}</div>
      </div>

      <CoursesTable
        loaded={loaded}
        visibleRows={visibleRows}
        selectedIds={selectedIds}
        onToggleRow={onToggleRow}
        headSelectAllChecked={headSelectAllChecked}
        headSelectAllIndeterminate={headSelectAllIndeterminate}
        onHeadSelectAllChange={onHeadSelectAllChange}
      />
    </div>
  );
}
