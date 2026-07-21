interface LoginTabProps {
  active: boolean;
  username: string;
  password: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onLogin: () => void;
  loggingIn: boolean;
  loginStatus: string;
  loginStatusIsError: boolean;
  loginHint: string;
}

export default function LoginTab({
  active,
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onLogin,
  loggingIn,
  loginStatus,
  loginStatusIsError,
  loginHint,
}: LoginTabProps) {
  return (
    <div id="login" className={`tab-panel${active ? ' active' : ''}`}>
      <div className="panel-card">
        <div className="field-group">
          <div className="field">
            <label htmlFor="usernameInput">Tài khoản</label>
            <input
              id="usernameInput"
              type="text"
              placeholder="Nhập mã SV hoặc tài khoản"
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="passwordInput">Mật khẩu</label>
            <input
              id="passwordInput"
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
            />
          </div>
        </div>

        <div className="button-row">
          <button className="primary" id="loginButton" onClick={onLogin} disabled={loggingIn}>
            {loggingIn ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </div>

        <div className="status-bar">
          <div className="status" id="loginStatus" style={{ color: loginStatusIsError ? '#d92d20' : '#102a43' }}>
            {loginStatus}
          </div>
          <div className="summary" id="loginHint">{loginHint}</div>
        </div>
      </div>
    </div>
  );
}
