import { insertMessage } from 'src/backend/database/insert-message';
import { createWebSocketServer } from 'src/backend/services/web-socket';
import { MessageData } from 'src/constants/types';
import { query } from 'src/integrations/database';
import { clearDatabase, runMigrations } from 'tests/utils';
import { WebSocketServer } from 'ws';

// Mock WebSocket for testing
class MockWebSocket {
  public readyState: number = 1;
  public OPEN: number = 1;
  public sent: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  public listeners: { [key: string]: Function[] } = {};

  send(data: string) {
    this.sent.push(data);
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((listener) => listener(...args));
    }
  }

  close() {
    this.readyState = 3;
    this.emit('close');
  }

  getSentMessages() {
    return this.sent.map((msg) => JSON.parse(msg));
  }

  getLastSentMessage() {
    const messages = this.getSentMessages();
    return messages[messages.length - 1];
  }

  clearSent() {
    this.sent = [];
  }
}

// Mock WebSocketServer
class MockWebSocketServer {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  public listeners: { [key: string]: Function[] } = {};
  public port: number;

  constructor(options: { port: number }) {
    this.port = options.port;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((listener) => listener(...args));
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  close(callback?: Function) {
    if (callback) callback();
  }

  simulateConnection(): MockWebSocket {
    const mockWs = new MockWebSocket();
    this.emit('connection', mockWs as any);
    return mockWs;
  }
}

// Mock the ws module
jest.mock('ws', () => ({
  WebSocketServer: jest
    .fn()
    .mockImplementation((options) => new MockWebSocketServer(options)),
}));

// Mock console.log to avoid noise in tests
// eslint-disable-next-line no-console
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('WebSocket Service', () => {
  let server: WebSocketServer;
  let mockServer: MockWebSocketServer;

  beforeAll(async () => {
    // eslint-disable-next-line no-console
    console.log = jest.fn();
    console.error = jest.fn();
    await clearDatabase();
    await runMigrations();
  });

  afterAll(async () => {
    // eslint-disable-next-line no-console
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    await clearDatabase();
  });

  beforeEach(async () => {
    // Clear database
    await query({ text: 'DELETE FROM messages', values: [] });
    await query({ text: 'DELETE FROM rooms', values: [] });

    // Create test room
    await query({
      text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
      values: ['TEST1', 'Test Room'],
    });

    // Create server
    server = createWebSocketServer(8080);
    mockServer = server as any;
    jest.clearAllMocks();
  });

  afterEach(() => {
    server?.close();
  });

  describe('Client Connection', () => {
    it('should handle new client connection', () => {
      const mockWs = mockServer.simulateConnection();
      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('New client connected:')
      );

      const connectionMessage = mockWs.getLastSentMessage();
      expect(connectionMessage.type).toBe('connection');
      expect(connectionMessage.data.clientId).toBeDefined();
      expect(typeof connectionMessage.data.clientId).toBe('string');
    });

    it('should assign unique client IDs to different connections', () => {
      const mockWs1 = mockServer.simulateConnection();
      const mockWs2 = mockServer.simulateConnection();

      const message1 = mockWs1.getLastSentMessage();
      const message2 = mockWs2.getLastSentMessage();

      expect(message1.data.clientId).not.toBe(message2.data.clientId);
    });
  });

  describe('Room Management', () => {
    it('should handle join_room message successfully', async () => {
      const mockWs = mockServer.simulateConnection();
      mockWs.clearSent();

      const joinMessage = {
        type: 'join_room',
        roomId: 'TEST1',
      };

      mockWs.emit('message', Buffer.from(JSON.stringify(joinMessage)));

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = mockWs.getLastSentMessage();
      expect(response.type).toBe('room_joined');
      expect(response.roomId).toBe('TEST1');
      expect(Array.isArray(response.messages)).toBe(true);
    });

    it('should return existing messages when joining room', async () => {
      // Insert test messages
      const messageData: MessageData = {
        roomId: 'TEST1',
        content: 'Existing message',
        author: 'Test User',
        createdAt: new Date(),
      };
      await insertMessage(messageData);

      const mockWs = mockServer.simulateConnection();
      mockWs.clearSent();

      const joinMessage = {
        type: 'join_room',
        roomId: 'TEST1',
      };

      mockWs.emit('message', Buffer.from(JSON.stringify(joinMessage)));
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = mockWs.getLastSentMessage();
      expect(response.type).toBe('room_joined');
      expect(response.messages).toHaveLength(1);
      expect(response.messages[0].content).toBe('Existing message');
    });

    it('should handle join_room without roomId', async () => {
      const mockWs = mockServer.simulateConnection();
      mockWs.clearSent();

      const joinMessage = {
        type: 'join_room',
      };

      mockWs.emit('message', Buffer.from(JSON.stringify(joinMessage)));
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = mockWs.getLastSentMessage();
      expect(response.type).toBe('error');
      expect(response.error).toBe('Room ID is required');
    });

    it('should handle leave_room message', async () => {
      const mockWs = mockServer.simulateConnection();

      // Join room first
      const joinMessage = {
        type: 'join_room',
        roomId: 'TEST1',
      };
      mockWs.emit('message', Buffer.from(JSON.stringify(joinMessage)));
      await new Promise((resolve) => setTimeout(resolve, 10));

      mockWs.clearSent();

      // Leave room
      const leaveMessage = {
        type: 'leave_room',
      };
      mockWs.emit('message', Buffer.from(JSON.stringify(leaveMessage)));
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = mockWs.getLastSentMessage();
      expect(response.type).toBe('room_left');
      expect(response.roomId).toBe('TEST1');
    });
  });

  describe('Message Handling', () => {
    it('should handle send_message and broadcast to room', async () => {
      const mockWs1 = mockServer.simulateConnection();
      const mockWs2 = mockServer.simulateConnection();

      // Both clients join the same room
      const joinMessage = {
        type: 'join_room',
        roomId: 'TEST1',
      };

      mockWs1.emit('message', Buffer.from(JSON.stringify(joinMessage)));
      mockWs2.emit('message', Buffer.from(JSON.stringify(joinMessage)));
      await new Promise((resolve) => setTimeout(resolve, 10));

      mockWs1.clearSent();
      mockWs2.clearSent();

      // Send message from first client
      const sendMessage = {
        type: 'send_message',
        content: 'Hello everyone!',
        author: 'User 1',
      };

      mockWs1.emit('message', Buffer.from(JSON.stringify(sendMessage)));
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Both clients should receive the message
      const response1 = mockWs1.getLastSentMessage();
      const response2 = mockWs2.getLastSentMessage();

      expect(response1.type).toBe('new_message');
      expect(response2.type).toBe('new_message');
      expect(response1.message.content).toBe('Hello everyone!');
      expect(response2.message.content).toBe('Hello everyone!');
      expect(response1.message.author).toBe('User 1');
    });

    it('should handle send_message without author', async () => {
      const mockWs = mockServer.simulateConnection();

      // Join room
      const joinMessage = {
        type: 'join_room',
        roomId: 'TEST1',
      };
      mockWs.emit('message', Buffer.from(JSON.stringify(joinMessage)));
      await new Promise((resolve) => setTimeout(resolve, 10));

      mockWs.clearSent();

      // Send message without author
      const sendMessage = {
        type: 'send_message',
        content: 'Anonymous message',
      };

      mockWs.emit('message', Buffer.from(JSON.stringify(sendMessage)));
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = mockWs.getLastSentMessage();
      expect(response.type).toBe('new_message');
      expect(response.message.content).toBe('Anonymous message');
      expect(response.message.author).toBeNull();
    });

    it('should handle send_message without content', async () => {
      const mockWs = mockServer.simulateConnection();

      // Join room
      const joinMessage = {
        type: 'join_room',
        roomId: 'TEST1',
      };
      mockWs.emit('message', Buffer.from(JSON.stringify(joinMessage)));
      await new Promise((resolve) => setTimeout(resolve, 10));

      mockWs.clearSent();

      // Send message without content
      const sendMessage = {
        type: 'send_message',
        author: 'User 1',
      };

      mockWs.emit('message', Buffer.from(JSON.stringify(sendMessage)));
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = mockWs.getLastSentMessage();
      expect(response.type).toBe('error');
      expect(response.error).toBe('Message content is required');
    });

    it('should handle send_message when not in room', async () => {
      const mockWs = mockServer.simulateConnection();
      mockWs.clearSent();

      const sendMessage = {
        type: 'send_message',
        content: 'Hello',
        author: 'User 1',
      };

      mockWs.emit('message', Buffer.from(JSON.stringify(sendMessage)));
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = mockWs.getLastSentMessage();
      expect(response.type).toBe('error');
      expect(response.error).toBe('Not connected to any room');
    });
  });

  describe('Message Broadcasting', () => {
    it('should only broadcast to clients in the same room', async () => {
      const mockWs1 = mockServer.simulateConnection();
      const mockWs2 = mockServer.simulateConnection();
      const mockWs3 = mockServer.simulateConnection();

      // Create another room
      await query({
        text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
        values: ['TEST2', 'Test Room 2'],
      });

      // Client 1 and 2 join room TEST1, client 3 joins room TEST2
      mockWs1.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'join_room',
            roomId: 'TEST1',
          })
        )
      );
      mockWs2.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'join_room',
            roomId: 'TEST1',
          })
        )
      );
      mockWs3.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'join_room',
            roomId: 'TEST2',
          })
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      mockWs1.clearSent();
      mockWs2.clearSent();
      mockWs3.clearSent();

      // Send message from room TEST1
      mockWs1.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'send_message',
            content: 'Message in TEST1',
            author: 'User 1',
          })
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Client 1 and 2 should receive the message, client 3 should not
      expect(mockWs1.getLastSentMessage().type).toBe('new_message');
      expect(mockWs2.getLastSentMessage().type).toBe('new_message');
      expect(mockWs3.sent).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON message', async () => {
      const mockWs = mockServer.simulateConnection();
      mockWs.clearSent();

      mockWs.emit('message', Buffer.from('invalid json'));
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = mockWs.getLastSentMessage();
      expect(response.type).toBe('error');
      expect(response.error).toBe('Invalid message format');
    });

    it('should handle unknown message type', async () => {
      const mockWs = mockServer.simulateConnection();
      mockWs.clearSent();

      const unknownMessage = {
        type: 'unknown_type',
      };

      mockWs.emit('message', Buffer.from(JSON.stringify(unknownMessage)));
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = mockWs.getLastSentMessage();
      expect(response.type).toBe('error');
      expect(response.error).toBe('Unknown message type');
    });

    it('should handle WebSocket errors', () => {
      const mockWs = mockServer.simulateConnection();

      const error = new Error('WebSocket error');
      mockWs.emit('error', error);

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('WebSocket error for client'),
        error
      );
    });
  });

  describe('Client Disconnection', () => {
    it('should handle client disconnection', async () => {
      const mockWs = mockServer.simulateConnection();

      // Join room
      const joinMessage = {
        type: 'join_room',
        roomId: 'TEST1',
      };
      mockWs.emit('message', Buffer.from(JSON.stringify(joinMessage)));
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Simulate disconnection
      mockWs.close();
      await new Promise((resolve) => setTimeout(resolve, 10));
      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('disconnected')
      );
    });

    it('should clean up room connections on disconnect', async () => {
      const mockWs1 = mockServer.simulateConnection();
      const mockWs2 = mockServer.simulateConnection();

      // Both join the same room
      const joinMessage = {
        type: 'join_room',
        roomId: 'TEST1',
      };

      mockWs1.emit('message', Buffer.from(JSON.stringify(joinMessage)));
      mockWs2.emit('message', Buffer.from(JSON.stringify(joinMessage)));
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Disconnect first client
      mockWs1.close();
      await new Promise((resolve) => setTimeout(resolve, 10));

      mockWs2.clearSent();

      // Send message from remaining client
      mockWs2.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'send_message',
            content: 'Message after disconnect',
            author: 'User 2',
          })
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 10));

      // Only the remaining client should receive the message
      expect(mockWs2.getLastSentMessage().type).toBe('new_message');
      expect(mockWs1.sent.length).toBe(2);
      // Only initial connection + join messages
    });
  });

  describe('Database Integration', () => {
    it('should persist messages to database', async () => {
      const mockWs = mockServer.simulateConnection();

      // Join room
      const joinMessage = {
        type: 'join_room',
        roomId: 'TEST1',
      };
      mockWs.emit('message', Buffer.from(JSON.stringify(joinMessage)));
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Send message
      const sendMessage = {
        type: 'send_message',
        content: 'Test message for database',
        author: 'Test User',
      };

      mockWs.emit('message', Buffer.from(JSON.stringify(sendMessage)));
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Check database
      const result = await query({
        text: 'SELECT * FROM messages WHERE room_id = $1',
        values: ['TEST1'],
      });

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].content).toBe('Test message for database');
      expect(result.rows[0].author).toBe('Test User');
    });

    it('should return saved message with correct ID in broadcast', async () => {
      const mockWs = mockServer.simulateConnection();

      // Join room
      mockWs.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'join_room',
            roomId: 'TEST1',
          })
        )
      );
      await new Promise((resolve) => setTimeout(resolve, 10));

      mockWs.clearSent();

      // Send message
      mockWs.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'send_message',
            content: 'Message with ID',
            author: 'Test User',
          })
        )
      );
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = mockWs.getLastSentMessage();
      expect(response.type).toBe('new_message');
      expect(response.message.id).toBeDefined();
      expect(typeof response.message.id).toBe('number');
      expect(response.message.content).toBe('Message with ID');
    });
  });

  describe('Room Switching', () => {
    it('should handle switching between rooms', async () => {
      // Create second room
      await query({
        text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
        values: ['TEST2', 'Test Room 2'],
      });

      const mockWs = mockServer.simulateConnection();

      // Join first room
      mockWs.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'join_room',
            roomId: 'TEST1',
          })
        )
      );
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = mockWs.getLastSentMessage();
      expect(response.type).toBe('room_joined');
      expect(response.roomId).toBe('TEST1');

      // Join second room (should leave first room)
      mockWs.emit(
        'message',
        Buffer.from(
          JSON.stringify({
            type: 'join_room',
            roomId: 'TEST2',
          })
        )
      );
      await new Promise((resolve) => setTimeout(resolve, 10));

      const messages = mockWs.getSentMessages();
      const lastTwo = messages.slice(-2);

      expect(lastTwo[0].type).toBe('room_left');
      expect(lastTwo[0].roomId).toBe('TEST1');
      expect(lastTwo[1].type).toBe('room_joined');
      expect(lastTwo[1].roomId).toBe('TEST2');
    });
  });
});
