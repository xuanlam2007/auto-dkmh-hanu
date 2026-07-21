import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CourseData, CourseRow, RegisterLogPayload, RegisterOptions } from './types';
import { buildCourseRows, filterRow, type CourseFilters } from './utils/courseData';
import LoginTab from './components/LoginTab';

type TabName = 'search' | 'login' | 'config';

const DEFAULT_FILTERS: CourseFilters = { code: '', he: '61', name: '', group: '', class: '' };

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('search');

  const lastCredentials = useRef<{ ACCESS_TOKEN?: string; COOKIE?: string }>({});

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginStatus, setLoginStatus] = useState('Nhập thông tin tài khoản và nhấn Đăng nhập.');
  const [loginStatusIsError, setLoginStatusIsError] = useState(false);
  const [loginHint, setLoginHint] = useState('Sau khi đăng nhập thành công, access token sẽ được điền tự động vào tab Thông tin đăng ký.');

  const [logs, setLogs] = useState<RegisterLogPayload[]>([]);

  const appendLog = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    setLogs((prev) => [...prev, { message, type }]);
  }, []);

  const updateLoginStatus = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    setLoginStatus(message);
    setLoginStatusIsError(type === 'error');
  }, []);



  const handleLogin = useCallback(async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      updateLoginStatus('Vui lòng điền tài khoản và mật khẩu.', 'error');
      return;
    }

    setLoggingIn(true);
    updateLoginStatus('Đang đăng nhập...', 'info');
    setLoginHint('Đang cố gắng đăng nhập và lấy token/cookie.');

    try {
      const result = await window.electronAPI!.performLogin({ username: trimmedUsername, password });

      if (result.success) {
        updateLoginStatus('Đăng nhập thành công.', 'info');
        setLoginHint(result.message || '');
        if (result.accessToken) setAccessToken(result.accessToken);
        if (result.cookie) setCookie(result.cookie);
        // Nếu main process trả về idRsInit từ payload CurrUser thì tự động điền
        if (result.idRsInit) {
          setIdRsInit(result.idRsInit);
          setLoginHint('ID_RS_INIT đã được tự động điền từ thông tin đăng nhập.');
        }

        lastCredentials.current = { ACCESS_TOKEN: result.accessToken, COOKIE: result.cookie };
        if (result.courseData) {
          appendLog('✅ Đã tự động tải danh sách môn học mới nhất sau khi đăng nhập.');
        } else if (result.courseFetchError) {
          appendLog(`⚠️ Đăng nhập thành công nhưng không tự tải được danh sách môn học: ${result.courseFetchError}. Thử bấm "Làm mới danh sách".`, 'error');
        }

        setActiveTab('config');
      } else {
        updateLoginStatus(result.message || 'Đăng nhập thất bại.', 'error');
        setLoginHint('Vui lòng kiểm tra lại tài khoản/mật khẩu và thử lại.');
      }
    } catch (error) {
      updateLoginStatus((error as Error)?.message || 'Lỗi khi đăng nhập.', 'error');
      setLoginHint('Không thể đăng nhập tự động. Nếu cần, copy COOKIE từ trình duyệt và dán thủ công.');
    } finally {
      setLoggingIn(false);
    }
  }, [username, password, appendLog, updateLoginStatus]);

  return (
    <div className="app">
      <header>
        <h1>Auto DKMH GUI</h1>
        <p className="subtitle">Tìm học phần, chọn các nhóm muốn tự động đăng ký và cấu hình thông tin đăng nhập.</p>
      </header>

      <div className="tabs">
        <button className={`tab-button${activeTab === 'search' ? ' active' : ''}`} onClick={() => setActiveTab('search')}>Tìm môn học</button>
        <button className={`tab-button${activeTab === 'login' ? ' active' : ''}`} onClick={() => setActiveTab('login')}>Đăng nhập</button>
        <button className={`tab-button${activeTab === 'config' ? ' active' : ''}`} onClick={() => setActiveTab('config')}>Thông tin đăng ký</button>
      </div>

      <LoginTab
        active={activeTab === 'login'}
        username={username}
        password={password}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onLogin={handleLogin}
        loggingIn={loggingIn}
        loginStatus={loginStatus}
        loginStatusIsError={loginStatusIsError}
        loginHint={loginHint}
      />
    </div>
  );
}