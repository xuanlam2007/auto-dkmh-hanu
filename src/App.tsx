import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CourseData, CourseRow, RegisterLogPayload, RegisterOptions } from './types';
import { buildCourseRows, filterRow, type CourseFilters } from './utils/courseData';
import SearchTab from './components/SearchTab';
import LoginTab from './components/LoginTab';
import ConfigTab from './components/ConfigTab';
import RegistrationBanner from './components/RegistrationBanner';

type TabName = 'search' | 'login' | 'config';

const DEFAULT_FILTERS: CourseFilters = { code: '', he: '61', name: '', group: '', class: '' };

export default function App() {
  const [activeTab, setActiveTab] = useState<TabName>('search');
  const [courseRows, setCourseRows] = useState<CourseRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [tableStatus, setTableStatus] = useState('Đang tải dữ liệu học phần...');
  const [bannerData, setBannerData] = useState<CourseData | null>(null);
  const [filters, setFilters] = useState<CourseFilters>(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const lastCredentials = useRef<{ ACCESS_TOKEN?: string; COOKIE?: string }>({});

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginStatus, setLoginStatus] = useState('Nhập thông tin tài khoản và nhấn Đăng nhập.');
  const [loginStatusIsError, setLoginStatusIsError] = useState(false);
  const [loginHint, setLoginHint] = useState('Sau khi đăng nhập thành công, access token sẽ được điền tự động vào tab Thông tin đăng ký.');

  const [accessToken, setAccessToken] = useState('');
  const [cookie, setCookie] = useState('');
  const [svNganh, setSvNganh] = useState('1');
  const [idRsInit, setIdRsInit] = useState('');
  const [retryInterval, setRetryInterval] = useState('1500');
  const [maxAttempts, setMaxAttempts] = useState('500');
  const [logs, setLogs] = useState<RegisterLogPayload[]>([]);
  const [runStatus, setRunStatus] = useState('Chưa chạy.');
  const [runStatusIsError, setRunStatusIsError] = useState(false);
  const [starting, setStarting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pauseCancelEnabled, setPauseCancelEnabled] = useState(false);

  const appendLog = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    setLogs((prev) => [...prev, { message, type }]);
  }, []);

  const updateStatus = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    setRunStatus(message);
    setRunStatusIsError(type === 'error');
  }, []);

  const updateLoginStatus = useCallback((message: string, type: 'info' | 'error' = 'info') => {
    setLoginStatus(message);
    setLoginStatusIsError(type === 'error');
  }, []);

  const applyCourseData = useCallback(
    (data: CourseData, sourceLabel?: string, { showBanner = true }: { showBanner?: boolean } = {}) => {
      if (!data) {
        throw new Error('Dữ liệu trả về rỗng');
      }
      const { courseRows: rows, statusMessage } = buildCourseRows(data, sourceLabel);
      setCourseRows(rows);
      setLoaded(true);
      setTableStatus(statusMessage);
      setBannerData(showBanner ? data : null);
    },
    [],
  );

  // Tải dữ liệu mẫu ban đầu (data-example), tương đương loadInitialCourses() trong renderer.js cũ
  useEffect(() => {
    (async () => {
      try {
        if (!window.electronAPI || !window.electronAPI.loadCourseData) {
          throw new Error('Preload bridge chưa sẵn sàng.');
        }
        const data = await window.electronAPI.loadCourseData();
        applyCourseData(data, 'dữ liệu mẫu | Hãy đăng nhập để lấy dữ liệu thật mới nhất', { showBanner: false });
      } catch (error) {
        setLoaded(false);
        setTableStatus('Không thể tải dữ liệu học phần.');
        appendLog(`Lỗi load dữ liệu mẫu: ${(error as Error).message}`, 'error');
        console.error(error);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })();
  }, []);

  const refreshCoursesFromApi = useCallback(
    async (credentials: { ACCESS_TOKEN?: string; COOKIE?: string }, { silent = false }: { silent?: boolean } = {}) => {
      if (!window.electronAPI || !window.electronAPI.refreshCourseData) {
        appendLog('Preload bridge chưa hỗ trợ refreshCourseData.', 'error');
        return;
      }

      if (!silent) {
        setTableStatus('Đang tải danh sách môn học mới nhất từ hệ thống...');
      }

      try {
        const result = await window.electronAPI.refreshCourseData(credentials);
        if (result.success && result.data) {
          applyCourseData(result.data, 'dữ liệu trực tiếp từ hệ thống');
          appendLog('✅ Đã tải danh sách môn học mới nhất từ hệ thống.');
        } else {
          appendLog(`⚠️ Không tải được danh sách môn học mới: ${result.error || 'lỗi không xác định'}. Vẫn giữ dữ liệu hiện có.`, 'error');
          if (result.data) {
            applyCourseData(result.data, 'dữ liệu cũ | Refresh thất bại');
          }
        }
      } catch (error) {
        appendLog(`Lỗi khi refresh danh sách môn học: ${(error as Error).message}`, 'error');
      }
    },
    [applyCourseData, appendLog],
  );

  // Filter
  // Sắp xếp theo Tên môn học (có dấu, theo bảng chữ cái tiếng Việt), sau đó Mã MH
  // và Nhóm tổ để các dòng cùng môn (khác nhóm/tổ/hệ) đứng cạnh nhau thay vì
  // rải rác theo thứ tự gốc của mảng dữ liệu trả về từ API.
  const collator = useMemo(() => new Intl.Collator('vi', { sensitivity: 'base', numeric: true }), []);

  const visibleRows = useMemo(() => {
    return courseRows
      .filter((row) => filterRow(row, filters))
      .slice()
      .sort((a, b) => {
        const byName = collator.compare(a.ten_mon || '', b.ten_mon || '');
        if (byName !== 0) return byName;
        const byCode = collator.compare(a.ma_mon || '', b.ma_mon || '');
        if (byCode !== 0) return byCode;
        return collator.compare(String(a.nhom_to || ''), String(b.nhom_to || ''));
      });
  }, [courseRows, filters, collator]);

  const handleFilterChange = useCallback((field: keyof CourseFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const handleToggleRow = useCallback((idToHoc: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(idToHoc);
      else next.delete(idToHoc);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      visibleRows.forEach((row) => next.add(row.id_to_hoc));
      return next;
    });
  }, [visibleRows]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleHeadSelectAllChange = useCallback(
    (checked: boolean) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        visibleRows.forEach((row) => {
          if (checked) next.add(row.id_to_hoc);
          else next.delete(row.id_to_hoc);
        });
        return next;
      });
    },
    [visibleRows],
  );

  const headSelectAllChecked = visibleRows.length > 0 && visibleRows.every((row) => selectedIds.has(row.id_to_hoc));
  const headSelectAllIndeterminate = visibleRows.some((row) => selectedIds.has(row.id_to_hoc)) && !headSelectAllChecked;

  // coursesPreview + selectionSummary: tương đương updateSelectionState() trong renderer.js
  const coursesPreview = useMemo(
    () =>
      Array.from(selectedIds)
        .map((idToHoc) => {
          const row = courseRows.find((item) => item.id_to_hoc === idToHoc);
          if (!row) return '';
          const label = `${row.ma_mon}_${row.nhom_to}`;
          return `${label}:${idToHoc}`;
        })
        .filter(Boolean)
        .join(','),
    [selectedIds, courseRows],
  );
  const selectionSummary = `Đã chọn ${selectedIds.size} học phần.`;

  const handleRefreshClick = useCallback(async () => {
    const creds = lastCredentials.current.ACCESS_TOKEN || lastCredentials.current.COOKIE
      ? lastCredentials.current
      : { ACCESS_TOKEN: accessToken.trim(), COOKIE: cookie.trim() };
    setRefreshing(true);
    await refreshCoursesFromApi(creds);
    setRefreshing(false);
  }, [accessToken, cookie, refreshCoursesFromApi]);

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
          applyCourseData(result.courseData, 'dữ liệu trực tiếp từ hệ thống, ngay sau khi đăng nhập');
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
  }, [username, password, applyCourseData, appendLog, updateLoginStatus]);

  const handleStart = useCallback(async () => {
    const options: RegisterOptions = {
      ACCESS_TOKEN: accessToken.trim(),
      COOKIE: cookie.trim(),
      COURSES: coursesPreview.trim(),
      SV_NGANH: svNganh.trim() || '1',
      ID_RS_INIT: idRsInit.trim(),
      RETRY_INTERVAL_MS: retryInterval.trim() || '1500',
      MAX_ATTEMPTS: maxAttempts.trim() || '500',
    };

    if (!options.COURSES) {
      appendLog('Vui lòng chọn ít nhất một học phần trước khi bắt đầu.', 'error');
      updateStatus('Lỗi: chưa chọn học phần.', 'error');
      return;
    }

    if (!options.ACCESS_TOKEN || !options.COOKIE) {
      appendLog('Vui lòng điền đầy đủ ACCESS_TOKEN và COOKIE trong tab Thông tin đăng ký. ID_RS_INIT có thể để trống (sẽ được lấy tự động khi server trả về).', 'error');
      updateStatus('Lỗi: thiếu thông tin cấu hình.', 'error');
      return;
    }

    setLogs([]);
    setActiveTab('config');
    updateStatus('Đang chạy...', 'info');
    setStarting(true);
    setPaused(false);
    setPauseCancelEnabled(true);

    try {
      await window.electronAPI!.startRegistration(options);
    } catch (error) {
      appendLog((error as Error)?.message || 'Lỗi không xác định khi khởi động đăng ký.', 'error');
      updateStatus('Lỗi khi chạy.', 'error');
      setStarting(false);
      setPauseCancelEnabled(false);
      setPaused(false);
    }
  }, [accessToken, cookie, coursesPreview, svNganh, idRsInit, retryInterval, maxAttempts, appendLog, updateStatus]);

  const handlePauseResume = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      if (paused) {
        await window.electronAPI.resumeRegistration();
        setPaused(false);
        appendLog('▶️ Tiếp tục chạy đăng ký.');
      } else {
        await window.electronAPI.pauseRegistration();
        setPaused(true);
        appendLog('⏸️ Đã tạm dừng đăng ký.');
      }
    } catch (err) {
      appendLog('Lỗi khi gửi yêu cầu tạm dừng/tiếp tục: ' + ((err as Error).message || err), 'error');
    }
  }, [paused, appendLog]);

  const handleCancel = useCallback(async () => {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.cancelRegistration();
      appendLog('🛑 Đã gửi yêu cầu huỷ tiến trình đăng ký.');
      updateStatus('Đã huỷ', 'error');
      setStarting(false);
      setPaused(false);
      setPauseCancelEnabled(false);
    } catch (err) {
      appendLog('Lỗi khi huỷ: ' + ((err as Error).message || err), 'error');
    }
  }, [appendLog, updateStatus]);

  const handleClearLogs = useCallback(() => {
    setLogs([]);
    updateStatus('Logs đã được xóa.', 'info');
  }, [updateStatus]);

  useEffect(() => {
    if (!window.electronAPI) return;

    let offLog: (() => void) | undefined;
    let offDone: (() => void) | undefined;

    if (typeof window.electronAPI.onLog === 'function') {
      offLog = window.electronAPI.onLog(({ message, type }) => {
        appendLog(message, (type as 'info' | 'error') || 'info');
        if (type === 'error' && /token\/?cookie|phiên đăng nhập|đã hết hạn/i.test(message)) {
          updateStatus('Phiên đăng nhập có thể đã hết hạn. Mở tab Đăng nhập để thử lại.', 'error');
          setActiveTab('login');
        }
      });
    }

    if (typeof window.electronAPI.onDone === 'function') {
      offDone = window.electronAPI.onDone((result) => {
        appendLog(result.success ? 'Quá trình đã hoàn tất.' : 'Quá trình dừng lại với một số môn chưa đăng ký được.', result.success ? 'info' : 'error');
        updateStatus(result.success ? 'Hoàn tất' : 'Kết thúc với lỗi', result.success ? 'info' : 'error');
        setStarting(false);
        setPaused(false);
        setPauseCancelEnabled(false);
      });
    }

    return () => {
      offLog?.();
      offDone?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <RegistrationBanner data={bannerData} />

      <SearchTab
        active={activeTab === 'search'}
        filters={filters}
        onFilterChange={handleFilterChange}
        onResetFilters={resetFilters}
        onSelectAll={handleSelectAll}
        onDeselectAll={handleDeselectAll}
        onRefresh={handleRefreshClick}
        refreshing={refreshing}
        tableStatus={tableStatus}
        selectionSummary={selectionSummary}
        loaded={loaded}
        visibleRows={visibleRows}
        selectedIds={selectedIds}
        onToggleRow={handleToggleRow}
        headSelectAllChecked={headSelectAllChecked}
        headSelectAllIndeterminate={headSelectAllIndeterminate}
        onHeadSelectAllChange={handleHeadSelectAllChange}
      />

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

      <ConfigTab
        active={activeTab === 'config'}
        accessToken={accessToken}
        cookie={cookie}
        coursesPreview={coursesPreview}
        svNganh={svNganh}
        idRsInit={idRsInit}
        retryInterval={retryInterval}
        maxAttempts={maxAttempts}
        onAccessTokenChange={setAccessToken}
        onCookieChange={setCookie}
        onSvNganhChange={setSvNganh}
        onIdRsInitChange={setIdRsInit}
        onRetryIntervalChange={setRetryInterval}
        onMaxAttemptsChange={setMaxAttempts}
        onStart={handleStart}
        onPauseResume={handlePauseResume}
        onCancel={handleCancel}
        onClearLogs={handleClearLogs}
        starting={starting}
        paused={paused}
        pauseCancelEnabled={pauseCancelEnabled}
        runStatus={runStatus}
        runStatusIsError={runStatusIsError}
        previewSummary={selectionSummary}
        logs={logs}
      />
    </div>
  );
}