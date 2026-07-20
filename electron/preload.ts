import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from '../src/types';
// import type { RegisterOptions } from '../src/types';
const electronAPI: ElectronAPI = {
  startRegistration: (options) => ipcRenderer.invoke('register:start', options),
  pauseRegistration: () => ipcRenderer.invoke('register:pause'),
  resumeRegistration: () => ipcRenderer.invoke('register:resume'),
  cancelRegistration: () => ipcRenderer.invoke('register:stop'),

  loadCourseData: () => ipcRenderer.invoke('courses:load'),
  refreshCourseData: (credentials) => ipcRenderer.invoke('courses:refresh', credentials),

  performLogin: (credentials) => ipcRenderer.invoke('auth:login', credentials),

  onLog: (callback) => ipcRenderer.on('register:log', (_event, payload) => callback(payload)),

  onDone: (callback) => ipcRenderer.on('register:done', (_event, payload) => callback(payload)),
};
contextBridge.exposeInMainWorld('electronAPI', electronAPI);