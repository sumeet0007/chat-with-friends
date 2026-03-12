import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';

interface PinnedMessage {
  id: string;
  content: string;
  fileUrl?: string;
  createdAt: string;
  pinnedAt: string;
  pinnedBy: {
    id: string;
    name: string;
    imageUrl: string;
  };
  author: {
    id: string;
    name: string;
    imageUrl: string;
  };
  chatId: string;
  chatType: 'channel' | 'conversation';
}

interface PinStore {
  pinnedMessages: Record<string, PinnedMessage[]>;
  isLoading: boolean;
  addPinnedMessage: (chatId: string, message: PinnedMessage) => void;
  removePinnedMessage: (chatId: string, messageId: string) => void;
  getPinnedMessages: (chatId: string) => PinnedMessage[];
  setPinnedMessages: (chatId: string, messages: PinnedMessage[]) => void;
  setLoading: (loading: boolean) => void;
  clearPinnedMessages: (chatId: string) => void;
  getPinnedCount: (chatId: string) => number;
}

const initialState = {
  pinnedMessages: {},
  isLoading: false,
};

export const usePinStore = create<PinStore>()(subscribeWithSelector((set, get) => ({
  ...initialState,

  addPinnedMessage: (chatId: string, message: PinnedMessage) => {
    set((state) => {
      const currentMessages = state.pinnedMessages[chatId] || [];
      const exists = currentMessages.some(msg => msg.id === message.id);
      
      if (exists) return state;
      
      const updatedMessages = [message, ...currentMessages].sort(
        (a, b) => new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime()
      );
      
      return {
        pinnedMessages: {
          ...state.pinnedMessages,
          [chatId]: updatedMessages
        }
      };
    });
  },

  removePinnedMessage: (chatId: string, messageId: string) => {
    set((state) => {
      const currentMessages = state.pinnedMessages[chatId] || [];
      const filteredMessages = currentMessages.filter(msg => msg.id !== messageId);
      
      return {
        pinnedMessages: {
          ...state.pinnedMessages,
          [chatId]: filteredMessages
        }
      };
    });
  },

  getPinnedMessages: (chatId: string) => {
    return get().pinnedMessages[chatId] || [];
  },

  setPinnedMessages: (chatId: string, messages: PinnedMessage[]) => {
    set((state) => ({
      pinnedMessages: {
        ...state.pinnedMessages,
        [chatId]: messages.sort(
          (a, b) => new Date(b.pinnedAt).getTime() - new Date(a.pinnedAt).getTime()
        )
      }
    }));
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  getPinnedCount: (chatId: string) => {
    const state = get();
    return state.pinnedMessages[chatId]?.length || 0;
  },

  clearPinnedMessages: (chatId: string) => {
    set((state) => {
      const newPinnedMessages = { ...state.pinnedMessages };
      delete newPinnedMessages[chatId];
      return { pinnedMessages: newPinnedMessages };
    });
  },
})));

// Add server snapshot for SSR
if (typeof window === 'undefined') {
  usePinStore.getServerState = () => initialState;
}