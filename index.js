import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerCourses } from './register_fixed.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let courseData = null;
let currentController = null;

async function preloadCourseData() {
  const coursePath = path.join(__dirname, 'data', 'w-dslocnhomto.json');
  const content = await fs.promises.readFile(coursePath, 'utf8');
  const json = JSON.parse(content);
  courseData = json.data || {};
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 780,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer.html'));
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(async () => {
  try {
    await preloadCourseData();
  } catch (error) {
    console.error('Không thể tải dữ liệu môn học trước khi hiển thị UI:', error);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

ipcMain.handle('courses:load', async () => {
  if (courseData) {
    return courseData;
  }

  const coursePath = path.join(__dirname, 'data', 'w-dslocnhomto.json');
  const content = await fs.promises.readFile(coursePath, 'utf8');
  const json = JSON.parse(content);
  return json.data || {};
});

function extractCurrUser(codeLocation) {
  if (!codeLocation) {
    return null;
  }

  try {
    const redirectUrl = new URL(codeLocation);
    const hash = redirectUrl.hash.replace(/^#\/?/, '');
    const fragmentParams = new URLSearchParams(hash);
    return fragmentParams.get('CurrUser');
  } catch {
    return null;
  }
}

function extractCurrUserFromText(text) {
  if (!text) {
    return null;
  }

  const regex = /CurrUser=([A-Za-z0-9_\-]+)/;
  const match = text.match(regex);
  return match ? match[1] : null;
}

ipcMain.handle('auth:login', async (event, credentials) => {
  const { username, password } = credentials || {};

  if (!username || !password) {
    throw new Error('Chưa nhập tài khoản hoặc mật khẩu.');
  }

  const loginPayload = JSON.stringify({ username, password, uri: 'https://qldt.hanu.edu.vn/#/' });
  const code = Buffer.from(loginPayload, 'utf8').toString('base64url');
  const signinUrl = `https://qldt.hanu.edu.vn/api/pn-signin?code=${encodeURIComponent(code)}&gopage=&mgr=1`;

  const response = await fetch(signinUrl, {
    method: 'GET',
    redirect: 'manual',
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      referer: 'https://qldt.hanu.edu.vn/',
      origin: 'https://qldt.hanu.edu.vn',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
    },
  });

  const locationHeader = response.headers.get('location');
  let currUserBase64 = extractCurrUser(locationHeader);
  if (!currUserBase64) {
    const bodyText = await response.text();
    currUserBase64 = extractCurrUserFromText(bodyText);
  }

  if (!currUserBase64) {
    throw new Error('Không thể xác thực đăng nhập. Kiểm tra lại tài khoản/mật khẩu và thử lại.');
  }

  const decoded = Buffer.from(currUserBase64, 'base64url').toString('utf8');
  const parsed = JSON.parse(decoded);
  const accessToken = parsed.access_token || parsed.accessToken || '';
  // Thử truy xuất các key khả dụng chứa id_rs từ payload CurrUser
  const idRsInit = parsed.id_rs || parsed.idRs || parsed.id_rs_init || parsed.rs || parsed.rs_id || parsed.idRsInit || null;

  const cookieValues = [];
  response.headers.forEach((value, name) => {
    if (name.toLowerCase() === 'set-cookie') {
      cookieValues.push(value);
    }
  });

  const cookie = cookieValues.length
    ? cookieValues.map((value) => value.split(';')[0]).join('; ')
    : '';

  return {
    success: true,
    accessToken,
    cookie,
    idRsInit,
    message: cookie
      ? 'Đăng nhập thành công. Access token và cookie được tự động điền nếu có.'
      : 'Đăng nhập thành công. Access token được điền tự động. Nếu cần, hãy copy COOKIE thủ công từ trình duyệt.',
  };
});

ipcMain.handle('register:start', async (event, options) => {
  const sender = event.sender;
  const sendLog = (message, type = 'info') => {
    sender.send('register:log', { message, type });
  };

  try {
    sendLog('Bắt đầu tiến trình đăng ký…');

    // Ghi log trạng thái (không ghi giá trị token/cookie đầy đủ - for safety purposes iykyk)
    const presence = {
      hasAccessToken: !!options.ACCESS_TOKEN,
      hasCookie: !!options.COOKIE,
      hasCourses: !!options.COURSES,
      hasIdRsInit: !!options.ID_RS_INIT,
    };
    sendLog(`Trạng thái cấu hình: ACCESS_TOKEN=${presence.hasAccessToken ? 'YES' : 'NO'}, COOKIE=${presence.hasCookie ? 'YES' : 'NO'}, COURSES=${presence.hasCourses ? 'YES' : 'NO'}, ID_RS_INIT=${presence.hasIdRsInit ? 'YES' : 'NO'}`);

    // Create controller for pause / resume / cancel
    const controller = { cancelled: false, paused: false, resume: null };
    currentController = controller;

    const result = await registerCourses(options, {
      onLog: (message) => sendLog(message, 'info'),
      onError: (message) => sendLog(message, 'error'),
      onDone: (result) => sender.send('register:done', result),
    }, controller);

    return result;
  } catch (error) {
    sendLog(`Lỗi không mong đợi: ${error.message}`, 'error');
    throw error;
  } finally {
    currentController = null;
  }
});

// Pause / resume / stop handlers
ipcMain.handle('register:pause', async () => {
  if (!currentController) return { ok: false, error: 'No active registration' };
  currentController.paused = true;
  if (mainWindow) mainWindow.webContents.send('register:log', { message: '⏸️ Tiến trình đăng ký đã được tạm dừng bởi người dùng.' });
  return { ok: true };
});

ipcMain.handle('register:resume', async () => {
  if (!currentController) return { ok: false, error: 'No active registration' };
  currentController.paused = false;
  if (currentController.resume) {
    try { currentController.resume(); } catch (e) { /* ignore */ }
    currentController.resume = null;
  }
  if (mainWindow) mainWindow.webContents.send('register:log', { message: '▶️ Tiến trình đăng ký tiếp tục.' });
  return { ok: true };
});

ipcMain.handle('register:stop', async () => {
  if (!currentController) return { ok: false, error: 'No active registration' };
  currentController.cancelled = true;
  if (currentController.resume) {
    try { currentController.resume(); } catch (e) { /* ignore */ }
    currentController.resume = null;
  }
  if (mainWindow) mainWindow.webContents.send('register:log', { message: '🛑 Tiến trình đăng ký đã bị huỷ bởi người dùng.' });
  return { ok: true };
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
