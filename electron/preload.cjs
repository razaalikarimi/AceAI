const { contextBridge, ipcRenderer } = require('electron');

// Expose safe API to renderer (React)
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.invoke('window:minimize'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  close: () => ipcRenderer.invoke('window:close'),

  // Overlay window
  launchOverlay: () => ipcRenderer.invoke('overlay:launch'),
  closeOverlay: () => ipcRenderer.invoke('overlay:close'),
  toggleOverlay: () => ipcRenderer.invoke('overlay:toggle'),
  moveOverlay: (pos) => ipcRenderer.invoke('overlay:move', pos),
  resizeOverlay: (size) => ipcRenderer.invoke('overlay:resize', size),
  sendAnswerToOverlay: (data) => ipcRenderer.invoke('overlay:send-answer', data),

  // Screen capture
  captureScreen: () => ipcRenderer.invoke('screen:capture'),

  // Store
  storeSet: (key, value) => ipcRenderer.invoke('store:set', { key, value }),
  storeGet: (key) => ipcRenderer.invoke('store:get', { key }),

  // Shell
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  // Keyboard shortcut listeners
  onShortcutAnalyze: (cb) => ipcRenderer.on('shortcut:analyze-screen', cb),
  onShortcutClear: (cb) => ipcRenderer.on('shortcut:clear', cb),
  onReceiveAnswer: (cb) => ipcRenderer.on('receive-answer', (_, data) => cb(data)),

  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
