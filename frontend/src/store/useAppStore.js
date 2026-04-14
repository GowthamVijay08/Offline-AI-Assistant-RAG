import { create } from 'zustand';

const generateId = () => Math.random().toString(36).substring(2, 15);

const useAppStore = create((set, get) => ({
  // ─── Theme — Dark by default ───
  darkMode: true,
  toggleDarkMode: () => {
    const next = !get().darkMode;
    localStorage.setItem('darkMode', String(next));
    if (next) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    set({ darkMode: next });
  },
  initTheme: () => {
    // Always enforce dark mode as the default
    const stored = localStorage.getItem('darkMode');
    const isDark = stored === null ? true : stored === 'true';
    if (isDark) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    set({ darkMode: isDark });
  },

  // ─── Sidebar ───
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // ─── Conversations ───
  conversations: [
    { id: 'default', title: 'New Chat', createdAt: new Date().toISOString() },
  ],
  activeConversationId: 'default',

  createNewChat: () => {
    set({
      messages: [],
      fileId: null,
      uploadedFile: null,
      uploadStatus: 'idle',
      uploadError: null,
      error: null, // Reset error as well
    });
  },

  setActiveConversation: (id) => {
    set({
      activeConversationId: id,
      messages: [],
      uploadedFile: null,
      fileId: null,
      uploadStatus: 'idle',
      uploadError: null,
    });
  },

  deleteConversation: (id) => {
    set((s) => {
      const filtered = s.conversations.filter((c) => c.id !== id);
      if (filtered.length === 0) {
        const newConvo = { id: generateId(), title: 'New Chat', createdAt: new Date().toISOString() };
        return {
          conversations: [newConvo],
          activeConversationId: newConvo.id,
          messages: [],
        };
      }
      const isActive = s.activeConversationId === id;
      return {
        conversations: filtered,
        activeConversationId: isActive ? filtered[0].id : s.activeConversationId,
        messages: isActive ? [] : s.messages,
      };
    });
  },

  // ─── Messages ───
  messages: [],
  isLoading: false,
  error: null,

  addMessage: (message) => {
    const msg = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      ...message,
    };
    set((s) => {
      // Update conversation title from first user message
      let conversations = s.conversations;
      if (message.role === 'user' && s.messages.length === 0) {
        conversations = s.conversations.map((c) =>
          c.id === s.activeConversationId
            ? { ...c, title: message.content.substring(0, 40) + (message.content.length > 40 ? '...' : '') }
            : c
        );
      }
      return {
        messages: [...s.messages, msg],
        conversations,
      };
    });
    return msg;
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  clearChat: () => set({ messages: [] }),

  createNewChat: () => set({
    messages: [],
    fileId: null,
    error: null,
    uploadedFile: null,
    uploadStatus: 'idle',
    uploadError: null,
  }),

  // ─── File Upload ───
  uploadedFile: null,
  fileId: null,
  uploadStatus: 'idle', // 'idle' | 'uploading' | 'success' | 'error'
  uploadError: null,

  setUploadedFile: (file) => set({ uploadedFile: file, uploadStatus: 'idle', uploadError: null }),
  setFileId: (id) => set({ fileId: id, messages: [] }),
  setUploadStatus: (status) => set({ uploadStatus: status }),
  setUploadError: (error) => set({ uploadError: error, uploadStatus: 'error' }),
  clearUpload: () => set({ uploadedFile: null, fileId: null, uploadStatus: 'idle', uploadError: null }),
}));

export default useAppStore;
