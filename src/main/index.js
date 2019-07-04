import { app, BrowserWindow, ipcMain, Menu, screen } from 'electron'
import * as windowStateKeeper from 'electron-window-state'

const isDevelopment = process.env.NODE_ENV !== 'production'

let window

const menuTemplate = [
  {
    label: 'VoidView',
    submenu: [
      {
        role: 'about'
      },
      {
        type: 'separator'
      },
      {
        role: 'services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        role: 'hide'
      },
      {
        role: 'hideothers'
      },
      {
        role: 'unhide'
      },
      {
        type: 'separator'
      },
      {
        role: 'quit'
      }
    ]
  },
  {
    label: 'File',
    submenu: [
      {
        label: 'Open…',
        accelerator: 'Cmd+O',
        click: () => {
          if (window === null) {
            window = createWindow()
          }
          window.webContents.send('open')
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Shuffle Images',
        accelerator: 'Cmd+R',
        enabled: false,
        click: () => {
          window.webContents.send('shuffle')
        }
      },
      {
        label: 'Show in Finder',
        accelerator: 'Cmd+Shift+O',
        enabled: false,
        click: () => {
          window.webContents.send('reveal')
        }
      }
    ]
  },
  {
    label: 'View',
    submenu: [
      {
        label: 'Add Columns',
        accelerator: 'Cmd+=',
        enabled: false,
        click: () => {
          window.webContents.send('increaseColumns')
        }
      },
      {
        label: 'Remove Columns',
        accelerator: 'Cmd+-',
        enabled: false,
        click: () => {
          window.webContents.send('decreaseColumns')
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Reset Columns',
        accelerator: 'Cmd+0',
        enabled: false,
        click: () => {
          window.webContents.send('resetColumns')
        }
      },
      {
        type: 'separator'
      },
      {
        role: 'togglefullscreen'
      }
    ]
  },
  {
    label: 'Window',
    submenu: [
      {
        role: 'close'
      },
      {
        role: 'minimize'
      },
      {
        role: 'zoom'
      },
      {
        type: 'separator'
      },
      {
        label: 'VoidView',
        accelerator: 'Cmd+Alt+1',
        click: (item, focusedWindow) => {
          if (!focusedWindow && window) {
            window.focus()
          } else if (window === null) {
            window = createWindow()
          }
        }
      },
      {
        type: 'separator'
      },
      {
        role: 'front'
      }
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'VoidView Help',
        accelerator: 'Cmd+Shift+h',
        click: () => {
          window.webContents.send('help')
        }
      }
    ]
  }]

function createWindow () {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const mainWindowState = windowStateKeeper({
    defaultWidth: width,
    defaultHeight: height
  })

  window = new BrowserWindow({
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      webSecurity: false,
      webviewTag: false
    },
    backgroundColor: '#000',
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    titleBarStyle: 'hidden',
    frame: false,
    show: false
  })

  mainWindowState.manage(window)

  const menu = Menu.buildFromTemplate(menuTemplate)
  Menu.setApplicationMenu(menu)

  const url = isDevelopment
    ? `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`
    : `file://${__dirname}/index.html`

  // Open the DevTools.
  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  window.loadURL(url)

  ipcMain.on('enable-shuffle-command', (event, arg) => {
    menu.items[1].submenu.items[2].enabled = arg
  })

  ipcMain.on('enable-finder-command', (event, arg) => {
    menu.items[1].submenu.items[3].enabled = arg
  })

  ipcMain.on('enable-column-changing', (event, arg) => {
    menu.items[2].submenu.items[0].enabled = arg
    menu.items[2].submenu.items[1].enabled = arg
    menu.items[2].submenu.items[3].enabled = arg
  })

  window.on('closed', () => {
    window = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  window.webContents.on('did-finish-load', () => {
    if (!window.isVisible()) {
      window.show()
    }
  })

  return window
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  window = createWindow()
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (window === null) {
    createWindow()
  }
})

app.on('browser-window-blur', () => {
  if (window !== null) {
    window.webContents.send('blur')
  }
})

app.on('browser-window-focus', () => {
  if (window !== null) {
    window.webContents.send('focus')
  }
})
