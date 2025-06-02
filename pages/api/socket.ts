/* eslint-disable no-console */
import { NextApiRequest, NextApiResponse } from 'next';

import { Server as NetServer } from 'http';
import { Socket } from 'net';

import { Server as SocketIOServer } from 'socket.io';
import { getRoomMessages, insertMessage } from 'src/backend/database';
import { v4 as uuidv4 } from 'uuid';

import { MessageData, SavedMessage } from '../../src/constants/types';

type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

const roomConnections = new Map<string, Set<string>>();
const clientConnections = new Map<
  string,
  { socketId: string; roomId: string | null }
>();

const createMessage = (
  type: 'room_joined' | 'room_left' | 'new_message' | 'error' | 'connection',
  data: Record<string, unknown> = {}
) => ({
  type,
  ...data,
});

const sendToClient = (
  io: SocketIOServer,
  socketId: string,
  message: {
    type: 'room_joined' | 'room_left' | 'new_message' | 'error' | 'connection';
    [key: string]: unknown;
  }
): void => {
  io.to(socketId).emit(message.type, message);
};

const handleJoinRoom = async (
  io: SocketIOServer,
  socketId: string,
  clientId: string,
  roomId: string
): Promise<void> => {
  try {
    console.log(`Client ${clientId} attempting to join room: ${roomId}`);

    const clientConnection = clientConnections.get(clientId);
    if (clientConnection?.roomId) {
      await handleLeaveRoom(io, socketId, clientId);
    }

    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.join(roomId);
    }

    if (!roomConnections.has(roomId)) {
      roomConnections.set(roomId, new Set());
    }
    roomConnections.get(roomId)!.add(socketId);
    clientConnections.set(clientId, { socketId, roomId });

    let messages: SavedMessage[] = [];
    try {
      messages = await getRoomMessages(roomId);
      console.log(`Found ${messages.length} messages in room ${roomId}`);
    } catch (dbError) {
      console.error('Database error when getting room messages:', dbError);
      messages = [];
    }

    const response = createMessage('room_joined', {
      roomId,
      messages,
    });

    sendToClient(io, socketId, response);
    console.log(`✅ Client ${clientId} joined room ${roomId}`);
  } catch (error) {
    console.error('Error joining room:', error);
    const errorResponse = createMessage('error', {
      error: 'Failed to join room',
    });
    sendToClient(io, socketId, errorResponse);
  }
};

const handleLeaveRoom = async (
  io: SocketIOServer,
  socketId: string,
  clientId: string
): Promise<void> => {
  const clientConnection = clientConnections.get(clientId);
  if (!clientConnection?.roomId) return;

  const roomId = clientConnection.roomId;

  const connections = roomConnections.get(roomId);
  if (connections) {
    connections.delete(socketId);
    if (connections.size === 0) {
      roomConnections.delete(roomId);
    }
  }

  const socket = io.sockets.sockets.get(socketId);
  if (socket) {
    socket.leave(roomId);
  }

  clientConnection.roomId = null;

  const response = createMessage('room_left', { roomId });
  sendToClient(io, socketId, response);

  console.log(`🚪 Client ${clientId} left room ${roomId}`);
};

const handleSendMessage = async (
  io: SocketIOServer,
  socketId: string,
  clientId: string,
  content: string,
  author: string | null = null
): Promise<void> => {
  const clientConnection = clientConnections.get(clientId);
  const roomId = clientConnection?.roomId;

  if (!roomId) {
    const errorResponse = createMessage('error', {
      error: 'Not connected to any room',
    });
    sendToClient(io, socketId, errorResponse);
    return;
  }

  try {
    const messageData: MessageData = {
      roomId,
      content,
      author,
      createdAt: new Date(),
    };

    const savedMessage: SavedMessage = await insertMessage(messageData);

    const messageResponse = createMessage('new_message', {
      message: savedMessage,
      roomId,
    });

    io.to(roomId).emit('new_message', messageResponse);

    console.log(
      `✉️ Message sent in room ${roomId} by ${author || 'anonymous'}`
    );
  } catch (error) {
    console.error('Error sending message:', error);
    const errorResponse = createMessage('error', {
      error: 'Failed to send message',
    });
    sendToClient(io, socketId, errorResponse);
  }
};

const handleDisconnection = async (
  io: SocketIOServer,
  socketId: string,
  clientId: string
): Promise<void> => {
  const clientConnection = clientConnections.get(clientId);

  if (clientConnection?.roomId) {
    await handleLeaveRoom(io, socketId, clientId);
  }

  clientConnections.delete(clientId);
  console.log(`🚪 Client ${clientId} disconnected`);
};

export default function SocketHandler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (res.socket.server.io) {
    console.log('Socket.IO server already running');
  } else {
    console.log('Socket.IO server initializing...');

    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin:
          process.env.NODE_ENV === 'production'
            ? [
                process.env.NEXTAUTH_URL,
                process.env.VERCEL_URL,
                process.env.NEXT_PUBLIC_VERCEL_URL,
              ].filter(Boolean)
            : 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    res.socket.server.io = io;

    io.on('connection', (socket) => {
      const clientId = uuidv4();
      const socketId = socket.id;

      clientConnections.set(clientId, { socketId, roomId: null });

      console.log(`✅ New client connected: ${clientId}`);

      const connectionResponse = createMessage('connection', {
        data: { clientId },
      });
      sendToClient(io, socketId, connectionResponse);

      socket.on('join_room', async (data: { roomId: string }) => {
        if (data.roomId) {
          await handleJoinRoom(io, socketId, clientId, data.roomId);
        } else {
          const errorResponse = createMessage('error', {
            error: 'Room ID is required',
          });
          sendToClient(io, socketId, errorResponse);
        }
      });

      socket.on('leave_room', async () => {
        await handleLeaveRoom(io, socketId, clientId);
      });

      socket.on(
        'send_message',
        async (data: { content: string; author?: string | null }) => {
          if (data.content && data.content.trim()) {
            await handleSendMessage(
              io,
              socketId,
              clientId,
              data.content.trim(),
              data.author || null
            );
          } else {
            const errorResponse = createMessage('error', {
              error: 'Message content is required',
            });
            sendToClient(io, socketId, errorResponse);
          }
        }
      );

      socket.on('disconnect', async () => {
        await handleDisconnection(io, socketId, clientId);
      });

      socket.on('error', (error) => {
        console.error(`❌ Socket error for client ${clientId}:`, error);
        handleDisconnection(io, socketId, clientId);
      });
    });

    console.log('✅ Socket.IO server initialized');
  }

  res.end();
}
