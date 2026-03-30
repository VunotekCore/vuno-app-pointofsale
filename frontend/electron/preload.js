import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  platform: process.platform,
  
  onMessage: (callback) => {
    ipcRenderer.on('message', (event, data) => callback(data))
  }
})
