const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    // Development mode
    mainWindow.loadURL('http://localhost:3000');
  } else {
    // Production mode: Production server port par load karein
    // Jab app pack ho gi toh hum port 3000 par server run karwayenge
    startProductionServer(() => {
      mainWindow.loadURL('http://localhost:3000');
    });
  }
}

function startProductionServer(callback) {
  // Next.js standalone ya standard server ko yahan trigger kar sakte hain
  // Ya agar aapne server alag se start karna hai
  try {
    // Next.js app ko production mode mein chalane ke liye
    const next = require('next');
    const appNext = next({ dev: false, dir: app.getAppPath() });
    const handle = appNext.getRequestHandler();

    appNext.prepare().then(() => {
      http.createServer((req, res) => {
        handle(req, res);
      }).listen(3000, (err) => {
        if (err) throw err;
        console.log('> Ready on http://localhost:3000');
        if (callback) callback();
      });
    });
  } catch (e) {
    // Fallback agar direct require na ho toh localhost hit kare
    if (callback) callback();
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});