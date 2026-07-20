import type { CourseData, CourseRow } from '../types';

// Giá trị dùng để lọc các môn KHÔNG có tiền tố CTĐT dạng 2 số:
// - LATROBE: xác định qua field ds_khoa của môn có chứa "LATROBE"
// - OTHER: các mã còn lại không có tiền tố số và không xác định được là La Trobe (vd: LIB, ITEC,...)
export const LATROBE_CTDT_PREFIX_VALUE = 'LATROBE';
export const OTHER_CTDT_PREFIX_VALUE = 'OTHER';
export const normalize = (value: unknown): string => String(value || '').trim().toLowerCase();
export function normalizeSearchText(value: unknown): string {
  return normalize(value)

    .normalize('NFD')

    .replace(/\p{Diacritic}/gu, '');

}

export interface CourseFilters {
  code: string;
  he: string;
  name: string;
  group: string;
  class: string;
}

export function textMatches(value: unknown, needle: string): boolean {
  return normalizeSearchText(String(value || '')).includes(normalizeSearchText(needle));
}

export function filterRow(row: CourseRow, filters: CourseFilters): boolean {
  if (filters.code && !textMatches(row.ma_mon, filters.code)) {
    return false;
  }
  if (filters.he && row.ctdt_prefix_value !== filters.he) {
    return false;
  }
  if (filters.name && !textMatches(row.ten_mon, filters.name)) {
    return false;
  }
  if (filters.group && !textMatches(row.nhom_to, filters.group)) {
    return false;
  }
  if (filters.class && !textMatches(row.lop, filters.class)) {
    return false;
  }
  return true;
}

export function formatTkb(tkb: unknown): string {
  return String(tkb || '')
    .replace(/<hr>/gi, '<br />')
    .replace(/\s*<br\s*\/?>\s*/gi, '<br />');
}

// Mệt quá TT
// Sau khi vọc vạch và lần mò trên mạng thì ta rút ra được là:
// Mã môn HANU có dạng "<2 số hệ><mã gốc>", VD: 61FIT2CAL / 62FIT2CAL / 66FIT2CAL
// mặc dù đều là "Toán cao cấp" nhưng khác hệ đào tạo. Bảng ds_mon_hoc dường như
// chỉ chứa tên cho các mã thuộc hệ của **sinh viên đang đăng nhập**, nên các môn
// học thuộc hệ khác bị thiếu tên tiếng Việt => rơi về tên tiếng Anh. 
// 
// Tạo thêm 1 bảng tra theo "mã gốc" (bỏ 2 ký tự hệ đầu)

/*
  Sau tìm hiểu thêm, mình rút ra được 1 số thông tin về các tiền tố CTĐT (2 số đầu mã môn) tại HANU,
  dựa trên các nguồn đã kiểm chứng:
  2 số đầu mã môn tại HANU thể hiện Tiền tố CTĐT (chương trình đào tạo): 61 | 62 | 63 | 64 | 65 | 66
**/

/*********************************************************************/
/* Ý NGHĨA TỪNG SỐ (GHI CHÚ ĐỘ TIN CẬY DỰA TRÊN NGUỒN ĐÃ KIỂM CHỨNG) */
/*                  RESEARCH bởi xlam - 19/7/2026                    */
/*********************************************************************/
// - 61: Tiêu chuẩn
//      Nguồn: https://hanu.vn/a/153681 (ngành Quốc tế học)
//      + Văn bản CTĐT ghi cụ thể mục "6. Hình thức đào tạo: Chính quy".
// - 62: CLC
//      Nguồn: https://lms.fit.hanu.vn/mod/forum/discuss.php?d=3850 (thông báo Khoa CNTT)
//      + Ghi cụ thể "62FIT3ISD (CLC 03)" + file DS dự thi 62FIT2DSA/66FIT2DSA HK2 2025-2026,
//        các lớp thi 62FIT2DSA đều có mã dạng "XC-YYC" (vd 1C-22C, 2C-23C) - khớp mẫu ký hiệu CLC.
// - 63: Văn bằng 2
//      Nguồn: https://hanu.vn/a/245424 (CTĐT hệ Bằng đại học thứ hai)
//      + Xác nhận HANU chỉ tuyển văn bằng 2 cho 2 ngành Anh, Trung Quốc (khớp ds_khoa: "Trung").
// - 64: Vừa làm vừa học
//      Nguồn: https://hanu.vn/c/9033 (Ngôn ngữ Hàn Quốc)
//      + Ảnh CTĐT thật (mã học phần 64...) hệ Vừa làm vừa học ngành Hàn Quốc, khớp ds_khoa,
//        dùng hậu tố ".TC" (HAN.TC, NHAT.TC, TRUNG.TC = "Tại chức", tên cũ của VLVH).
//      + "Tại chức" được giải thích tại Câu 1: Hệ đào tạo Vừa làm vừa học (VLVH) là gì?
//         Nguồn: https://www.hanu.vn/a/82347/HOI-DAP-ve-he-dao-tao-Vua-lam-vua-hoc?c=7900
// - 65: Đào tạo từ xa
//      Nguồn: https://hanu.vn/a/243773 (CTĐT hệ Đào tạo từ xa)
//      + Khớp ds_khoa: "DTTX" (Trung tâm Đào tạo từ xa).
// - 66: Tiên tiến
//      Nguồn: https://lms.fit.hanu.vn/mod/forum/discuss.php?d=3850
//      + File danh sách dự thi 62FIT2DSA/66FIT2DSA HK2 2025-2026: các lớp thi
//        66FIT2DSA đều có mã dạng "XC-YYTT" (vd 1C-24TT, 2C-24TT, 3C-24TT) nên
//        khớp mẫu ký hiệu Tiên tiến.
// - Không có mã: La Trobe hoặc các chương trình khác (LIB, ITEC,...)

/**********************************/
/* MÃ KHÔNG BẮT ĐẦU BẰNG 2 CHỮ SỐ */
/**********************************/
// - Nếu ds_khoa của môn có chứa "LATROBE" thì xác định là La Trobe.
// - Còn lại (chưa chắc chắn, vd: LIB, ITEC,...) gom vào nhóm "LIB, ITEC,..."

export function getCtdtPrefixValue(item: { ma_mon?: string; ds_khoa?: string[] }): string {

  const prefix = String(item.ma_mon || '').slice(0, 2);
  if 
    (/^\d{2}$/.test(prefix))
  {
    return prefix;
  }
  const dsKhoa = Array.isArray(item.ds_khoa) ? item.ds_khoa : [];

  if (dsKhoa.includes('LATROBE')) {

    return LATROBE_CTDT_PREFIX_VALUE;
  }
  return OTHER_CTDT_PREFIX_VALUE;
}

// Kết quả build lại từ applyCourseData gốc: courseRows đã tính ten_mon + ctdt_prefix_value,
// kèm theo message hiển thị lên tableStatus
export interface BuiltCourseRows {
  courseRows: CourseRow[];
  statusMessage: string;
}

export function buildCourseRows(data: CourseData, sourceLabel?: string): BuiltCourseRows {
  if (!data) {
    throw new Error('Dữ liệu trả về rỗng');
  }

  const nameMap: Record<string, string> = {};
  if (Array.isArray(data.ds_mon_hoc)) {
    data.ds_mon_hoc.forEach((item) => {
      if (item.ma) {
        nameMap[item.ma] = item.ten || item.ten_eg || item.ma;
      }
    });
  }

  const suffixNameMap: Record<string, string> = {};
  Object.entries(nameMap).forEach(([ma, ten]) => {
    const suffix = ma.slice(2);
    if (suffix && !suffixNameMap[suffix]) {
      suffixNameMap[suffix] = ten;
    }
  });

  const courseRows: CourseRow[] = Array.isArray(data.ds_nhom_to)
    ? data.ds_nhom_to.map((item) => {
        return {
          ...item,
          ten_mon: item.ten_mon
            || nameMap[item.ma_mon]
            || suffixNameMap[item.ma_mon.slice(2)]
            || item.ten_mon_eg
            || item.ma_mon
            || '',
          ctdt_prefix_value: getCtdtPrefixValue(item),
        } as CourseRow;
      })
    : [];

  const statusMessage = `Tìm thấy ${courseRows.length} học phần${sourceLabel ? ' (' + sourceLabel + ')' : ''}.`;

  return { courseRows, statusMessage };
}

export function cleanServerNote(str: unknown): string {
  return String(str || '')
    .trim()
    .replace(/^[.\s]+/, '')
    .trim();
}