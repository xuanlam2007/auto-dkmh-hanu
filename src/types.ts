// Kiểu dữ liệu dùng chung giữa renderer (React) và electron (main/preload).
// Được tách ra từ cấu trúc dữ liệu gốc trả về bởi API w-locdsnhomto / w-dslocnhomto.json.

export interface RawCourseRow {
  id_to_hoc: string;
  ma_mon: string;
  ten_mon?: string;
  ten_mon_eg?: string;
  ten?: string;
  nhom_to: string;
  to?: number | string;
  so_tc: number | string;
  lop: string;
  sl_cp: number | string;
  sl_cl: number | string;
  tkb: string;
  ds_khoa?: string[];
  [key: string]: unknown;
}

export interface CourseRow extends RawCourseRow {
  ten_mon?: string;
  ctdt_prefix_value: string;
}

export interface MonHocItem {
  ma?: string;
  ten?: string;
  ten_eg?: string;
  [key: string]: unknown;
}

// Toàn bộ payload data trả về từ API danh sách môn học
export interface CourseData {
  ds_nhom_to?: RawCourseRow[];
  ds_mon_hoc?: MonHocItem[];
  trong_thoi_gian_dang_ky?: boolean;
  dien_giai_enable_chung?: string;
  ghi_chu_dkmh?: string;
  [key: string]: unknown;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResult {
  success: boolean;
  accessToken?: string;
  cookie?: string;
  idRsInit?: string | null;
  courseData?: CourseData | null;
  courseFetchError?: string | null;
  message?: string;
}

export interface RefreshCredentials {
  ACCESS_TOKEN?: string;
  COOKIE?: string;
}

export interface RefreshResult {
  success: boolean;
  data?: CourseData | null;
  error?: string;
  fromLiveApi?: boolean;
}

export interface RegisterOptions {
  ACCESS_TOKEN: string;
  COOKIE: string;
  COURSES: string;
  SV_NGANH: string;
  ID_RS_INIT: string;
  RETRY_INTERVAL_MS: string;
  MAX_ATTEMPTS: string;
}

export interface RegisterResult {
  success: boolean;
  cancelled?: boolean;
  remaining: string[] | number;
}

export interface RegisterLogPayload {
  message: string;
  type?: 'info' | 'error';
}

export interface ElectronAPI {
  startRegistration: (options: RegisterOptions) => Promise<RegisterResult>;
  pauseRegistration: () => Promise<{ ok: boolean; error?: string }>;
  resumeRegistration: () => Promise<{ ok: boolean; error?: string }>;
  cancelRegistration: () => Promise<{ ok: boolean; error?: string }>;
  loadCourseData: () => Promise<CourseData>;
  refreshCourseData: (credentials: RefreshCredentials) => Promise<RefreshResult>;
  performLogin: (credentials: LoginCredentials) => Promise<LoginResult>;
  onLog: (callback: (payload: RegisterLogPayload) => void) => void;
  onDone: (callback: (result: RegisterResult) => void) => void;
}