import { app, BrowserWindow, ipcMain, Menu, screen } from 'electron'
import * as windowStateKeeper from 'electron-window-state'

const isDevelopment = process.env.NODE_ENV !== 'production'
const isMac = process.platform === 'darwin'
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
        label: 'Always on Top',
        accelerator: 'Cmd+Shift+A',
        type: 'checkbox',
        checked: window && window.isAlwaysOnTop(),
        click: () => {
          window.setAlwaysOnTop(!window.isAlwaysOnTop())
        }
      },
      {
        label: 'Toogle Zoom Image',
        accelerator: 'F',
        enable: false,
        click: () => {
          window.webContents.send('zoomImage')
        }
      },
      {
        label: 'Fit to Image',
        accelerator: 'Cmd+F',
        enable: false,
        click: () => {
          window.webContents.send('fitImage')
        }
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
  }
]

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
    titleBarStyle: isMac ? 'hidden' : 'default',
    frame: !isMac,
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

  if (!isDevelopment) {
    window.webContents.on('will-navigate', () => {
      event.preventDefault()
    })
  }

  window.loadURL(url)

  ipcMain.on('fit-image', (event, arg) => {
    if (window) {
      window.setSize(arg[0], arg[1], true)
    }
  })

  ipcMain.on('enable-zoom-command', (event, arg) => {
    menu.items[2].submenu.items[6].enabled = arg
  })

  ipcMain.on('enable-fit-command', (event, arg) => {
    menu.items[2].submenu.items[7].enabled = arg
  })

  ipcMain.on('enable-shuffle-command', (event, arg) => {
    menu.items[1].submenu.items[2].enabled = arg
  })

  ipcMain.on('enable-finder-command', (event, arg) => {
    menu.items[1].submenu.items[3].enabled = arg
  })

  ipcMain.on('enable-columns-command', (event, arg) => {
    menu.items[2].submenu.items[0].enabled = arg
    menu.items[2].submenu.items[1].enabled = arg
    menu.items[2].submenu.items[3].enabled = arg
  })

  ipcMain.on('toggle-window-button', (event, arg) => {
    if (window !== null && isMac) {
      window.setWindowButtonVisibility(arg)
    }
  })

  window.on('closed', () => {
    window = null

    menu.items[1].submenu.items[2].enabled = false
    menu.items[1].submenu.items[3].enabled = false
    menu.items[2].submenu.items[0].enabled = false
    menu.items[2].submenu.items[1].enabled = false
    menu.items[2].submenu.items[3].enabled = false
    menu.items[2].submenu.items[5].enabled = false
    menu.items[2].submenu.items[6].enabled = false
    menu.items[2].submenu.items[7].enabled = false
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
  if (!isMac) {
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
