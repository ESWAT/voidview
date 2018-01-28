import { app, BrowserWindow, ipcMain, Menu, screen } from 'electron';
import * as windowStateKeeper from 'electron-window-state';

const isDevelopment = process.env.NODE_ENV !== 'production';

let window;

const menuTemplate = [
  {
    submenu: [
      {
        role: 'about',
      },
      {
        type: 'separator',
      },
      {
        role: 'services',
        submenu: [],
      },
      {
        type: 'separator',
      },
      {
        role: 'hide',
      },
      {
        role: 'hideothers',
      },
      {
        role: 'unhide',
      },
      {
        type: 'separator',
      },
      {
        role: 'quit',
      },
    ],
  },
  {
    label: 'File',
    submenu: [
      {
        label: 'Open…',
        accelerator: 'Cmd+O',
        click: (item, focusedWindow) => {
          if (focusedWindow) window.webContents.send('open');
        },
      },
      {
        type: 'separator',
      },
      {
        label: 'Shuffle Images',
        accelerator: 'Cmd+R',
        enabled: false,
        click: (item, focusedWindow) => {
          if (focusedWindow) window.webContents.send('shuffle');
        },
      },
      {
        label: 'Show in Finder',
        accelerator: 'Cmd+Shift+O',
        enabled: false,
        click: (item, focusedWindow) => {
          if (focusedWindow)window.webContents.send('reveal');
        },
      },
    ],
  },
  {
    label: 'Window',
    submenu: [
      {
        role: 'close',
      },
      {
        role: 'minimize',
      },
      {
        role: 'zoom',
      },
      {
        type: 'separator',
      },
      {
        label: 'Yuffie',
        accelerator: 'Cmd+Alt+1',
        click: (item, focusedWindow) => {
          if (!focusedWindow && window) {
            window.focus();
          } else if (window === null) {
            window = createWindow();
          }
        },
      },
      {
        type: 'separator',
      },
      {
        role: 'front',
      },
    ],
  },
];

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const mainWindowState = windowStateKeeper({
    defaultWidth: width,
    defaultHeight: height,
  });

  window = new BrowserWindow({
    webPreferences: {
      webSecurity: false,
    },
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    titleBarStyle: 'hidden',
  });

  mainWindowState.manage(window);

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  const url = isDevelopment
    ? `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`
    : `file://${__dirname}/index.html`;

  // Open the DevTools.
  if (isDevelopment) {
    window.webContents.openDevTools();
  }

  window.loadURL(url);

  ipcMain.on('path-loaded', (event, arg) => {
    menu.items[1].submenu.items[2].enabled = arg;
    menu.items[1].submenu.items[3].enabled = arg;
  });

  window.on('closed', () => {
    window = null;
  });

  window.webContents.on('devtools-opened', () => {
    window.focus();
    setImmediate(() => {
      window.focus();
    });
  });

  return window;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  window = createWindow();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (window === null) {
    createWindow();
  }
});
