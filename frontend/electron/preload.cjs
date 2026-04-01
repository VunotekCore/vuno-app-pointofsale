const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  platform: process.platform,
  
  onMessage: (callback) => {
    ipcRenderer.on('message', (event, data) => callback(data))
  },

  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => callback(info))
  },
  onUpdateProgress: (callback) => {
    ipcRenderer.on('update-progress', (event, progress) => callback(progress))
  },
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (event, info) => callback(info))
  }
})
