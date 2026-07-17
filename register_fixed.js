import 'dotenv/config';
import { fileURLToPath } from 'url';

const API_URL = 'https://qldt.hanu.edu.vn/dkmh/api/dkmh/w-xulydkmhsinhvien';

function parseCourses(coursesString) {
  const courses = new Map(
    coursesString.split(',')
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const idx = pair.lastIndexOf(':');
        const name = pair.slice(0, idx);
        const idToHoc = pair.slice(idx + 1);
        return [idToHoc, name];
      })
  );

  if (courses.size === 0) {
    throw new Error('Danh sách COURSES trống hoặc sai định dạng.');
  }

  return courses;
}

function validateOptions(options) {
  const { ACCESS_TOKEN, COOKIE, COURSES } = options || {};
  if (!ACCESS_TOKEN || !COOKIE || !COURSES) {
    throw new Error('Thiếu biến môi trường. Kiểm tra lại file .env hoặc nhập đủ thông tin trong GUI. (ID_RS_INIT không bắt buộc — sẽ được lấy tự động khi server trả về id_rs).');
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function tryRegister(config, idToHoc, idRs) {
  const { ACCESS_TOKEN, COOKIE, SV_NGANH } = config;
  const body = {
    filter: {
      id_to_hoc: idToHoc,
      is_checked: true,
      sv_nganh: Number(SV_NGANH),
      id_rs: idRs,
    },
  };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      'Authorization': ACCESS_TOKEN ? `Bearer ${ACCESS_TOKEN}` : '',
      cookie: COOKIE,
      origin: 'https://qldt.hanu.edu.vn',
      referer: 'https://qldt.hanu.edu.vn/dkmh/',
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401 || res.status === 403) {
    throw new Error('AUTH_EXPIRED');
  }

  return res.json();
}

export async function registerCourses(options, callbacks = {}, controller = { cancelled: false }) {
  validateOptions(options);

  const {
    ACCESS_TOKEN,
    COOKIE,
    COURSES,
    SV_NGANH = '1',
    ID_RS_INIT,
    RETRY_INTERVAL_MS = '1500',
    MAX_ATTEMPTS = '500',
  } = options;

  const onLog = callbacks.onLog || (() => {});
  const onError = callbacks.onError || (() => {});
  const onDone = callbacks.onDone || (() => {});

  const pendingCourses = parseCourses(COURSES);
  let idRs = ID_RS_INIT;
  const maxAttempts = Number(MAX_ATTEMPTS);
  const interval = Number(RETRY_INTERVAL_MS);

  onLog(`Bắt đầu thử đăng ký ${pendingCourses.size} môn: ${[...pendingCourses.values()].join(', ')}`);

  let attempt = 0;
  while (pendingCourses.size > 0 && attempt < maxAttempts) {
    if (controller && controller.cancelled) {
      onLog('⚠️ Tiến trình đăng ký đã bị dừng bởi người dùng.');
      const result = { success: false, cancelled: true, remaining: [...pendingCourses.values()] };
      onDone(result);
      return result;
    }

    for (const [idToHoc, name] of [...pendingCourses.entries()]) {
      if (controller && controller.cancelled) {
        onLog('⚠️ Tiến trình đăng ký đã bị dừng bởi người dùng.');
        const result = { success: false, cancelled: true, remaining: [...pendingCourses.values()] };
        onDone(result);
        return result;
      }

      attempt += 1;
      if (attempt > maxAttempts) break;

      try {
        const json = await tryRegister({ ACCESS_TOKEN, COOKIE, SV_NGANH }, idToHoc, idRs);
        const data = json?.data;

        if (!data) {
          onLog(`[${attempt}] (${name}) Response bất thường: ${JSON.stringify(json)}`);
          await sleep(interval);
          continue;
        }

        if (data.id_rs) {
          idRs = data.id_rs;
        }

        if (data.is_thanh_cong) {
          onLog(`✅ [${attempt}] (${name}) Đăng ký THÀNH CÔNG!`);
          onLog(JSON.stringify(data.ket_qua_dang_ky?.to_hoc, null, 2));
          pendingCourses.delete(idToHoc);
          continue;
        }

        const loiText = data.thong_bao_loi || '(không có mô tả lỗi)';
        onLog(`[${attempt}] (${name}) Chưa thành công: ${loiText}`);
      } catch (err) {
        if (err.message === 'AUTH_EXPIRED') {
          onError('❌ Token/cookie đã hết hạn. Mở tab Đăng nhập để đăng nhập lại và cập nhật ACCESS_TOKEN + COOKIE mới rồi thử lại.');
          const result = { success: false, remaining: pendingCourses.size };
          onDone(result);
          return result;
        }
        onLog(`[${attempt}] (${name}) Lỗi request: ${err.message}`);
      }

      await sleep(interval);
    }
  }

  const result = {
    success: pendingCourses.size === 0,
    remaining: [...pendingCourses.values()],
  };

  if (result.success) {
    onLog('🎉 Đã đăng ký xong tất cả các môn trong danh sách.');
  } else {
    onLog(`Đã hết số lần thử tối đa. Còn ${result.remaining.length} môn chưa đăng ký được: ${result.remaining.join(', ')}`);
  }

  onDone(result);
  return result;
}

export async function main() {
  const {
    ACCESS_TOKEN,
    COOKIE,
    COURSES,
    SV_NGANH = '1',
    ID_RS_INIT,
    RETRY_INTERVAL_MS = '1500',
    MAX_ATTEMPTS = '500',
  } = process.env;

  return registerCourses({
    ACCESS_TOKEN,
    COOKIE,
    COURSES,
    SV_NGANH,
    ID_RS_INIT,
    RETRY_INTERVAL_MS,
    MAX_ATTEMPTS,
  }, {
    onLog: console.log,
    onError: console.error,
  });
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  main();
}