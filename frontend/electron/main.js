import { app, BrowserWindow, Menu, shell, ipcMain, dialog } from 'electron'
import pkg from 'electron-updater'
const { autoUpdater } = pkg
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = app.isPackaged 
  ? path.join(app.getAppPath()) 
  : path.join(__dirname, '..')

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist')
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let mainWindow = null

function createMenu() {
  const template = [
    {
      label: 'Archivo',
      submenu: [
        {
          label: 'Recargar',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow.reload()
        },
        {
          label: 'Herramientas de desarrollo',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => mainWindow.webContents.toggleDevTools()
        },
        { type: 'separator' },
        {
          label: 'Salir',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Ventana',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' }
      ]
    },
    {
      label: 'Ayuda',
      submenu: [
        {
          label: 'Acerca de VUNO POS',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'Acerca de VUNO POS',
              message: 'VUNO Punto de Venta',
              detail: `Versión ${app.getVersion()}\n\nAplicación de punto de venta desarrollada con Vue.js y Electron.`
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow() {
  console.log('[Electron] createWindow - RENDERER_DIST:', RENDERER_DIST)
  
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      sandbox: false
    },
    show: false,
    backgroundColor: '#f8fafc'
  })

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Electron] did-fail-load:', errorCode, errorDescription)
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[Electron] did-finish-load OK')
  })

  mainWindow.webContents.on('crashed', () => {
    console.error('[Electron] Renderer process crashed')
  })

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('[Electron] Render process gone:', details.reason)
  })

  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const levels = ['verbose', 'info', 'warning', 'error']
    console.log(`[Renderer ${levels[level] || level}] ${message}`)
    if (level === 3) {
      console.error(`[Renderer Error] at line ${line}: ${sourceId}`)
    }
  })

  mainWindow.once('ready-to-show', () => {
    console.log('[Electron] ready-to-show')
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  createMenu()

  const indexPath = path.join(RENDERER_DIST, 'index.html')
  console.log('[Electron] Loading:', indexPath)

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(indexPath)
  }

  return mainWindow
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    console.log('Buscando actualizaciones...')
  })

  autoUpdater.on('update-available', (info) => {
    console.log('Nueva versión disponible:', info.version)
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info)
    }
  })

  autoUpdater.on('update-not-available', () => {
    console.log('La aplicación está actualizada')
  })

  autoUpdater.on('error', (err) => {
    console.error('Error en auto-updater:', err)
  })

  autoUpdater.on('download-progress', (progress) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-progress', progress)
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Actualización descargada:', info.version)
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info)
    }
  })
}

app.whenReady().then(() => {
  createWindow()

  // Auto-updater: activo solo en builds empaquetados (no en dev)
  // En builds locales (sin releases de GitHub) falla silenciosamente con el catch
  if (!VITE_DEV_SERVER_URL) {
    try {
      setupAutoUpdater()
      autoUpdater.checkForUpdatesAndNotify()
    } catch (err) {
      console.log('Auto-updater no disponible:', err.message)
    }
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData')
})

ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url)
})
