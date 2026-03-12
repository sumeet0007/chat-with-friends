import { create } from 'zustand';

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
  pinnedMessages: Record<string, PinnedMessage[]>; // chatId -> pinned messages
  isLoading: boolean;
  addPinnedMessage: (chatId: string, message: PinnedMessage) => void;
  removePinnedMessage: (chatId: string, messageId: string) => void;
  getPinnedMessages: (chatId: string) => PinnedMessage[];
  setPinnedMessages: (chatId: string, messages: PinnedMessage[]) => void;
  setLoading: (loading: boolean) => void;
  clearPinnedMessages: (chatId: string) => void;
}

export const usePinStore = create<PinStore>((set, get) => ({
  pinnedMessages: {},
  isLoading: false,

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
    const state = get();
    return state.pinnedMessages[chatId] || [];
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

  clearPinnedMessages: (chatId: string) => {
    set((state) => {
      const newPinnedMessages = { ...state.pinnedMessages };
      delete newPinnedMessages[chatId];
      return { pinnedMessages: newPinnedMessages };
    });
  },
}));