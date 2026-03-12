# 📌 PIN Functionality Implementation

This document explains the comprehensive PIN (message pinning) functionality implemented in your Discord clone project, covering both web and mobile platforms.

## 📋 Overview

The PIN functionality allows users to pin important messages in channels and conversations, making them easily accessible and prominently displayed. This is similar to Discord's message pinning feature.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Side   │◄──►│   API Routes    │◄──►│    Database     │
│  (Web/Mobile)   │    │ (Pin Messages)  │    │   (Prisma)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🌐 Web Implementation

### **1. Pin Store** (`/src/hooks/use-pin-store.ts`)

**State Management:**
```typescript
interface PinStore {
  pinnedMessages: Record<string, PinnedMessage[]>; // chatId -> messages
  isLoading: boolean;
  addPinnedMessage: (chatId, message) => void;
  removePinnedMessage: (chatId, messageId) => void;
  getPinnedMessages: (chatId) => PinnedMessage[];
  setPinnedMessages: (chatId, messages) => void;
}
```

**Key Features:**
- Automatic sorting by pin date (newest first)
- Duplicate prevention
- Efficient state updates with Zustand

### **2. Pin Indicator Component** (`/src/components/pin-indicator.tsx`)

**Visual Elements:**
- Shows count of pinned messages
- Pin icon with rotation (45 degrees)
- Color-coded with indigo theme
- Hover effects and transitions

**Usage:**
```tsx
<PinIndicator 
  chatId="channel-123"
  onClick={() => openPinnedMessages()}
/>
```

### **3. Pinned Messages Modal** (`/src/components/pinned-messages-modal.tsx`)

**Features:**
- Full-screen modal with backdrop
- List of all pinned messages
- Message author and pin information
- Unpin functionality
- Jump to message feature
- Image/file attachment support

**Modal Structure:**
- Header with pin count
- Scrollable message list
- Individual message cards
- Action buttons (unpin, jump)

### **4. API Integration** (`/src/pages/api/pinned-messages.ts`)

**Endpoints:**
- `GET` - Fetch pinned messages for a chat
- `POST` - Pin a message
- `DELETE` - Unpin a message

**Security:**
- User authentication required
- Permission checks for channels
- Access control for conversations

## 📱 Mobile Implementation

### **1. Mobile Pin Store** (`/mobile-app/hooks/use-pin-store.ts`)

Same interface as web version, optimized for React Native performance.

### **2. Mobile Pin Indicator** (`/mobile-app/components/PinIndicator.tsx`)

**Mobile-Specific Features:**
- Touch-friendly design
- Native styling with React Native
- Responsive sizing (sm, md, lg)
- Proper color handling

**Components:**
```tsx
// Standard indicator
<PinIndicator chatId="123" onPress={showPinned} />

// Badge version
<PinBadge count={5} />
```

## 🔧 Database Schema

### **Required Fields for Messages:**

```sql
-- Add to Message model
isPinned     Boolean   @default(false)
pinnedAt     DateTime?
pinnedById   String?
pinnedBy     Member?   @relation("PinnedBy", fields: [pinnedById], references: [id])

-- Add to DirectMessage model  
isPinned     Boolean   @default(false)
pinnedAt     DateTime?
pinnedById   String?
pinnedBy     Member?   @relation("PinnedBy", fields: [pinnedById], references: [id])
```

## 🎯 Key Features

### **Message Pinning:**
1. **Right-click Context Menu** - Pin/unpin messages
2. **Permission-based** - Only admins/mods can pin in channels
3. **Visual Indicators** - Pinned messages show pin icon
4. **Chronological Order** - Newest pins first

### **Pin Management:**
1. **Pin Counter** - Shows total pinned messages
2. **Pin Modal** - View all pinned messages
3. **Quick Actions** - Unpin, jump to message
4. **Rich Content** - Support for text, images, files

### **User Experience:**
1. **Intuitive UI** - Clear pin indicators
2. **Smooth Animations** - Fade in/out effects
3. **Responsive Design** - Works on all screen sizes
4. **Accessibility** - Proper ARIA labels and keyboard navigation

## 📍 Integration Points

### **Web Locations:**
- **Chat Input Area** - Pin indicator above input
- **Message Context Menu** - Pin/unpin options
- **Channel Headers** - Pin count display
- **Modal System** - Pinned messages modal

### **Mobile Locations:**
- **Chat Headers** - Pin indicator next to other actions
- **Message Long Press** - Pin/unpin options
- **Conversation Screens** - Pin count display

## 🔄 Data Flow

### **Pinning a Message:**
1. **User Action** → Right-click message → Select "Pin"
2. **API Call** → POST `/api/pinned-messages`
3. **Database Update** → Set `isPinned: true`, `pinnedAt: now()`
4. **State Update** → Add to pin store
5. **UI Update** → Show pin indicator, update counter

### **Viewing Pinned Messages:**
1. **User Click** → Pin indicator in chat
2. **Modal Open** → Pinned messages modal
3. **API Fetch** → GET `/api/pinned-messages`
4. **Display** → Show all pinned messages with actions

### **Unpinning a Message:**
1. **User Action** → Click unpin in modal
2. **API Call** → DELETE `/api/pinned-messages`
3. **Database Update** → Set `isPinned: false`
4. **State Update** → Remove from pin store
5. **UI Update** → Update counter, remove from modal

## 🛡️ Security & Permissions

### **Channel Permissions:**
- **Pin Messages** - Admin/Moderator only
- **View Pinned** - All channel members
- **Unpin Messages** - Admin/Moderator + original pinner

### **Conversation Permissions:**
- **Pin Messages** - Both conversation participants
- **View Pinned** - Both participants
- **Unpin Messages** - Both participants

### **API Security:**
- Authentication required for all endpoints
- Permission validation before operations
- Rate limiting to prevent abuse

## 🎨 Visual Design

### **Pin Indicator:**
- **Color**: Indigo (`#6366F1`)
- **Icon**: Pin rotated 45 degrees
- **Background**: Semi-transparent indigo
- **Border**: Subtle indigo border

### **Pinned Messages Modal:**
- **Backdrop**: Dark overlay with blur
- **Modal**: Clean white/dark theme
- **Cards**: Individual message containers
- **Actions**: Hover effects and transitions

### **Message Pins:**
- **Badge**: Small pin icon on pinned messages
- **Highlight**: Subtle background color change
- **Animation**: Smooth pin/unpin transitions

## 🚀 Usage Examples

### **Basic Pin Indicator:**
```tsx
// Web
import { PinIndicator } from '@/components/pin-indicator';
<PinIndicator chatId={channelId} onClick={openModal} />

// Mobile
import { PinIndicator } from '@/components/PinIndicator';
<PinIndicator chatId={channelId} onPress={openModal} />
```

### **Opening Pinned Messages Modal:**
```tsx
const { onOpen } = useModal();

const showPinnedMessages = () => {
  onOpen("pinnedMessages", {
    chatId: channelId,
    chatType: "channel",
    chatName: channelName
  });
};
```

### **Pin/Unpin Message:**
```tsx
const pinMessage = async (messageId: string) => {
  await axios.post('/api/pinned-messages', {
    messageId,
    chatId,
    chatType
  });
};

const unpinMessage = async (messageId: string) => {
  await axios.delete(`/api/pinned-messages?messageId=${messageId}&chatId=${chatId}`);
};
```

## 📊 Performance Considerations

### **Optimization Strategies:**
1. **Lazy Loading** - Load pinned messages only when modal opens
2. **Caching** - Store pinned messages in Zustand store
3. **Pagination** - Limit pinned messages display (if many)
4. **Debouncing** - Prevent rapid pin/unpin actions
5. **Optimistic Updates** - Update UI before API response

### **Memory Management:**
```typescript
// Efficient state updates
addPinnedMessage: (chatId, message) => {
  set((state) => {
    const exists = state.pinnedMessages[chatId]?.some(m => m.id === message.id);
    if (exists) return state; // Prevent duplicates
    
    return {
      pinnedMessages: {
        ...state.pinnedMessages,
        [chatId]: [message, ...current].sort(byPinnedDate)
      }
    };
  });
}
```

## 🧪 Testing

### **Test Scenarios:**
1. **Pin Message** - Verify message gets pinned
2. **View Pinned** - Check modal displays correctly
3. **Unpin Message** - Confirm message removal
4. **Permissions** - Test role-based access
5. **Cross-Platform** - Ensure web/mobile consistency

### **API Testing:**
```bash
# Pin a message
curl -X POST /api/pinned-messages \
  -H "Content-Type: application/json" \
  -d '{"messageId":"123","chatId":"456","chatType":"channel"}'

# Get pinned messages
curl -X GET "/api/pinned-messages?chatId=456&chatType=channel"

# Unpin a message
curl -X DELETE "/api/pinned-messages?messageId=123&chatId=456"
```

## 🎯 Key Benefits

1. **Important Message Highlighting** - Keep crucial info accessible
2. **Better Organization** - Reduce message searching
3. **Team Communication** - Pin announcements and updates
4. **Cross-Platform Sync** - Consistent experience everywhere
5. **Permission Control** - Proper access management
6. **Rich Content Support** - Pin any message type

This PIN functionality provides a professional Discord-like message pinning experience with comprehensive management tools across all platforms! 📌