import type { CourseRow } from '../types';
import type { CourseFilters } from '../utils/courseData';

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

export default function SearchTab({
  active,
  tableStatus,
  selectionSummary,
}: SearchTabProps) {
  return (
    <div id="search" className={`tab-panel${active ? ' active' : ''}`}>

      <div className="status-bar">
        <div className="status" id="tableStatus">{tableStatus}</div>
        <div className="summary" id="selectionSummary">{selectionSummary}</div>
      </div>

    </div>
  );
}
