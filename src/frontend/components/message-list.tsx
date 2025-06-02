import React from 'react';

import { SavedMessage } from 'src/constants/types';

interface MessageListProps {
  messages: SavedMessage[];
  isLoading?: boolean;
}

const MessageList = ({ messages, isLoading }: MessageListProps) => {
  const formatTime = (date: Date | string) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Loading messages...</div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">
          No messages yet. Start the conversation!
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <div key={message.id} className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-700">
              {message.author || 'Anonymous'}
            </span>
            <span className="text-xs text-gray-500">
              {formatTime(message.createdAt)}
            </span>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-200">
            <p className="text-gray-800 whitespace-pre-wrap">
              {message.content}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export { MessageList };
