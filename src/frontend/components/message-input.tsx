import React, { useState } from 'react';

interface MessageInputProps {
  onSendMessage: (content: string, author: string | null) => void;
  disabled?: boolean;
  isInRoom?: boolean;
}

const MessageInput = ({
  onSendMessage,
  disabled = false,
  isInRoom = false,
}: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [author, setAuthor] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || disabled || !isInRoom) return;

    onSendMessage(message.trim(), author.trim() || null);
    setMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            placeholder="Your name (optional)"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={disabled || !isInRoom}
          />
        </div>
        <div className="flex gap-2">
          <textarea
            placeholder={
              isInRoom ? 'Type your message...' : 'Join a room to send messages'
            }
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={2}
            disabled={disabled || !isInRoom}
          />
          <button
            type="submit"
            disabled={disabled || !message.trim() || !isInRoom}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export { MessageInput };
