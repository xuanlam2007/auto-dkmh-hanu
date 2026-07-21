import type { RegisterLogPayload } from '../types';
import LogPanel from './LogPanel';

interface ConfigTabProps {
  active: boolean;
  accessToken: string;
  cookie: string;
  coursesPreview: string;
  svNganh: string;
  idRsInit: string;
  retryInterval: string;
  maxAttempts: string;
  onAccessTokenChange: (value: string) => void;
  onCookieChange: (value: string) => void;
  onSvNganhChange: (value: string) => void;
  onIdRsInitChange: (value: string) => void;
  onRetryIntervalChange: (value: string) => void;
  onMaxAttemptsChange: (value: string) => void;
  onStart: () => void;
  onPauseResume: () => void;
  onCancel: () => void;
  onClearLogs: () => void;
  starting: boolean;
  paused: boolean;
  pauseCancelEnabled: boolean;
  runStatus: string;
  runStatusIsError: boolean;
  previewSummary: string;
  logs: RegisterLogPayload[];
}

export default function ConfigTab({
  active,
  accessToken,
  cookie,
  coursesPreview,
  svNganh,
  idRsInit,
  retryInterval,
  maxAttempts,
  onAccessTokenChange,
  onCookieChange,
  onSvNganhChange,
  onIdRsInitChange,
  onRetryIntervalChange,
  onMaxAttemptsChange,
  onStart,
  onPauseResume,
  onCancel,
  onClearLogs,
  starting,
  paused,
  pauseCancelEnabled,
  runStatus,
  runStatusIsError,
  previewSummary,
  logs,
}: ConfigTabProps) {
  return (
    <div id="config" className={`tab-panel${active ? ' active' : ''}`}>
      <div className="panel-row">
        <div className="panel-card">
          <div className="field-group">
            <div className="field">
              <label htmlFor="accessToken">ACCESS_TOKEN</label>
              <textarea
                id="accessToken"
                placeholder="Copy giá trị token (không kèm Bearer)"
                value={accessToken}
                onChange={(e) => onAccessTokenChange(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="cookie">COOKIE</label>
              <textarea
                id="cookie"
                placeholder="Copy toàn bộ chuỗi cookie từ DevTools"
                value={cookie}
                onChange={(e) => onCookieChange(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="coursesPreview">Danh sách học phần đã chọn</label>
              <textarea
                id="coursesPreview"
                readOnly
                placeholder="Các học phần sẽ được cập nhật sau khi chọn ở tab Tìm môn học"
                value={coursesPreview}
              />
            </div>
          </div>
        </div>

        <div className="panel-card">
          <div className="field-group">
            <div className="field">
              <label htmlFor="svNganh">SV_NGANH</label>
              <input id="svNganh" type="text" value={svNganh} onChange={(e) => onSvNganhChange(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="idRsInit">ID_RS_INIT</label>
              <input
                id="idRsInit"
                type="text"
                placeholder="id_rs ban đầu (có thể để trống)"
                value={idRsInit}
                onChange={(e) => onIdRsInitChange(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="retryInterval">RETRY_INTERVAL_MS</label>
              <input
                id="retryInterval"
                type="number"
                value={retryInterval}
                onChange={(e) => onRetryIntervalChange(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="maxAttempts">MAX_ATTEMPTS</label>
              <input
                id="maxAttempts"
                type="number"
                value={maxAttempts}
                onChange={(e) => onMaxAttemptsChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="button-row">
        <button className="primary" id="startButton" onClick={onStart} disabled={starting}>
          {starting ? 'Đang chạy...' : 'Bắt đầu đăng ký'}
        </button>
        <button className="secondary" id="pauseButton" onClick={onPauseResume} disabled={!pauseCancelEnabled}>
          {paused ? 'Tiếp tục' : 'Tạm dừng'}
        </button>
        <button className="danger" id="cancelButton" onClick={onCancel} disabled={!pauseCancelEnabled}>Huỷ</button>
        <button className="secondary" id="clearLogsButton" onClick={onClearLogs}>Xóa log</button>
      </div>

      <div className="status-bar">
        <div className="status" id="runStatus" style={{ color: runStatusIsError ? '#d92d20' : '#102a43' }}>
          {runStatus}
        </div>
        <div className="summary" id="previewSummary">{previewSummary}</div>
      </div>

      <LogPanel logs={logs} />
    </div>
  );
}
