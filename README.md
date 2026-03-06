# Discord Clone - Fullstack Real-time Communication Platform

![Discord Clone Banner](https://raw.githubusercontent.com/AntonioErdeljac/next13-discord-clone/main/public/images/banner.png)

A high-performance, fullstack Discord clone built with **Next.js 14**, **React**, **Socket.io**, **Prisma**, **MongoDB**, and **Tailwind CSS**.

## ✨ Features

- **Real-time Messaging**: Instant communication using Socket.io.
- **Direct Messages**: 1-on-1 private conversations between members.
- **Media Channels**: High-quality Video and Audio calls powered by **LiveKit**.
- **Attachment Support**: Send images and PDF files easily via **UploadThing**.
- **Message Management**: Edit and delete messages in real-time for all users.
- **Server Management**:
  - Create and customize servers (Name, Image).
  - Invite system with unique, regeneratable links.
  - Role-based membership (Admin, Moderator, Guest).
  - Member management (Kick, Role changing).
- **Channel System**:
  - Categorized channels (Text, Audio, Video).
  - Full CRUD for channels and categories.
- **Optimized UI/UX**:
  - **Light/Dark Mode** support.
  - **Emoji Picker** integrated into the chat.
  - **Server Search** (CMD+K) for quick navigation.
  - Infinite loading for messages via **TanStack Query**.
  - Smart auto-scroll and scroll-to-load logic.
- **Responsive Design**: Fully mobile-optimized with beautiful sidebars and modals.
- **Authentication**: Secure user management with **Clerk**.

## 🚀 Tech Stack

- **Frontend**: Next.js 14, React, Tailwind CSS, Shadcn UI, Lucide Icons, Zustand.
- **Backend**: Next.js API Routes (App Router & Pages Router for Sockets).
- **Database**: MongoDB with Prisma ORM.
- **Real-time**: Socket.io, LiveKit (WebRTC).
- **File Storage**: UploadThing.
- **Auth**: Clerk.

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB instance (Atlas or local)
- Clerk, UploadThing, and LiveKit accounts for API keys.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/discord-clone.git
   cd discord-clone
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in the root directory and add the following:
   ```env
   DATABASE_URL=
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   UPLOADTHING_TOKEN=
   NEXT_PUBLIC_SITE_URL=http://localhost:3000

   LIVEKIT_API_KEY=
   LIVEKIT_API_SECRET=
   NEXT_PUBLIC_LIVEKIT_URL=
   ```

4. **Initialize Prisma**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

## 📄 License

This project is licensed under the MIT License.
