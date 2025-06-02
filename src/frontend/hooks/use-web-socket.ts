/* eslint-disable no-console */
import { useEffect, useState } from 'react';

import { io, Socket } from 'socket.io-client';
import { SavedMessage, SocketMessage } from 'src/constants/types';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  clientId: string | null;
  messages: SavedMessage[];
  isInRoom: boolean;
  currentRoomId: string | null;
  error: string | null;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  sendMessage: (content: string, author?: string | null) => void;
}

const useWebSocket = (): UseSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isInRoom, setIsInRoom] = useState(false);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socketInstance = io({
      path: '/api/socket',
      addTrailingSlash: false,
    });

    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setError(null);
    });

    socketInstance.on('connection', (data: SocketMessage) => {
      if (data.data?.clientId) {
        setClientId(data.data.clientId);
        console.log('Client ID received:', data.data.clientId);
      }
    });

    socketInstance.on('room_joined', (data: SocketMessage) => {
      console.log('Joined room:', data.roomId);
      setIsInRoom(true);
      setCurrentRoomId(data.roomId || null);
      setMessages(data.messages || []);
      setError(null);
    });

    socketInstance.on('room_left', (data: SocketMessage) => {
      console.log('Left room:', data.roomId);
      setIsInRoom(false);
      setCurrentRoomId(null);
      setMessages([]);
      setError(null);
    });

    socketInstance.on('new_message', (data: SocketMessage) => {
      if (data.message) {
        console.log('New message received:', data.message);
        setMessages((prev) => [...prev, data.message!]);
      }
    });

    socketInstance.on('error', (data: SocketMessage) => {
      console.error('Socket error:', data.error);
      setError(data.error || 'Unknown error occurred');
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setIsInRoom(false);
      setCurrentRoomId(null);
      setMessages([]);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinRoom = (roomId: string) => {
    if (socket && isConnected) {
      console.log('Joining room:', roomId);
      socket.emit('join_room', { roomId });
    }
  };

  const leaveRoom = () => {
    if (socket && isConnected) {
      console.log('Leaving room');
      socket.emit('leave_room');
    }
  };

  const sendMessage = (content: string, author: string | null = null) => {
    if (socket && isConnected && isInRoom) {
      console.log('Sending message:', { content, author });
      socket.emit('send_message', { content, author });
    }
  };

  return {
    socket,
    isConnected,
    clientId,
    messages,
    isInRoom,
    currentRoomId,
    error,
    joinRoom,
    leaveRoom,
    sendMessage,
  };
};

export { useWebSocket };
