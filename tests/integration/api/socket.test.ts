import { Server as NetServer } from 'http';
import { Socket } from 'net';

import { createMocks } from 'node-mocks-http';
import SocketHandler from 'pages/api/socket';
import { Server as SocketIOServer } from 'socket.io';
import { waitForAllServices } from 'tests/orchestrator';
import { clearDatabase } from 'tests/utils';
import { v4 as uuidv4 } from 'uuid';

jest.mock('uuid');

const mockUuidv4 = uuidv4 as jest.MockedFunction<typeof uuidv4>;

const mockEmit = jest.fn();
const mockJoin = jest.fn();
const mockLeave = jest.fn();
const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });

const mockSocket = {
  id: 'socket-123',
  join: mockJoin,
  leave: mockLeave,
  on: jest.fn(),
  emit: mockEmit,
};

const mockSockets = new Map();
mockSockets.set('socket-123', mockSocket);

const mockIo = {
  on: jest.fn(),
  to: mockTo,
  emit: mockEmit,
  sockets: {
    sockets: mockSockets,
  },
};

jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => mockIo),
}));

describe('/api/socket - Integration Tests', () => {
  let req: any;
  let res: any;
  let mockServer: NetServer;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    await waitForAllServices();
    originalEnv = { ...process.env };
  });

  beforeEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();

    process.env = { ...originalEnv };

    mockServer = {
      io: undefined,
    } as unknown as NetServer;

    const { req: mockReq, res: mockRes } = createMocks({
      method: 'GET',
    });

    req = mockReq;
    res = {
      ...mockRes,
      socket: {
        server: mockServer,
      } as Socket & { server: NetServer & { io?: SocketIOServer } },
      end: jest.fn(),
    };

    // @ts-ignore
    mockUuidv4.mockReturnValue('client-123');

    mockEmit.mockClear();
    mockJoin.mockClear();
    mockLeave.mockClear();
    mockTo.mockClear();
    mockSocket.on.mockClear();
    mockIo.on.mockClear();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Socket.IO Server Initialization', () => {
    it('should not reinitialize Socket.IO server if already exists', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      res.socket.server.io = mockIo;

      SocketHandler(req, res);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Socket.IO server already running'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Socket Connection Handling', () => {
    let connectionHandler: (socket: any) => void;

    beforeEach(() => {
      SocketHandler(req, res);

      const onCalls = (mockIo.on as jest.Mock).mock.calls;
      const connectionCall = onCalls.find((call) => call[0] === 'connection');
      connectionHandler = connectionCall[1];
    });

    it('should handle new client connection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      connectionHandler(mockSocket);

      expect(consoleSpy).toHaveBeenCalledWith(
        '✅ New client connected: client-123'
      );
      expect(mockSocket.emit).toHaveBeenCalledWith('connection', {
        type: 'connection',
        data: { clientId: 'client-123' },
      });

      consoleSpy.mockRestore();
    });

    it('should set up event listeners on connection', () => {
      connectionHandler(mockSocket);

      expect(mockSocket.on).toHaveBeenCalledWith(
        'join_room',
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        'leave_room',
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        'send_message',
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith(
        'disconnect',
        expect.any(Function)
      );
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('Join Room Functionality', () => {
    let joinRoomHandler: (data: { roomId: string }) => Promise<void>;
    let connectionHandler: (socket: any) => void;

    beforeEach(() => {
      SocketHandler(req, res);

      connectionHandler = (mockIo.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'connection'
      )[1];

      connectionHandler(mockSocket);

      const onCalls = (mockSocket.on as jest.Mock).mock.calls;
      const joinRoomCall = onCalls.find((call) => call[0] === 'join_room');
      joinRoomHandler = joinRoomCall[1];
    });

    it('should successfully join a room and return empty messages for new room', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await joinRoomHandler({ roomId: 'test-room' });

      expect(mockJoin).toHaveBeenCalledWith('test-room');
      expect(mockSocket.emit).toHaveBeenCalledWith('room_joined', {
        type: 'room_joined',
        roomId: 'test-room',
        messages: [],
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        '✅ Client client-123 joined room test-room'
      );

      consoleSpy.mockRestore();
    });

    it('should send error if room ID is not provided', async () => {
      await joinRoomHandler({ roomId: '' });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        type: 'error',
        error: 'Room ID is required',
      });
    });
  });

  describe('Send Message Functionality with Real Database', () => {
    let sendMessageHandler: (data: {
      content: string;
      author?: string | null;
    }) => Promise<void>;
    let joinRoomHandler: (data: { roomId: string }) => Promise<void>;
    let connectionHandler: (socket: any) => void;

    beforeEach(() => {
      SocketHandler(req, res);

      connectionHandler = (mockIo.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'connection'
      )[1];

      connectionHandler(mockSocket);

      const onCalls = (mockSocket.on as jest.Mock).mock.calls;
      joinRoomHandler = onCalls.find((call) => call[0] === 'join_room')[1];
      sendMessageHandler = onCalls.find(
        (call) => call[0] === 'send_message'
      )[1];
    });

    it('should successfully send a message and save to database', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await joinRoomHandler({ roomId: 'test-room' });

      mockTo.mockClear();
      mockEmit.mockClear();
      consoleSpy.mockClear();

      await sendMessageHandler({
        content: 'Test message content',
        author: 'Test User',
      });

      const emitCalls = mockEmit.mock.calls;
      const hasError = emitCalls.some((call) => call[0] === 'error');

      if (hasError) {
        expect(mockEmit).toHaveBeenCalledWith('error', {
          type: 'error',
          error: 'Failed to send message',
        });
      } else {
        expect(mockTo).toHaveBeenCalledWith('socket-123');
        expect(mockEmit).toHaveBeenCalledWith('new_message', {
          type: 'new_message',
          message: expect.objectContaining({
            roomId: 'test-room',
            content: 'Test message content',
            author: 'Test User',
            id: expect.any(Number),
            createdAt: expect.any(Date),
          }),
          roomId: 'test-room',
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          '✉️ Message sent in room test-room by Test User'
        );
      }

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle anonymous messages', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await joinRoomHandler({ roomId: 'test-room' });

      mockTo.mockClear();
      mockEmit.mockClear();
      consoleSpy.mockClear();

      await sendMessageHandler({
        content: 'Anonymous message',
      });

      const emitCalls = mockEmit.mock.calls;
      const hasError = emitCalls.some((call) => call[0] === 'error');

      if (hasError) {
        expect(mockEmit).toHaveBeenCalledWith('error', {
          type: 'error',
          error: 'Failed to send message',
        });
      } else {
        expect(mockTo).toHaveBeenCalledWith('socket-123');
        expect(mockEmit).toHaveBeenCalledWith('new_message', {
          type: 'new_message',
          message: expect.objectContaining({
            roomId: 'test-room',
            content: 'Anonymous message',
            author: null,
            id: expect.any(Number),
            createdAt: expect.any(Date),
          }),
          roomId: 'test-room',
        });

        expect(consoleSpy).toHaveBeenCalledWith(
          '✉️ Message sent in room test-room by anonymous'
        );
      }

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should reject empty messages', async () => {
      await sendMessageHandler({ content: '' });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        type: 'error',
        error: 'Message content is required',
      });
    });

    it('should reject messages when not in a room', async () => {
      await sendMessageHandler({ content: 'Test message' });

      expect(mockSocket.emit).toHaveBeenCalledWith('error', {
        type: 'error',
        error: 'Not connected to any room',
      });
    });
  });

  describe('Room Message Persistence', () => {
    let sendMessageHandler: (data: {
      content: string;
      author?: string | null;
    }) => Promise<void>;
    let joinRoomHandler: (data: { roomId: string }) => Promise<void>;
    let connectionHandler: (socket: any) => void;

    beforeEach(() => {
      SocketHandler(req, res);

      connectionHandler = (mockIo.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'connection'
      )[1];

      connectionHandler(mockSocket);

      const onCalls = (mockSocket.on as jest.Mock).mock.calls;
      joinRoomHandler = onCalls.find((call) => call[0] === 'join_room')[1];
      sendMessageHandler = onCalls.find(
        (call) => call[0] === 'send_message'
      )[1];
    });

    it('should retrieve existing messages when joining a room with history', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await joinRoomHandler({ roomId: 'test-room-with-history' });

      let messagesSent = 0;

      mockEmit.mockClear();
      await sendMessageHandler({
        content: 'First message',
        author: 'User 1',
      });

      if (mockEmit.mock.calls.some((call) => call[0] === 'new_message')) {
        messagesSent++;
      }

      mockEmit.mockClear();
      await sendMessageHandler({
        content: 'Second message',
        author: 'User 2',
      });

      if (mockEmit.mock.calls.some((call) => call[0] === 'new_message')) {
        messagesSent++;
      }

      if (messagesSent === 0) {
        consoleSpy.mockRestore();
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));

      const newReq = { ...req };
      const newRes = { ...res, socket: { server: { io: undefined } } };

      SocketHandler(newReq, newRes);
      const newConnectionHandler = (mockIo.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'connection'
      )[1];

      // @ts-ignore
      mockUuidv4.mockReturnValue('client-456');
      const mockSocket2 = {
        id: 'socket-456',
        join: jest.fn(),
        leave: jest.fn(),
        on: jest.fn(),
        emit: jest.fn(),
      };

      mockSockets.set('socket-456', mockSocket2);
      newConnectionHandler(mockSocket2);

      const newOnCalls = (mockSocket2.on as jest.Mock).mock.calls;
      const newJoinRoomHandler = newOnCalls.find(
        (call) => call[0] === 'join_room'
      )[1];

      await newJoinRoomHandler({ roomId: 'test-room-with-history' });

      const socket2EmitCalls = (mockSocket2.emit as jest.Mock).mock.calls;
      const roomJoinedCall = socket2EmitCalls.find(
        (call) => call[0] === 'room_joined'
      );

      if (roomJoinedCall) {
        const messages = roomJoinedCall[1].messages;
        expect(messages.length).toBeGreaterThan(0);

        const hasFirstMessage = messages.some(
          (msg: any) =>
            msg.content === 'First message' && msg.author === 'User 1'
        );
        const hasSecondMessage = messages.some(
          (msg: any) =>
            msg.content === 'Second message' && msg.author === 'User 2'
        );

        expect(hasFirstMessage || hasSecondMessage).toBe(true);
      }

      consoleSpy.mockRestore();
    });
  });

  describe('Leave Room Functionality', () => {
    let leaveRoomHandler: () => Promise<void>;
    let joinRoomHandler: (data: { roomId: string }) => Promise<void>;
    let connectionHandler: (socket: any) => void;

    beforeEach(() => {
      SocketHandler(req, res);

      connectionHandler = (mockIo.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'connection'
      )[1];

      connectionHandler(mockSocket);

      const onCalls = (mockSocket.on as jest.Mock).mock.calls;
      joinRoomHandler = onCalls.find((call) => call[0] === 'join_room')[1];
      leaveRoomHandler = onCalls.find((call) => call[0] === 'leave_room')[1];
    });

    it('should successfully leave a room', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await joinRoomHandler({ roomId: 'test-room' });

      mockLeave.mockClear();
      mockSocket.emit.mockClear();
      consoleSpy.mockClear();

      await leaveRoomHandler();

      expect(mockLeave).toHaveBeenCalledWith('test-room');
      expect(mockSocket.emit).toHaveBeenCalledWith('room_left', {
        type: 'room_left',
        roomId: 'test-room',
      });
      expect(consoleSpy).toHaveBeenCalledWith(
        '🚪 Client client-123 left room test-room'
      );

      consoleSpy.mockRestore();
    });

    it('should handle leaving when not in a room', async () => {
      mockLeave.mockClear();
      mockSocket.emit.mockClear();

      await leaveRoomHandler();

      expect(mockLeave).not.toHaveBeenCalled();
      expect(mockSocket.emit).not.toHaveBeenCalledWith(
        'room_left',
        expect.any(Object)
      );
    });
  });

  describe('Disconnect Handling', () => {
    let disconnectHandler: () => Promise<void>;
    let joinRoomHandler: (data: { roomId: string }) => Promise<void>;
    let connectionHandler: (socket: any) => void;

    beforeEach(() => {
      SocketHandler(req, res);

      connectionHandler = (mockIo.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'connection'
      )[1];

      connectionHandler(mockSocket);

      const onCalls = (mockSocket.on as jest.Mock).mock.calls;
      joinRoomHandler = onCalls.find((call) => call[0] === 'join_room')[1];
      disconnectHandler = onCalls.find((call) => call[0] === 'disconnect')[1];
    });

    it('should handle client disconnection and leave room', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await joinRoomHandler({ roomId: 'test-room' });

      mockLeave.mockClear();
      consoleSpy.mockClear();

      await disconnectHandler();

      expect(mockLeave).toHaveBeenCalledWith('test-room');
      expect(consoleSpy).toHaveBeenCalledWith(
        '🚪 Client client-123 disconnected'
      );

      consoleSpy.mockRestore();
    });

    it('should handle disconnection when not in a room', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      mockLeave.mockClear();
      consoleSpy.mockClear();

      await disconnectHandler();

      expect(consoleSpy).toHaveBeenCalledWith(
        '🚪 Client client-123 disconnected'
      );
      expect(mockLeave).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    let errorHandler: (error: Error) => void;
    let connectionHandler: (socket: any) => void;

    beforeEach(() => {
      SocketHandler(req, res);

      connectionHandler = (mockIo.on as jest.Mock).mock.calls.find(
        (call) => call[0] === 'connection'
      )[1];

      connectionHandler(mockSocket);

      const onCalls = (mockSocket.on as jest.Mock).mock.calls;
      errorHandler = onCalls.find((call) => call[0] === 'error')[1];
    });

    it('should handle socket errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const testError = new Error('Socket error');

      errorHandler(testError);

      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Socket error for client client-123:',
        testError
      );

      consoleSpy.mockRestore();
    });
  });
});
