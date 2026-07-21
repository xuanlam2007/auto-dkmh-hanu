import type { CourseData } from '../types';
import { cleanServerNote } from '../utils/courseData';

interface RegistrationBannerProps {
  data: CourseData | null;
}

export default function RegistrationBanner({ data }: RegistrationBannerProps) {
  if (!data) return null;

  const isOpen = Boolean(data.trong_thoi_gian_dang_ky);
  const ghiChu = cleanServerNote(data.ghi_chu_dkmh);

  return (
    <div
      id="registrationBanner"
      style={{
        display: 'block',
        borderRadius: 10,
        padding: '12px 16px',
        marginBottom: 16,
        fontSize: 14,
        background: isOpen ? '#e6f4ea' : '#fdecea',
        color: isOpen ? '#1e4620' : '#7a1f1a',
      }}
    >
      <strong>{isOpen ? '🟢 Đang trong thời gian cho phép đăng ký' : '🔴 Ngoài thời gian cho phép đăng ký'}</strong>
      <br />
      {ghiChu ? <div className="small-text" style={{ marginTop: 4 }}>{ghiChu}</div> : null}
    </div>
  );
}
