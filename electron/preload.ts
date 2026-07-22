import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from '../src/types';

const electronAPI: ElectronAPI = {
  startRegistration: (options) => ipcRenderer.invoke('register:start', options),
  pauseRegistration: () => ipcRenderer.invoke('register:pause'),
  resumeRegistration: () => ipcRenderer.invoke('register:resume'),
  cancelRegistration: () => ipcRenderer.invoke('register:stop'),
  loadCourseData: () => ipcRenderer.invoke('courses:load'),
  refreshCourseData: (credentials) => ipcRenderer.invoke('courses:refresh', credentials),
  performLogin: (credentials) => ipcRenderer.invoke('auth:login', credentials),
  onLog: (callback) => {
    const listener = (_event: unknown, payload: Parameters<typeof callback>[0]) => callback(payload);
    ipcRenderer.on('register:log', listener);
    return () => ipcRenderer.removeListener('register:log', listener);
  },
  onDone: (callback) => {
    const listener = (_event: unknown, payload: Parameters<typeof callback>[0]) => callback(payload);
    ipcRenderer.on('register:done', listener);
    return () => ipcRenderer.removeListener('register:done', listener);
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);