import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { chatUtils } from '@/lib/chat-utils';

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  cited_sources?: any[];
};

export type ConversationMetadata = {
  id: string;
  title: string;
  userId?: string;
  createdAt: number;
  updatedAt: number;
};

interface ChatState {
  conversations: ConversationMetadata[];
  messages: Record<string, Message[]>; // Separated for performance
  activeId: string | null;
  isStreaming: boolean;
  
  // 🎨 UI State
  isSidebarCollapsed: boolean;
  isMobileSidebarOpen: boolean;
}

interface ChatActions {
  // Navigation & Selection
  selectConversation: (id: string | null) => void;
  createConversation: (title?: string, userId?: string) => string;
  deleteConversation: (id: string) => void;
  
  // 🎨 UI Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  
  // Message Management
  addMessage: (convId: string, message: Omit<Message, 'createdAt'>) => void;
  updateStreamingMessage: (convId: string, messageId: string, chunk: string, sources?: any[]) => void;
  
  // Metadata Management
  updateTitle: (convId: string, title: string) => void;
  setStreaming: (status: boolean) => void;
  
  // Utilities
  clearAll: () => void;
}

/**
 * 🧠 Central Chat Store (Zustand + Immer + Persist)
 */
export const useChatStore = create<ChatState & ChatActions>()(
  immer(
    persist(
      (set, get) => ({
        // Initial State
        conversations: [],
        messages: {},
        activeId: null,
        isStreaming: false,
        isSidebarCollapsed: false,
        isMobileSidebarOpen: false,

        // Actions
        setSidebarCollapsed: (collapsed) => {
          set((state) => {
            state.isSidebarCollapsed = collapsed;
          });
        },

        toggleMobileSidebar: () => {
          set((state) => {
            state.isMobileSidebarOpen = !state.isMobileSidebarOpen;
          });
        },

        selectConversation: (id) => {
          set((state) => {
            state.activeId = id;
            state.isMobileSidebarOpen = false; // Close on select for mobile
          });
        },

        createConversation: (title, userId) => {
          const id = chatUtils.generateId();
          const now = Date.now();
          
          const newConv: ConversationMetadata = {
            id,
            title: title || 'Nouvelle discussion',
            userId,
            createdAt: now,
            updatedAt: now,
          };

          set((state) => {
            state.conversations.unshift(newConv);
            state.messages[id] = [];
            state.activeId = id;
          });

          return id;
        },

        deleteConversation: (id) => {
          set((state) => {
            state.conversations = state.conversations.filter(c => c.id !== id);
            delete state.messages[id];
            if (state.activeId === id) {
              state.activeId = state.conversations.length > 0 ? state.conversations[0].id : null;
            }
          });
        },

        addMessage: (convId, message) => {
          set((state) => {
            if (!state.messages[convId]) state.messages[convId] = [];
            
            state.messages[convId].push({
              ...message,
              createdAt: Date.now()
            });

            // Update timestamp of the conversation for sorting
            const conv = state.conversations.find(c => c.id === convId);
            if (conv) {
              conv.updatedAt = Date.now();
            }
          });
        },

        updateStreamingMessage: (convId, messageId, chunk, sources) => {
          set((state) => {
            const msgs = state.messages[convId];
            if (!msgs) return;

            const msg = msgs.find(m => m.id === messageId);
            if (msg) {
              msg.content += chunk;
              if (sources) msg.cited_sources = sources;
            } else {
              // Create new assistant message if it doesn't exist yet
              msgs.push({
                id: messageId,
                role: 'assistant',
                content: chunk,
                cited_sources: sources,
                createdAt: Date.now()
              });
            }
            
            // Keep updated timestamp moving
            const conv = state.conversations.find(c => c.id === convId);
            if (conv) conv.updatedAt = Date.now();
          });
        },

        updateTitle: (convId, title) => {
          set((state) => {
            const conv = state.conversations.find(c => c.id === convId);
            if (conv) conv.title = title;
          });
        },

        setStreaming: (status) => {
          set((state) => {
            state.isStreaming = status;
          });
        },

        clearAll: () => {
          set((state) => {
            state.conversations = [];
            state.messages = {};
            state.activeId = null;
          });
        }
      }),
      {
        name: 'ohada-chat-storage', // Key in localStorage
        storage: createJSONStorage(() => localStorage),
        version: 1, // 🛠️ Migration-ready
        skipHydration: true, // 🛡️ Prevent Next.js hydration loops
        partialize: (state) => ({
          conversations: state.conversations,
          messages: state.messages,
          activeId: state.activeId,
        }), // 🔒 Don't persist UI states like isStreaming
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // Future migration logic here
          }
          return persistedState as ChatState;
        },
      }
    )
  )
);
