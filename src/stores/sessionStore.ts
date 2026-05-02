import { create } from 'zustand';

export type MessageRole = 'user' | 'assistant' | 'system';
export type QuestionSource = 'audio' | 'screen' | 'chat';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  source?: QuestionSource;
  timestamp: number;
  isStreaming?: boolean;
}

export interface SessionConfig {
  language: string;
  jobTitle: string;
  company: string;
  resumeContext: string;
  extraContext: string;
  apiKey: string;
  model: 'gpt-4o' | 'gpt-4o-mini' | 'gpt-4-turbo';
  responseStyle: 'concise' | 'detailed';
}

export interface SessionState {
  // Session status
  isSessionActive: boolean;
  sessionId: string | null;
  sessionStartTime: number | null;
  elapsedSeconds: number;

  // Config
  config: SessionConfig;

  // Messages / transcript
  messages: Message[];
  transcript: string;

  // Audio
  isListening: boolean;
  isTranscribing: boolean;

  // AI
  isGenerating: boolean;
  currentAnswer: string;

  // Overlay
  isOverlayOpen: boolean;
  overlayVisible: boolean;

  // Actions
  startSession: () => void;
  stopSession: () => void;
  updateConfig: (config: Partial<SessionConfig>) => void;
  addMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  setTranscript: (text: string) => void;
  appendTranscript: (text: string) => void;
  setListening: (v: boolean) => void;
  setTranscribing: (v: boolean) => void;
  setGenerating: (v: boolean) => void;
  setCurrentAnswer: (v: string) => void;
  setOverlayOpen: (v: boolean) => void;
  setOverlayVisible: (v: boolean) => void;
  tickTimer: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  isSessionActive: false,
  sessionId: null,
  sessionStartTime: null,
  elapsedSeconds: 0,

  config: {
    language: 'English',
    jobTitle: '',
    company: '',
    resumeContext: '',
    extraContext: '',
    apiKey: '',
    model: 'gpt-4o-mini',
    responseStyle: 'concise',
  },

  messages: [],
  transcript: '',
  isListening: false,
  isTranscribing: false,
  isGenerating: false,
  currentAnswer: '',
  isOverlayOpen: false,
  overlayVisible: true,

  startSession: () => {
    const id = `session_${Date.now()}`;
    set({
      isSessionActive: true,
      sessionId: id,
      sessionStartTime: Date.now(),
      elapsedSeconds: 0,
      messages: [],
      transcript: '',
      currentAnswer: '',
    });
  },

  stopSession: () => {
    set({
      isSessionActive: false,
      sessionId: null,
      sessionStartTime: null,
      isListening: false,
      isTranscribing: false,
      isGenerating: false,
    });
  },

  updateConfig: (cfg) => set((s) => ({ config: { ...s.config, ...cfg } })),

  addMessage: (msg) => {
    const id = `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const full: Message = { ...msg, id, timestamp: Date.now() };
    set((s) => ({ messages: [...s.messages, full] }));
    return id;
  },

  updateMessage: (id, updates) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  clearMessages: () => set({ messages: [], transcript: '', currentAnswer: '' }),

  setTranscript: (text) => set({ transcript: text }),
  appendTranscript: (text) =>
    set((s) => ({ transcript: s.transcript ? `${s.transcript} ${text}` : text })),

  setListening: (v) => set({ isListening: v }),
  setTranscribing: (v) => set({ isTranscribing: v }),
  setGenerating: (v) => set({ isGenerating: v }),
  setCurrentAnswer: (v) => set({ currentAnswer: v }),
  setOverlayOpen: (v) => set({ isOverlayOpen: v }),
  setOverlayVisible: (v) => set({ overlayVisible: v }),
  tickTimer: () => set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 })),
}));
