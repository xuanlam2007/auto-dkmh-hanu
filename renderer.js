const tabButtons = Array.from(document.querySelectorAll('.tab-button'));
const tabPanels = Array.from(document.querySelectorAll('.tab-panel'));
const filterCode = document.getElementById('filterCode');
const filterName = document.getElementById('filterName');
const filterGroup = document.getElementById('filterGroup');
const filterClass = document.getElementById('filterClass');
const resetFiltersButton = document.getElementById('resetFiltersButton');
const selectAllButton = document.getElementById('selectAllButton');
const deselectAllButton = document.getElementById('deselectAllButton');
const headSelectAll = document.getElementById('headSelectAll');
const tableStatus = document.getElementById('tableStatus');
const selectionSummary = document.getElementById('selectionSummary');
const coursesTableBody = document.getElementById('coursesTableBody');
const coursesPreview = document.getElementById('coursesPreview');
const previewSummary = document.getElementById('previewSummary');
const statusText = document.getElementById('runStatus');
const accessTokenInput = document.getElementById('accessToken');
const cookieInput = document.getElementById('cookie');
const svNganhInput = document.getElementById('svNganh');
const idRsInitInput = document.getElementById('idRsInit');
const retryIntervalInput = document.getElementById('retryInterval');
const maxAttemptsInput = document.getElementById('maxAttempts');
const startButton = document.getElementById('startButton');
const pauseButton = document.getElementById('pauseButton');
const cancelButton = document.getElementById('cancelButton');
const clearLogsButton = document.getElementById('clearLogsButton');
const logArea = document.getElementById('logArea');
const usernameInput = document.getElementById('usernameInput');
const passwordInput = document.getElementById('passwordInput');
const loginButton = document.getElementById('loginButton');
const loginStatus = document.getElementById('loginStatus');
const loginHint = document.getElementById('loginHint');

let courseRows = [];
const selectedIds = new Set();
let loaded = false;
let lastCredentials = { accessToken: '', cookie: '' };

function setActiveTab(tabName) {
  tabButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tabName);
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle('active', panel.id === tabName);
  });
}

tabButtons.forEach((button) => {
  button.addEventListener('click', () => setActiveTab(button.dataset.tab));
});

const normalize = (value) => String(value || '').trim().toLowerCase();

function normalizeSearchText(value) {
  return normalize(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function getCurrentFilters() {
  return {
    code: normalizeSearchText(filterCode.value),
    name: normalizeSearchText(filterName.value),
    group: normalizeSearchText(filterGroup.value),
    class: normalizeSearchText(filterClass.value),
  };
}

function textMatches(value, needle) {
  return normalizeSearchText(String(value || '')).includes(needle);
}

function filterRow(row, filters) {
  if (filters.code && !textMatches(row.ma_mon, filters.code)) {
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

function formatTkb(tkb) {
  return String(tkb || '')
    .replace(/<hr>/gi, '<br />')
    .replace(/\s*<br\s*\/?>\s*/gi, '<br />');
}

function renderTable() {
  const filters = getCurrentFilters();
  const visibleRows = courseRows.filter((row) => filterRow(row, filters));

  coursesTableBody.innerHTML = '';

  if (!loaded) {
    coursesTableBody.innerHTML = '<tr><td colspan="10" class="small-text">Đang tải dữ liệu học phần...</td></tr>';
    tableStatus.textContent = 'Đang tải dữ liệu học phần...';
    headSelectAll.checked = false;
    headSelectAll.indeterminate = false;
    return;
  }

  if (visibleRows.length === 0) {
    coursesTableBody.innerHTML = '<tr><td colspan="10" class="small-text">Không tìm thấy học phần phù hợp.</td></tr>';
    tableStatus.textContent = 'Không tìm thấy học phần phù hợp.';
    headSelectAll.checked = false;
    headSelectAll.indeterminate = false;
    return;
  }

  visibleRows.forEach((row) => {
    const tr = document.createElement('tr');
    const checked = selectedIds.has(row.id_to_hoc);

    tr.innerHTML = `
      <td class="checkbox-cell"><input type="checkbox" data-id="${row.id_to_hoc}" ${checked ? 'checked' : ''} /></td>
      <td>${row.ma_mon}</td>
      <td>${row.ten_mon || row.ten_mon_eg || row.ten || ''}</td>
      <td>${row.nhom_to}</td>
      <td>${row.to || '*'}</td>
      <td>${row.so_tc}</td>
      <td>${row.lop}</td>
      <td>${row.sl_cp}</td>
      <td>${row.sl_cl}</td>
      <td>${formatTkb(row.tkb)}</td>
    `;

    const checkbox = tr.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) {
        selectedIds.add(row.id_to_hoc);
      } else {
        selectedIds.delete(row.id_to_hoc);
      }
      updateSelectionState();
    });

    coursesTableBody.appendChild(tr);
  });

  headSelectAll.checked = visibleRows.every((row) => selectedIds.has(row.id_to_hoc));
  headSelectAll.indeterminate = visibleRows.some((row) => selectedIds.has(row.id_to_hoc)) && !headSelectAll.checked;
  updateSelectionState();
}

function updateSelectionState() {
  const count = selectedIds.size;
  selectionSummary.textContent = `Đã chọn ${count} học phần.`;
  previewSummary.textContent = `Đã chọn ${count} học phần.`;
  coursesPreview.value = Array.from(selectedIds)
    .map((idToHoc) => {
      const row = courseRows.find((item) => item.id_to_hoc === idToHoc);
      if (!row) return '';
      const label = `${row.ma_mon}_${row.nhom_to}`;
      return `${label}:${idToHoc}`;
    })
    .filter(Boolean)
    .join(',');
}

function updateStatus(message, type = 'info') {
  statusText.textContent = message;
  const isError = type === 'error';
  statusText.style.color = isError ? '#d92d20' : '#102a43';
}

function updateLoginStatus(message, type = 'info') {
  loginStatus.textContent = message;
  loginStatus.style.color = type === 'error' ? '#d92d20' : '#102a43';
}

function appendLoginHint(message) {
  loginHint.textContent = message;
}

function appendLog(message, type = 'info') {
  const node = document.createElement('div');
  node.className = type;
  node.textContent = message;
  logArea.appendChild(node);
  logArea.scrollTop = logArea.scrollHeight;
}

function applyCourseData(data, sourceLabel) {
  if (!data) {
    throw new Error('Dữ liệu trả về rỗng');
  }

  const nameMap = {};
  if (Array.isArray(data.ds_mon_hoc)) {
    data.ds_mon_hoc.forEach((item) => {
      if (item.ma) {
        nameMap[item.ma] = item.ten || item.ten_eg || item.ma;
      }
    });
  }

  courseRows = Array.isArray(data.ds_nhom_to)
    ? data.ds_nhom_to.map((item) => ({
        ...item,
        ten_mon: item.ten_mon || nameMap[item.ma_mon] || item.ten_mon_eg || item.ma_mon || '',
      }))
    : [];

  loaded = true;
  tableStatus.textContent = `Tìm thấy ${courseRows.length} học phần${sourceLabel ? ' (' + sourceLabel + ')' : ''}.`;
  renderRegistrationBanner(data);
  renderTable();
}

function renderRegistrationBanner(data) {
  const banner = document.getElementById('registrationBanner');
  if (!banner) return;

  const isOpen = data.trong_thoi_gian_dang_ky;
  const note = data.dien_giai_enable_chung || '';
  const ghiChu = data.ghi_chu_dkmh || '';

  banner.style.display = 'block';
  banner.style.background = isOpen ? '#e6f4ea' : '#fdecea';
  banner.style.color = isOpen ? '#1e4620' : '#7a1f1a';
  banner.innerHTML = `
    <strong>${isOpen ? '🟢 Đang trong thời gian cho phép đăng ký' : '🔴 Ngoài thời gian cho phép đăng ký'}</strong>
    ${note ? '<br />' + note : ''}
    ${ghiChu ? '<div class="small-text" style="margin-top:4px;">' + ghiChu + '</div>' : ''}
  `;
}

async function loadInitialCourses() {
  try {
    if (!window.electronAPI || !window.electronAPI.loadCourseData) {
      throw new Error('Preload bridge chưa sẵn sàng.');
    }
    const data = await window.electronAPI.loadCourseData();
    applyCourseData(data, 'dữ liệu mẫu — hãy đăng nhập để lấy dữ liệu thật mới nhất');
  } catch (error) {
    loaded = false;
    tableStatus.textContent = 'Không thể tải dữ liệu học phần.';
    coursesTableBody.innerHTML = '<tr><td colspan="10" class="small-text">Lỗi khi tải dữ liệu mẫu. Kiểm tra thư mục data-example hoặc console.</td></tr>';
    appendLog(`Lỗi load dữ liệu mẫu: ${error.message}`, 'error');
    console.error(error);
  }
}

async function refreshCoursesFromApi(credentials, { silent = false } = {}) {
  if (!window.electronAPI || !window.electronAPI.refreshCourseData) {
    appendLog('Preload bridge chưa hỗ trợ refreshCourseData.', 'error');
    return;
  }

  if (!silent) {
    tableStatus.textContent = 'Đang tải danh sách môn học mới nhất từ hệ thống...';
  }

  try {
    const result = await window.electronAPI.refreshCourseData(credentials);
    if (result.success && result.data) {
      applyCourseData(result.data, 'dữ liệu trực tiếp từ hệ thống');
      appendLog('✅ Đã tải danh sách môn học mới nhất từ hệ thống.');
    } else {
      appendLog(`⚠️ Không tải được danh sách môn học mới: ${result.error || 'lỗi không xác định'}. Vẫn giữ dữ liệu hiện có.`, 'error');
      if (result.data) {
        applyCourseData(result.data, 'dữ liệu cũ — refresh thất bại');
      }
    }
  } catch (error) {
    appendLog(`Lỗi khi refresh danh sách môn học: ${error.message}`, 'error');
  }
}

function resetFilters() {
  filterCode.value = '';
  filterName.value = '';
  filterGroup.value = '';
  filterClass.value = '';
  renderTable();
}

filterCode.addEventListener('input', renderTable);
filterName.addEventListener('input', renderTable);
filterGroup.addEventListener('input', renderTable);
filterClass.addEventListener('input', renderTable);
resetFiltersButton.addEventListener('click', resetFilters);

selectAllButton.addEventListener('click', () => {
  const filters = getCurrentFilters();
  courseRows.filter((row) => filterRow(row, filters)).forEach((row) => selectedIds.add(row.id_to_hoc));
  renderTable();
});

deselectAllButton.addEventListener('click', () => {
  selectedIds.clear();
  renderTable();
});

headSelectAll.addEventListener('change', () => {
  const filtered = courseRows.filter((row) => filterRow(row, getCurrentFilters()));
  if (headSelectAll.checked) {
    filtered.forEach((row) => selectedIds.add(row.id_to_hoc));
  } else {
    filtered.forEach((row) => selectedIds.delete(row.id_to_hoc));
  }
  renderTable();
});

startButton.addEventListener('click', async () => {
  const options = {
    ACCESS_TOKEN: accessTokenInput.value.trim(),
    COOKIE: cookieInput.value.trim(),
    COURSES: coursesPreview.value.trim(),
    SV_NGANH: svNganhInput.value.trim() || '1',
    ID_RS_INIT: idRsInitInput.value.trim(),
    RETRY_INTERVAL_MS: retryIntervalInput.value.trim() || '1500',
    MAX_ATTEMPTS: maxAttemptsInput.value.trim() || '500',
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

  logArea.innerHTML = '';
  setActiveTab('config');
  updateStatus('Đang chạy...', 'info');
  startButton.disabled = true;
  startButton.textContent = 'Đang chạy...';
  if (pauseButton) {
    pauseButton.disabled = false;
    pauseButton.dataset.paused = 'no';
    pauseButton.textContent = 'Tạm dừng';
  }
  if (cancelButton) {
    cancelButton.disabled = false;
  }

  try {
    await window.electronAPI.startRegistration(options);
  } catch (error) {
    appendLog(error?.message || 'Lỗi không xác định khi khởi động đăng ký.', 'error');
    updateStatus('Lỗi khi chạy.', 'error');
    startButton.disabled = false;
    startButton.textContent = 'Bắt đầu đăng ký';
    if (pauseButton) {
      pauseButton.disabled = true;
      pauseButton.dataset.paused = 'no';
      pauseButton.textContent = 'Tạm dừng';
    }
    if (cancelButton) {
      cancelButton.disabled = true;
    }
  }
});

loginButton.addEventListener('click', async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!username || !password) {
    updateLoginStatus('Vui lòng điền tài khoản và mật khẩu.', 'error');
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = 'Đang đăng nhập...';
  updateLoginStatus('Đang đăng nhập...', 'info');
  appendLoginHint('Đang cố gắng đăng nhập và lấy token/cookie.');

  try {
    const result = await window.electronAPI.performLogin({ username, password });

    if (result.success) {
      updateLoginStatus('Đăng nhập thành công.', 'info');
      appendLoginHint(result.message);
      if (result.accessToken) {
        accessTokenInput.value = result.accessToken;
      }
      if (result.cookie) {
        cookieInput.value = result.cookie;
      }
      // Nếu main process trả về idRsInit từ payload CurrUser thì tự động điền
      if (result.idRsInit) {
        idRsInitInput.value = result.idRsInit;
        appendLoginHint('ID_RS_INIT đã được tự động điền từ thông tin đăng nhập.');
      }

      lastCredentials = { ACCESS_TOKEN: result.accessToken, COOKIE: result.cookie };
      if (result.courseData) {
        applyCourseData(result.courseData, 'dữ liệu trực tiếp từ hệ thống, ngay sau khi đăng nhập');
        appendLog('✅ Đã tự động tải danh sách môn học mới nhất sau khi đăng nhập.');
      } else if (result.courseFetchError) {
        appendLog(`⚠️ Đăng nhập thành công nhưng không tự tải được danh sách môn học: ${result.courseFetchError}. Thử bấm "Làm mới danh sách".`, 'error');
      }

      setActiveTab('config');
    } else {
      updateLoginStatus(result.message || 'Đăng nhập thất bại.', 'error');
      appendLoginHint('Vui lòng kiểm tra lại tài khoản/mật khẩu và thử lại.');
    }
  } catch (error) {
    updateLoginStatus(error?.message || 'Lỗi khi đăng nhập.', 'error');
    appendLoginHint('Không thể đăng nhập tự động. Nếu cần, copy COOKIE từ trình duyệt và dán thủ công.');
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Đăng nhập';
  }
});

clearLogsButton.addEventListener('click', () => {
  logArea.innerHTML = '';
  updateStatus('Logs đã được xóa.', 'info');
});

if (pauseButton) {
  pauseButton.addEventListener('click', async () => {
    if (!window.electronAPI) return;
    const isPaused = pauseButton.dataset.paused === 'yes';
    try {
      if (isPaused) {
        await window.electronAPI.resumeRegistration();
        pauseButton.dataset.paused = 'no';
        pauseButton.textContent = 'Tạm dừng';
        appendLog('▶️ Tiếp tục chạy đăng ký.');
      } else {
        await window.electronAPI.pauseRegistration();
        pauseButton.dataset.paused = 'yes';
        pauseButton.textContent = 'Tiếp tục';
        appendLog('⏸️ Đã tạm dừng đăng ký.');
      }
    } catch (err) {
      appendLog('Lỗi khi gửi yêu cầu tạm dừng/tiếp tục: ' + (err.message || err), 'error');
    }
  });
}

if (cancelButton) {
  cancelButton.addEventListener('click', async () => {
    if (!window.electronAPI) return;
    try {
      await window.electronAPI.cancelRegistration();
      appendLog('🛑 Đã gửi yêu cầu huỷ tiến trình đăng ký.');
      updateStatus('Đã huỷ', 'error');
      startButton.disabled = false;
      startButton.textContent = 'Bắt đầu đăng ký';
      if (pauseButton) {
        pauseButton.disabled = true;
        pauseButton.dataset.paused = 'no';
        pauseButton.textContent = 'Tạm dừng';
      }
      cancelButton.disabled = true;
    } catch (err) {
      appendLog('Lỗi khi huỷ: ' + (err.message || err), 'error');
    }
  });
}

if (window.electronAPI) {
  if (typeof window.electronAPI.onLog === 'function') {
    window.electronAPI.onLog(({ message, type }) => {
      appendLog(message, type);
      if (type === 'error' && /token\/?cookie|phiên đăng nhập|đã hết hạn/i.test(message)) {
        updateStatus('Phiên đăng nhập có thể đã hết hạn. Mở tab Đăng nhập để thử lại.', 'error');
        setActiveTab('login');
      }
    });
  }

  if (typeof window.electronAPI.onDone === 'function') {
    window.electronAPI.onDone((result) => {
      appendLog(result.success ? 'Quá trình đã hoàn tất.' : 'Quá trình dừng lại với một số môn chưa đăng ký được.', result.success ? 'info' : 'error');
      updateStatus(result.success ? 'Hoàn tất' : 'Kết thúc với lỗi', result.success ? 'info' : 'error');
      startButton.disabled = false;
      startButton.textContent = 'Bắt đầu đăng ký';
      if (pauseButton) {
        pauseButton.disabled = true;
        pauseButton.dataset.paused = 'no';
        pauseButton.textContent = 'Tạm dừng';
      }
      if (cancelButton) {
        cancelButton.disabled = true;
      }
    });
  }
}

const refreshCoursesButton = document.getElementById('refreshCoursesButton');
if (refreshCoursesButton) {
  refreshCoursesButton.addEventListener('click', async () => {
    const creds = (lastCredentials.ACCESS_TOKEN || lastCredentials.COOKIE)
      ? lastCredentials
      : { ACCESS_TOKEN: accessTokenInput.value.trim(), COOKIE: cookieInput.value.trim() };
    refreshCoursesButton.disabled = true;
    const originalText = refreshCoursesButton.textContent;
    refreshCoursesButton.textContent = 'Đang tải...';
    await refreshCoursesFromApi(creds);
    refreshCoursesButton.disabled = false;
    refreshCoursesButton.textContent = originalText;
  });
}

loadInitialCourses();