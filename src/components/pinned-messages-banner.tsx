"use client";

import React, { useState, useEffect } from 'react';
import { Pin, X, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import qs from 'query-string';
import { cn } from '@/lib/utils';
import { UserAvatar } from '@/components/user-avatar';

interface PinnedMessage {
  id: string;
  content: string;
  fileUrl?: string;
  createdAt: string;
  pinnedAt: string;
  member: {
    id: string;
    profile: {
      id: string;
      name: string;
      imageUrl: string;
    };
  };
}

interface PinnedMessagesBannerProps {
  chatId: string;
  chatType: 'channel' | 'conversation';
  serverId?: string;
  onMessageClick?: (messageId: string) => void;
}

export const PinnedMessagesBanner: React.FC<PinnedMessagesBannerProps> = ({
  chatId,
  chatType,
  serverId,
  onMessageClick
}) => {
  const [pinnedMessages, setPinnedMessages] = useState<PinnedMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPinnedMessages();
  }, [chatId, chatType]);

  const fetchPinnedMessages = async () => {
    try {
      setIsLoading(true);
      const url = qs.stringifyUrl({
        url: '/api/pinned-messages',
        query: chatType === 'channel' 
          ? { serverId, channelId: chatId }
          : { conversationId: chatId }
      });
      
      console.log('Fetching pinned messages from:', url);
      const response = await axios.get(url);
      console.log('Pinned messages response:', response.data);
      setPinnedMessages(response.data);
      setIsVisible(response.data.length > 0);
    } catch (error) {
      console.error('Failed to fetch pinned messages:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response data:', error.response?.data);
        console.error('Response status:', error.response?.status);
      }
      // Don't show banner if there's an error
      setIsVisible(false);
      setPinnedMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (pinnedMessages.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % pinnedMessages.length);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleMessageClick = () => {
    if (pinnedMessages[currentIndex] && onMessageClick) {
      onMessageClick(pinnedMessages[currentIndex].id);
    }
  };

  if (isLoading || !isVisible || pinnedMessages.length === 0) {
    return null;
  }

  const currentMessage = pinnedMessages[currentIndex];

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/30 px-4 py-2">
      <div className="flex items-center gap-3">
        {/* Pin Icon */}
        <div className="flex-shrink-0">
          <Pin size={16} className="text-amber-600 dark:text-amber-400 rotate-45" />
        </div>

        {/* Message Content */}
        <div 
          className="flex-1 cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-800/30 rounded-md p-2 transition-colors"
          onClick={handleMessageClick}
        >
          <div className="flex items-center gap-2 mb-1">
            <UserAvatar 
              src={currentMessage.member.profile.imageUrl} 
              className="h-4 w-4"
            />
            <span className="text-xs font-medium text-amber-800 dark:text-amber-200">
              {currentMessage.member.profile.name}
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400">
              {format(new Date(currentMessage.createdAt), 'MMM d, h:mm a')}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {currentMessage.fileUrl ? (
              <div className="flex items-center gap-2">
                {currentMessage.fileUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img 
                    src={currentMessage.fileUrl} 
                    alt="Pinned image" 
                    className="w-8 h-8 rounded object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-amber-200 dark:bg-amber-700 rounded flex items-center justify-center">
                    <Pin size={12} className="text-amber-600 dark:text-amber-300" />
                  </div>
                )}
                <span className="text-sm text-amber-700 dark:text-amber-300 truncate">
                  {currentMessage.content || 'Media'}
                </span>
              </div>
            ) : (
              <span className="text-sm text-amber-700 dark:text-amber-300 truncate">
                {currentMessage.content}
              </span>
            )}
          </div>
        </div>

        {/* Navigation and Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {pinnedMessages.length > 1 && (
            <>
              <span className="text-xs text-amber-600 dark:text-amber-400">
                {currentIndex + 1}/{pinnedMessages.length}
              </span>
              <button
                onClick={handleNext}
                className="p-1 hover:bg-amber-200 dark:hover:bg-amber-700 rounded transition-colors"
                title="Next pinned message"
              >
                <ChevronRight size={16} className="text-amber-600 dark:text-amber-400" />
              </button>
            </>
          )}
          
          <button
            onClick={handleClose}
            className="p-1 hover:bg-amber-200 dark:hover:bg-amber-700 rounded transition-colors"
            title="Close pinned messages"
          >
            <X size={16} className="text-amber-600 dark:text-amber-400" />
          </button>
        </div>
      </div>
    </div>
  );
};