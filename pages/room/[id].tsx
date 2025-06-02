/* eslint-disable no-console */
import { useRouter } from 'next/router';
import React, { useEffect, useRef } from 'react';

import {
  ConnectionStatus,
  MessageInput,
  MessageList,
} from 'src/frontend/components';
import { useWebSocket } from 'src/frontend/hooks';

const RoomPage: React.FC = () => {
  const router = useRouter();
  const { id: roomId } = router.query;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    isConnected,
    clientId,
    messages,
    isInRoom,
    currentRoomId,
    error,
    joinRoom,
    leaveRoom,
    sendMessage,
  } = useWebSocket();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Join room when component mounts and socket is connected
  useEffect(() => {
    if (roomId && typeof roomId === 'string' && isConnected && !isInRoom) {
      console.log('Auto-joining room:', roomId);
      joinRoom(roomId);
    }
  }, [roomId, isConnected, isInRoom, joinRoom]);

  // Handle page navigation
  const handleLeaveRoom = () => {
    leaveRoom();
    router.push('/');
  };

  if (!roomId || typeof roomId !== 'string') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-800 mb-2">
            Invalid Room
          </h1>
          <p className="text-gray-600">The room ID is missing or invalid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white shadow-lg">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                Room: {roomId}
              </h1>
              <p className="text-sm text-gray-600">
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Refresh
              </button>
              <button
                onClick={handleLeaveRoom}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <ConnectionStatus
          isConnected={isConnected}
          isInRoom={isInRoom}
          currentRoomId={currentRoomId}
          clientId={clientId}
          error={error}
        />

        {/* Chat Container */}
        <div className="h-[calc(100vh-200px)] flex flex-col">
          {/* Messages */}
          <MessageList messages={messages} isLoading={!isConnected} />

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />

          {/* Message Input */}
          <MessageInput
            onSendMessage={sendMessage}
            disabled={!isConnected}
            isInRoom={isInRoom}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-2 bg-gray-50 text-center">
          <p className="text-xs text-gray-500">
            Share this URL to invite others to this room
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
