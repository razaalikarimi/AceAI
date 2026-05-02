const { app, BrowserWindow, ipcMain, globalShortcut, desktopCapturer, screen, shell, systemPreferences } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

let mainWindow = null;
let overlayWindow = null;

// ─── Main Dashboard Window ────────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0a0a0f',
    titleBarStyle: 'hiddenInset',
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, '../public/icon.png'),
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5175');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (overlayWindow) {
      overlayWindow.close();
      overlayWindow = null;
    }
    app.quit();
  });
}

// ─── Overlay Window (Stealth / Always-on-Top) ────────────────────────────────
function createOverlayWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  overlayWindow = new BrowserWindow({
    width: 420,
    height: 600,
    x: width - 440,
    y: 20,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  // Stealth: hide from screen capture / screen sharing
  overlayWindow.setContentProtection(true);
  overlayWindow.setAlwaysOnTop(true, 'screen-saver');
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  if (isDev) {
    overlayWindow.loadURL('http://localhost:5175/#/overlay');
  } else {
    overlayWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: 'overlay' });
  }

  overlayWindow.once('ready-to-show', () => {
    overlayWindow.show();
  });

  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

// ─── App Init ────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  createMainWindow();

  // Global shortcuts
  globalShortcut.register('Alt+A', () => {
    mainWindow?.webContents.send('shortcut:analyze-screen');
    overlayWindow?.webContents.send('shortcut:analyze-screen');
  });

  globalShortcut.register('Alt+H', () => {
    if (overlayWindow) {
      overlayWindow.isVisible() ? overlayWindow.hide() : overlayWindow.show();
    }
  });

  globalShortcut.register('Alt+C', () => {
    mainWindow?.webContents.send('shortcut:clear');
    overlayWindow?.webContents.send('shortcut:clear');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─── IPC Handlers ────────────────────────────────────────────────────────────

// Launch overlay window
ipcMain.handle('overlay:launch', async () => {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    createOverlayWindow();
    return { success: true };
  }
  overlayWindow.show();
  return { success: true, alreadyOpen: true };
});

// Close overlay window
ipcMain.handle('overlay:close', async () => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.close();
    overlayWindow = null;
  }
  return { success: true };
});

// Toggle overlay visibility
ipcMain.handle('overlay:toggle', async () => {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    createOverlayWindow();
    return { visible: true };
  }
  if (overlayWindow.isVisible()) {
    overlayWindow.hide();
    return { visible: false };
  } else {
    overlayWindow.show();
    return { visible: true };
  }
});

// Move overlay window
ipcMain.handle('overlay:move', async (_, { x, y }) => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setPosition(x, y);
  }
  return { success: true };
});

// Capture screenshot for screen analysis
ipcMain.handle('screen:capture', async () => {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 },
    });
    if (sources.length === 0) return { error: 'No screen sources found' };
    const thumbnail = sources[0].thumbnail;
    const dataUrl = thumbnail.toDataURL();
    return { dataUrl };
  } catch (err) {
    return { error: err.message };
  }
});

// Window controls
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('window:close', () => mainWindow?.close());

// Overlay window controls
ipcMain.handle('overlay:resize', async (_, { width, height }) => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setSize(width, height);
  }
});

// Send answer from main window to overlay
ipcMain.handle('overlay:send-answer', async (_, data) => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send('receive-answer', data);
  }
  return { success: true };
});

// Open external links
ipcMain.handle('shell:openExternal', async (_, url) => {
  await shell.openExternal(url);
});

// Store API key in memory (not persisted — use electron-store for production)
let apiKeyStore = {};
ipcMain.handle('store:set', async (_, { key, value }) => {
  apiKeyStore[key] = value;
  return { success: true };
});
ipcMain.handle('store:get', async (_, { key }) => {
  return { value: apiKeyStore[key] || null };
});
