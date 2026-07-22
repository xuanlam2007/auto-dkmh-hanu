import type { CourseRow } from '../types';
import { formatTkb } from '../utils/courseData';

interface CoursesTableProps {
  loaded: boolean;
  visibleRows: CourseRow[];
  selectedIds: Set<string>;
  onToggleRow: (idToHoc: string, checked: boolean) => void;
  headSelectAllChecked: boolean;
  headSelectAllIndeterminate: boolean;
  onHeadSelectAllChange: (checked: boolean) => void;
}

export default function CoursesTable({
  loaded,
  visibleRows,
  selectedIds,
  onToggleRow,
  headSelectAllChecked,
  headSelectAllIndeterminate,
  onHeadSelectAllChange,
}: CoursesTableProps) {
  return (
    <div className="table-wrapper">
      <table id="coursesTable">
        <thead>
          <tr>
            <th className="checkbox-cell">
              <input
                type="checkbox"
                id="headSelectAll"
                checked={headSelectAllChecked}
                ref={(el) => {
                  if (el) el.indeterminate = headSelectAllIndeterminate;
                }}
                onChange={(e) => onHeadSelectAllChange(e.target.checked)}
              />
            </th>
            <th>Mã MH</th>
            <th>Tên môn học</th>
            <th>Nhóm</th>
            <th>Tổ</th>
            <th>Số TC</th>
            <th>Lớp</th>
            <th>Số lượng</th>
            <th>Còn lại</th>
            <th>Thời khóa biểu</th>
          </tr>
        </thead>
        <tbody id="coursesTableBody">
          {!loaded ? (
            <tr>
              <td colSpan={10} className="small-text">Đang tải dữ liệu học phần...</td>
            </tr>
          ) : visibleRows.length === 0 ? (
            <tr>
              <td colSpan={10} className="small-text">Không tìm thấy học phần phù hợp.</td>
            </tr>
          ) : (
            visibleRows.map((row) => (
              <tr key={row.id_to_hoc}>
                <td className="checkbox-cell">
                  <input
                    type="checkbox"
                    data-id={row.id_to_hoc}
                    checked={selectedIds.has(row.id_to_hoc)}
                    onChange={(e) => onToggleRow(row.id_to_hoc, e.target.checked)}
                  />
                </td>
                <td>{row.ma_mon}</td>
                <td>{row.ten_mon || row.ten_mon_eg || row.ten || ''}</td>
                <td>{row.nhom_to}</td>
                <td>{row.to ?? ''}</td>
                <td>{row.so_tc}</td>
                <td>{row.lop}</td>
                <td>{row.sl_cp}</td>
                <td>{row.sl_cl}</td>
                {/* eslint-disable-next-line react/no-danger */}
                <td dangerouslySetInnerHTML={{ __html: formatTkb(row.tkb) }} />
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
