import type { CourseFilters } from '../utils/courseData';

interface FilterPanelProps {
  filters: CourseFilters;
  onChange: (field: keyof CourseFilters, value: string) => void;
  onReset: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

export default function FilterPanel({
  filters,
  onChange,
  onReset,
  onSelectAll,
  onDeselectAll,
  onRefresh,
  refreshing,
}: FilterPanelProps) {
  return (
    <div className="panel-card">
      <div className="field-group">
        <div className="field">
          <label htmlFor="filterCode">Mã MH <span className="field-hint">(VD: 61FIT2CAL)</span></label>
          <input
            id="filterCode"
            type="text"
            placeholder="Tìm theo mã môn học"
            value={filters.code}
            onChange={(e) => onChange('code', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="filterHe">Hệ đào tạo <span className="field-hint">(2 số đầu của Mã MH, hoặc tên hệ)</span></label>
          <select id="filterHe" value={filters.he} onChange={(e) => onChange('he', e.target.value)}>
            <option value="">Tất cả</option>
            <option value="61">61 - Tiêu chuẩn</option>
            <option value="62">62 - CLC</option>
            <option value="63">63 - Văn bằng 2</option>
            <option value="64">64 - Vừa làm vừa học</option>
            <option value="65">65 - Đào tạo từ xa</option>
            <option value="66">66 - Tiên tiến</option>
            <option value="LATROBE">La Trobe</option>
            <option value="OTHER">LIB, ITEC,...</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="filterName">Tên môn học</label>
          <input
            id="filterName"
            type="text"
            placeholder="Tìm theo tên môn học"
            value={filters.name}
            onChange={(e) => onChange('name', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="filterGroup">Nhóm</label>
          <input
            id="filterGroup"
            type="text"
            placeholder="Tìm theo nhóm"
            value={filters.group}
            onChange={(e) => onChange('group', e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="filterClass">Lớp</label>
          <input
            id="filterClass"
            type="text"
            placeholder="Tìm theo lớp"
            value={filters.class}
            onChange={(e) => onChange('class', e.target.value)}
          />
        </div>
      </div>

      <div className="button-row" style={{ marginTop: 18 }}>
        <button className="primary" id="resetFiltersButton" onClick={onReset}>Reset bộ lọc</button>
        <button className="secondary" id="selectAllButton" onClick={onSelectAll}>Chọn tất cả trang này</button>
        <button className="secondary" id="deselectAllButton" onClick={onDeselectAll}>Bỏ chọn tất cả</button>
        <button className="secondary" id="refreshCoursesButton" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Đang tải...' : '🔄 Làm mới danh sách (dữ liệu trực tiếp)'}
        </button>
      </div>
    </div>
  );
}