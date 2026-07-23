import { app, BrowserWindow, ipcMain, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { registerCourses, type RegisterCallbacks, type RegisterController, type RegisterOptions } from './register';
import type { CourseData } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COURSES_LIST_URL = 'https://qldt.hanu.edu.vn/public/api/dkmh/w-locdsnhomto';

let mainWindow: BrowserWindow | null;
let courseData: CourseData | null = null;
let currentController: RegisterController | null = null;

// Dữ liệu mẫu (data-example) chỉ dùng để hiển thị tạm khi CHƯA đăng nhập,
// hoặc khi việc fetch trực tiếp từ API bị lỗi. Sau khi đăng nhập thành công,
// dữ liệu thật sẽ được lấy trực tiếp từ API và ghi đè lên đây.
async function loadExampleCourseData(): Promise<CourseData> {
  const coursePath = path.join(__dirname, 'data-example', 'w-dslocnhomto.json');
  const content = await fs.promises.readFile(coursePath, 'utf8');
  const json = JSON.parse(content);
  return json.data || {};
}

// Gọi thẳng API để lấy danh sách môn/tổ học mới nhất
async function fetchCourseDataFromApi({ ACCESS_TOKEN, COOKIE }: { ACCESS_TOKEN?: string; COOKIE?: string } = {}): Promise<CourseData> {
  const res = await fetch(COURSES_LIST_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      ...(ACCESS_TOKEN ? { Authorization: `Bearer ${ACCESS_TOKEN}` } : {}),
      ...(COOKIE ? { cookie: COOKIE } : {}),
      origin: 'https://qldt.hanu.edu.vn',
      referer: 'https://qldt.hanu.edu.vn/public/',
    },
    body: JSON.stringify({
      is_CVHT: false,
      additional: {
        paging: { limit: 99999, page: 1 },
        ordering: [{ name: '', order_type: '' }],
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Server trả về lỗi HTTP ${res.status} khi tải danh sách môn học.`);
  }

  const json = await res.json();
  if (!json || !json.data) {
    throw new Error('Response không đúng định dạng mong đợi (thiếu "data").');
  }

  return json.data;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 780,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'), // was 'preload.js'
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Vite + electron: dev thì load dev server (HMR), prod thì load file build sẵn trong dist/
  // thay cho mainWindow.loadFile(path.join(__dirname, 'renderer.html')) ở bản cũ
  const devServerUrl = process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(async () => {
  try {
    // Chỉ dùng dữ liệu mẫu để hiển thị trước khi đăng nhập.
    courseData = await loadExampleCourseData();
  } catch (error) {
    console.error('Không thể tải dữ liệu mẫu (data-example) để hiển thị ban đầu:', error);
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
  return loadExampleCourseData();
});

// Handler: làm mới danh sách môn học trực tiếp từ API thật.
// Renderer gọi sau khi đăng nhập thành công (gọi lại
// bất cứ lúc nào để cập nhật slot).
ipcMain.handle('courses:refresh', async (_event: IpcMainInvokeEvent, credentials) => {
  try {
    const fresh = await fetchCourseDataFromApi(credentials || {});
    courseData = fresh;
    return { success: true, data: fresh, fromLiveApi: true };
  } catch (error) {
    console.error('Lỗi khi fetch danh sách môn học từ API:', error);
    return {
      success: false,
      error: (error as Error).message || 'Lỗi không xác định khi tải danh sách môn học.',
      data: courseData,
      fromLiveApi: false,
    };
  }
});

function extractCurrUser(codeLocation: string | null): string | null {
  if (!codeLocation) {
    return null;
  } try {
    const redirectUrl = new URL(codeLocation);
    const hash = redirectUrl.hash.replace(/^#\/?/, '');
    const fragmentParams = new URLSearchParams(hash);
    return fragmentParams.get('CurrUser');
  } 
  catch {

    return null;

  }
}

function extractCurrUserFromText(text: string | null): string | null {
  if (!text) {
    return null;
  }

  const regex = /CurrUser=([^"'&\s<]+)/;
  const match = text.match(regex);
  return match ? match[1] : null;
}

function parseCurrUserPayload(currUserRaw: string): Record<string, unknown> {
  const normalized = currUserRaw.trim();
  const decodedCurrUser = normalized.includes('%')
    ? decodeURIComponent(normalized)
    : normalized;
  const decodedJsonText = Buffer.from(decodedCurrUser, 'base64url').toString('utf8');

  try {
    const parsed = JSON.parse(decodedJsonText);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Payload CurrUser không phải là object hợp lệ.');
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    throw new Error(
      'Đăng nhập thất bại. Tài khoản hoặc mật khẩu không đúng.',
      { cause: error },
    );
  }
}

ipcMain.handle('auth:login', async (_event: IpcMainInvokeEvent, credentials) => {
  const { username, password } = credentials || {};

  if (!username || !password) {
    throw new Error('Chưa nhập tài khoản hoặc mật khẩu.');
  }
  const loginPayload = JSON.stringify({ username, password, uri: 'https://qldt.hanu.edu.vn/#/' });
  const code = Buffer.from(loginPayload, 'utf8').toString('base64');
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

  const parsed = parseCurrUserPayload(currUserBase64);
  const accessToken = typeof parsed.access_token === 'string'
    ? parsed.access_token
    : (typeof parsed.accessToken === 'string' ? parsed.accessToken : '');
  // Thử tìm các key chứa id_rs từ payload CurrUser
  const idRsInit = typeof parsed.id_rs === 'string'
    ? parsed.id_rs
    : (typeof parsed.idRs === 'string'
      ? parsed.idRs
      : (typeof parsed.id_rs_init === 'string'
        ? parsed.id_rs_init
        : (typeof parsed.rs === 'string'
          ? parsed.rs
          : (typeof parsed.rs_id === 'string'
            ? parsed.rs_id
            : (typeof parsed.idRsInit === 'string' ? parsed.idRsInit : null)))));
  const cookieValues: string[] = [];
  response.headers.forEach((value, name) => {
    if (name.toLowerCase() === 'set-cookie') {
      cookieValues.push(value);
    }
  });
  const cookie = cookieValues.length
    ? cookieValues.map((value) => value.split(';')[0]).join('; ')
    : '';



  // Tự động lấy danh sách môn học mới nhất ngay sau khi đăng nhập thành công
  let freshCourseData: CourseData | null = null;
  let courseFetchError: string | null = null;
  try {
    freshCourseData = await fetchCourseDataFromApi({ ACCESS_TOKEN: accessToken, COOKIE: cookie });
    courseData = freshCourseData;
  } catch (err) {
    courseFetchError = (err as Error).message;
    console.error('Không thể tự động tải danh sách môn học sau khi đăng nhập:', err);
  }

  return {
    success: true,
    accessToken,
    cookie,
    idRsInit,
    courseData: freshCourseData,
    courseFetchError,
    message: cookie
      ? 'Đăng nhập thành công. Access token và cookie được tự động điền nếu có.'
      : 'Đăng nhập thành công. Access token được điền tự động. Nếu cần, hãy copy COOKIE thủ công từ trình duyệt.',
  };
});

ipcMain.handle('register:start', async (event: IpcMainInvokeEvent, options: RegisterOptions) => {
  const sender = event.sender;
  const sendLog = (message: string, type: 'info' | 'error' = 'info') => {
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

    // Create controller cho pause / resume / cancel
    const controller: RegisterController = { cancelled: false, paused: false, resume: null };
    currentController = controller;

    const callbacks: RegisterCallbacks = {
      onLog: (message) => sendLog(message, 'info'),
      onError: (message) => sendLog(message, 'error'),
      onDone: (result) => sender.send('register:done', result),
    };

    const result = await registerCourses(options, callbacks, controller);

    return result;
  } catch (error) {
    sendLog(`Lỗi không mong đợi: ${(error as Error).message}`, 'error');
    throw error;
  } finally {
    currentController = null;
  }
});

// Pause / resume / stop handler
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
    try { currentController.resume(); } catch (e) { /* bỏ qua */ }
    currentController.resume = null;
  }
  if (mainWindow) mainWindow.webContents.send('register:log', { message: '▶️ Tiến trình đăng ký tiếp tục.' });
  return { ok: true };
});

ipcMain.handle('register:stop', async () => {
  if (!currentController) return { ok: false, error: 'No active registration' };
  currentController.cancelled = true;
  if (currentController.resume) {
    try { currentController.resume(); } catch (e) { /* bỏ qua */ }
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
