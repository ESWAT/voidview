'use strict'

import { app, BrowserWindow } from 'electron';

const path = require('path');
const url = require('path');
const fs = require('fs');

const isDevelopment = process.env.NODE_ENV !== 'production';

let window;

function createWindow () {
  window = new BrowserWindow({
    "webPreferences": {
      "webSecurity": false
    }
  });

  window.maximize();

  const url = isDevelopment
    ? `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`
    : `file://${__dirname}/index.html`

  // Open the DevTools.
  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  window.loadURL(url);

  window.on('closed', () => {
    window = null;
  });

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

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
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (window === null) {
    createWindow();
  }
})
