// Global type declarations for Electron API exposed via preload
interface ElectronAPI {
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
  launchOverlay: () => Promise<{ success: boolean; alreadyOpen?: boolean }>;
  closeOverlay: () => Promise<{ success: boolean }>;
  toggleOverlay: () => Promise<{ visible: boolean }>;
  moveOverlay: (pos: { x: number; y: number }) => Promise<void>;
  resizeOverlay: (size: { width: number; height: number }) => Promise<void>;
  sendAnswerToOverlay: (data: AnswerData) => Promise<{ success: boolean }>;
  captureScreen: () => Promise<{ dataUrl?: string; error?: string }>;
  storeSet: (key: string, value: string) => Promise<{ success: boolean }>;
  storeGet: (key: string) => Promise<{ value: string | null }>;
  openExternal: (url: string) => Promise<void>;
  onShortcutAnalyze: (cb: () => void) => void;
  onShortcutClear: (cb: () => void) => void;
  onReceiveAnswer: (cb: (data: AnswerData) => void) => void;
  removeAllListeners: (channel: string) => void;
}

interface AnswerData {
  question: string;
  answer: string;
  type: 'audio' | 'screen' | 'chat';
  timestamp: number;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
