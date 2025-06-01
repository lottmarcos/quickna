import { getRoomMessages } from 'src/backend/database/get-room-messages';
import { insertMessage } from 'src/backend/database/insert-message';
import { MessageData, SavedMessage } from 'src/constants/types';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer } from 'ws';

import type { WebSocket } from 'ws';

export type IncomingMessage = {
  type: 'join_room' | 'leave_room' | 'send_message';
  roomId?: string;
  content?: string;
  author?: string | null;
};

export type OutgoingMessage = {
  type: 'room_joined' | 'room_left' | 'new_message' | 'error' | 'connection';
  roomId?: string;
  message?: SavedMessage;
  messages?: SavedMessage[];
  error?: string;
  data?: unknown;
};

export type ClientConnection = {
  ws: WebSocket;
  roomId: string | null;
  clientId: string;
};

const roomConnections = new Map<string, Set<ClientConnection>>();
const clientConnections = new Map<WebSocket, ClientConnection>();

const createMessage = (
  type: OutgoingMessage['type'],
  data: Partial<OutgoingMessage> = {}
): OutgoingMessage => ({
  type,
  ...data,
});

const sendToClient = (
  connection: ClientConnection,
  message: OutgoingMessage
): void => {
  if (connection.ws.readyState === connection.ws.OPEN) {
    connection.ws.send(JSON.stringify(message));
  }
};

const broadcastToRoom = (
  roomId: string,
  message: OutgoingMessage,
  excludeClient?: string
): void => {
  const connections = roomConnections.get(roomId);
  if (!connections) return;

  connections.forEach((connection) => {
    if (excludeClient && connection.clientId === excludeClient) return;
    sendToClient(connection, message);
  });
};

const handleJoinRoom = async (
  connection: ClientConnection,
  roomId: string
): Promise<void> => {
  try {
    // Leave current room if any
    if (connection.roomId) {
      await handleLeaveRoom(connection);
    }

    // Join new room
    connection.roomId = roomId;

    if (!roomConnections.has(roomId)) {
      roomConnections.set(roomId, new Set());
    }
    roomConnections.get(roomId)!.add(connection);

    const messages = await getRoomMessages(roomId);

    sendToClient(
      connection,
      createMessage('room_joined', {
        roomId,
        messages,
      })
    );

    // eslint-disable-next-line no-console
    console.log(`✅ Client ${connection.clientId} joined room ${roomId}`);
  } catch (error) {
    console.error('Error joining room:', error);
    sendToClient(
      connection,
      createMessage('error', {
        error: 'Failed to join room',
      })
    );
  }
};

const handleLeaveRoom = async (connection: ClientConnection): Promise<void> => {
  if (!connection.roomId) return;

  const roomId = connection.roomId;
  const connections = roomConnections.get(roomId);

  if (connections) {
    connections.delete(connection);
    if (connections.size === 0) {
      roomConnections.delete(roomId);
    }
  }

  sendToClient(connection, createMessage('room_left', { roomId }));
  connection.roomId = null;

  // eslint-disable-next-line no-console
  console.log(`🚪 Client ${connection.clientId} left room ${roomId}`);
};

const handleSendMessage = async (
  connection: ClientConnection,
  content: string,
  author: string | null = null
): Promise<void> => {
  if (!connection.roomId) {
    sendToClient(
      connection,
      createMessage('error', {
        error: 'Not connected to any room',
      })
    );
    return;
  }

  try {
    const messageData: MessageData = {
      roomId: connection.roomId,
      content,
      author,
      createdAt: new Date(),
    };

    // Save message to database
    const savedMessage: SavedMessage = await insertMessage(messageData);

    broadcastToRoom(
      connection.roomId,
      createMessage('new_message', {
        message: savedMessage,
        roomId: connection.roomId,
      })
    );

    // eslint-disable-next-line no-console
    console.log(
      `✉️ Message sent in room ${connection.roomId} by ${author || 'anonymous'}`
    );
  } catch (error) {
    console.error('Error sending message:', error);
    sendToClient(
      connection,
      createMessage('error', {
        error: 'Failed to send message',
      })
    );
  }
};

const handleMessage = async (
  connection: ClientConnection,
  data: string
): Promise<void> => {
  try {
    const message: IncomingMessage = JSON.parse(data);

    switch (message.type) {
      case 'join_room':
        if (message.roomId) {
          await handleJoinRoom(connection, message.roomId);
        } else {
          sendToClient(
            connection,
            createMessage('error', {
              error: 'Room ID is required',
            })
          );
        }
        break;

      case 'leave_room':
        await handleLeaveRoom(connection);
        break;

      case 'send_message':
        if (message.content) {
          await handleSendMessage(connection, message.content, message.author);
        } else {
          sendToClient(
            connection,
            createMessage('error', {
              error: 'Message content is required',
            })
          );
        }
        break;

      default:
        sendToClient(
          connection,
          createMessage('error', {
            error: 'Unknown message type',
          })
        );
    }
  } catch (error) {
    console.error('❌ Error handling message:', error);
    sendToClient(
      connection,
      createMessage('error', {
        error: 'Invalid message format',
      })
    );
  }
};

const handleDisconnection = async (
  connection: ClientConnection
): Promise<void> => {
  if (connection.roomId) {
    await handleLeaveRoom(connection);
  }
  clientConnections.delete(connection.ws);
  // eslint-disable-next-line no-console
  console.log(`🚪 Client ${connection.clientId} disconnected`);
};

const createWebSocketServer = (port: number = 8080): WebSocketServer => {
  const wss = new WebSocketServer({ port });

  wss.on('connection', (ws: WebSocket) => {
    const clientId = uuidv4();
    const connection: ClientConnection = {
      ws,
      roomId: null,
      clientId,
    };

    clientConnections.set(ws, connection);

    sendToClient(
      connection,
      createMessage('connection', {
        data: { clientId },
      })
    );

    // eslint-disable-next-line no-console
    console.log(`✅ New client connected: ${clientId}`);

    ws.on('message', (data: Buffer) => {
      handleMessage(connection, data.toString());
    });

    ws.on('close', () => {
      handleDisconnection(connection);
    });

    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for client ${clientId}:`, error);
      handleDisconnection(connection);
    });
  });

  return wss;
};

export { createWebSocketServer };
