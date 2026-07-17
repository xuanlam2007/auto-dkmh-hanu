const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startRegistration: (options) => ipcRenderer.invoke('register:start', options),
  loadCourseData: () => ipcRenderer.invoke('courses:load'),
  performLogin: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  onLog: (callback) => ipcRenderer.on('register:log', (event, payload) => callback(payload)),
  onDone: (callback) => ipcRenderer.on('register:done', (event, payload) => callback(payload)),
});
