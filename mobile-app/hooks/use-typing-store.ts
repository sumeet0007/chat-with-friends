import { create } from 'zustand';

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface TypingStore {
  typingUsers: Record<string, TypingUser[]>; // chatId -> array of typing users
  addTypingUser: (chatId: string, userId: string, userName: string) => void;
  removeTypingUser: (chatId: string, userId: string) => void;
  clearExpiredTyping: () => void;
  getTypingUsers: (chatId: string) => TypingUser[];
}

const TYPING_TIMEOUT = 3000; // 3 seconds

export const useTypingStore = create<TypingStore>((set, get) => ({
  typingUsers: {},
  
  addTypingUser: (chatId: string, userId: string, userName: string) => {
    set((state) => {
      const currentUsers = state.typingUsers[chatId] || [];
      const existingUserIndex = currentUsers.findIndex(user => user.userId === userId);
      
      const newUser: TypingUser = {
        userId,
        userName,
        timestamp: Date.now()
      };
      
      let updatedUsers;
      if (existingUserIndex >= 0) {
        updatedUsers = [...currentUsers];
        updatedUsers[existingUserIndex] = newUser;
      } else {
        updatedUsers = [...currentUsers, newUser];
      }
      
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatId]: updatedUsers
        }
      };
    });
  },
  
  removeTypingUser: (chatId: string, userId: string) => {
    set((state) => {
      const currentUsers = state.typingUsers[chatId] || [];
      const filteredUsers = currentUsers.filter(user => user.userId !== userId);
      
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatId]: filteredUsers
        }
      };
    });
  },
  
  clearExpiredTyping: () => {
    set((state) => {
      const now = Date.now();
      const updatedTypingUsers: Record<string, TypingUser[]> = {};
      
      Object.entries(state.typingUsers).forEach(([chatId, users]) => {
        const activeUsers = users.filter(user => now - user.timestamp < TYPING_TIMEOUT);
        if (activeUsers.length > 0) {
          updatedTypingUsers[chatId] = activeUsers;
        }
      });
      
      return { typingUsers: updatedTypingUsers };
    });
  },
  
  getTypingUsers: (chatId: string) => {
    const state = get();
    return state.typingUsers[chatId] || [];
  }
}));

// Auto-cleanup expired typing indicators
setInterval(() => {
  useTypingStore.getState().clearExpiredTyping();
}, 1000);