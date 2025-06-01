import { insertMessage } from 'src/backend/database';
import { getRoomMessages } from 'src/backend/database/get-room-messages';
import { MessageData } from 'src/constants/types';
import { query } from 'src/integrations/database';
import { waitForAllServices } from 'tests/orchestrator';

describe('getRoomMessages', () => {
  beforeAll(async () => {
    await waitForAllServices();
  });

  beforeEach(async () => {
    await query({ text: 'DELETE FROM messages', values: [] });
    await query({ text: 'DELETE FROM rooms', values: [] });

    await query({
      text: 'INSERT INTO rooms (id, name) VALUES ($1, $2), ($3, $4)',
      values: ['TEST1', 'Test Room 1', 'TEST2', 'Test Room 2'],
    });
  });

  it('should return empty array for room with no messages', async () => {
    const result = await getRoomMessages('TEST1');

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return messages in chronological order (oldest first)', async () => {
    const message1: MessageData = {
      roomId: 'TEST1',
      content: 'First message',
      author: 'User 1',
      createdAt: new Date('2023-01-01T10:00:00Z'),
    };

    const message2: MessageData = {
      roomId: 'TEST1',
      content: 'Second message',
      author: 'User 2',
      createdAt: new Date('2023-01-01T10:01:00Z'),
    };

    const message3: MessageData = {
      roomId: 'TEST1',
      content: 'Third message',
      author: 'User 3',
      createdAt: new Date('2023-01-01T10:02:00Z'),
    };

    await insertMessage(message1);
    await insertMessage(message2);
    await insertMessage(message3);

    const result = await getRoomMessages('TEST1');

    expect(result).toHaveLength(3);
    expect(result[0].content).toBe('First message');
    expect(result[1].content).toBe('Second message');
    expect(result[2].content).toBe('Third message');

    expect(result[0].createdAt.getTime()).toBeLessThan(
      result[1].createdAt.getTime()
    );
    expect(result[1].createdAt.getTime()).toBeLessThan(
      result[2].createdAt.getTime()
    );
  });

  it('should respect the limit parameter', async () => {
    for (let i = 1; i <= 5; i++) {
      const messageData: MessageData = {
        roomId: 'TEST1',
        content: `Message ${i}`,
        author: `User ${i}`,
        createdAt: new Date(`2023-01-01T10:0${i}:00Z`),
      };
      await insertMessage(messageData);
    }

    const result = await getRoomMessages('TEST1', 3);

    expect(result).toHaveLength(3);
    expect(result[0].content).toBe('Message 3');
    expect(result[1].content).toBe('Message 4');
    expect(result[2].content).toBe('Message 5');
  });

  it('should use default limit of 50 when not specified', async () => {
    for (let i = 1; i <= 60; i++) {
      const messageData: MessageData = {
        roomId: 'TEST1',
        content: `Message ${i}`,
        author: `User ${i}`,
        createdAt: new Date(
          `2023-01-01T${String(10 + Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z`
        ),
      };
      await insertMessage(messageData);
    }

    const result = await getRoomMessages('TEST1');

    expect(result).toHaveLength(50);
    expect(result[0].content).toBe('Message 11');
    expect(result[49].content).toBe('Message 60');
  });

  it('should only return messages from the specified room', async () => {
    const message1: MessageData = {
      roomId: 'TEST1',
      content: 'Message in room 1',
      author: 'User 1',
      createdAt: new Date('2023-01-01T10:00:00Z'),
    };

    const message2: MessageData = {
      roomId: 'TEST2',
      content: 'Message in room 2',
      author: 'User 2',
      createdAt: new Date('2023-01-01T10:01:00Z'),
    };

    const message3: MessageData = {
      roomId: 'TEST1',
      content: 'Another message in room 1',
      author: 'User 3',
      createdAt: new Date('2023-01-01T10:02:00Z'),
    };

    await insertMessage(message1);
    await insertMessage(message2);
    await insertMessage(message3);

    const room1Messages = await getRoomMessages('TEST1');
    const room2Messages = await getRoomMessages('TEST2');

    expect(room1Messages).toHaveLength(2);
    expect(room2Messages).toHaveLength(1);

    expect(room1Messages[0].content).toBe('Message in room 1');
    expect(room1Messages[1].content).toBe('Another message in room 1');
    expect(room2Messages[0].content).toBe('Message in room 2');

    room1Messages.forEach((msg) => expect(msg.roomId).toBe('TEST1'));
    room2Messages.forEach((msg) => expect(msg.roomId).toBe('TEST2'));
  });

  it('should handle messages with null authors', async () => {
    const messageWithAuthor: MessageData = {
      roomId: 'TEST1',
      content: 'Message with author',
      author: 'John Doe',
      createdAt: new Date('2023-01-01T10:00:00Z'),
    };

    const messageWithoutAuthor: MessageData = {
      roomId: 'TEST1',
      content: 'Anonymous message',
      author: null,
      createdAt: new Date('2023-01-01T10:01:00Z'),
    };

    await insertMessage(messageWithAuthor);
    await insertMessage(messageWithoutAuthor);

    const result = await getRoomMessages('TEST1');

    expect(result).toHaveLength(2);
    expect(result[0].author).toBe('John Doe');
    expect(result[1].author).toBeNull();
  });

  it('should return messages with correct data types', async () => {
    const messageData: MessageData = {
      roomId: 'TEST1',
      content: 'Test message',
      author: 'Test User',
      createdAt: new Date('2023-01-01T10:00:00Z'),
    };

    await insertMessage(messageData);
    const result = await getRoomMessages('TEST1');

    expect(result).toHaveLength(1);
    const message = result[0];

    expect(typeof message.id).toBe('number');
    expect(typeof message.roomId).toBe('string');
    expect(typeof message.content).toBe('string');
    expect(typeof message.author).toBe('string');
    expect(message.createdAt).toBeInstanceOf(Date);
  });

  it('should handle special characters in message content', async () => {
    const messageData: MessageData = {
      roomId: 'TEST1',
      content: 'Message with \'quotes\', "double quotes", & symbols! 🎉',
      author: 'Test User',
      createdAt: new Date('2023-01-01T10:00:00Z'),
    };

    await insertMessage(messageData);
    const result = await getRoomMessages('TEST1');

    expect(result).toHaveLength(1);
    expect(result[0].content).toBe(
      'Message with \'quotes\', "double quotes", & symbols! 🎉'
    );
  });

  it('should return empty array for non-existent room', async () => {
    const result = await getRoomMessages('NONEXISTENT');

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle limit of 0', async () => {
    const messageData: MessageData = {
      roomId: 'TEST1',
      content: 'Test message',
      author: 'Test User',
      createdAt: new Date('2023-01-01T10:00:00Z'),
    };

    await insertMessage(messageData);
    const result = await getRoomMessages('TEST1', 0);

    expect(result).toEqual([]);
  });

  it('should handle large limit values', async () => {
    for (let i = 1; i <= 3; i++) {
      const messageData: MessageData = {
        roomId: 'TEST1',
        content: `Message ${i}`,
        author: `User ${i}`,
        createdAt: new Date(`2023-01-01T10:0${i}:00Z`),
      };
      await insertMessage(messageData);
    }

    const result = await getRoomMessages('TEST1', 1000);

    expect(result).toHaveLength(3);
    expect(result[0].content).toBe('Message 1');
    expect(result[1].content).toBe('Message 2');
    expect(result[2].content).toBe('Message 3');
  });

  it('should maintain correct order with same timestamps', async () => {
    const sameTimestamp = new Date('2023-01-01T10:00:00Z');

    for (let i = 1; i <= 3; i++) {
      const messageData: MessageData = {
        roomId: 'TEST1',
        content: `Message ${i}`,
        author: `User ${i}`,
        createdAt: sameTimestamp,
      };
      await insertMessage(messageData);
    }

    const result = await getRoomMessages('TEST1');

    expect(result).toHaveLength(3);
    expect(result[0].content).toBe('Message 1');
    expect(result[1].content).toBe('Message 2');
    expect(result[2].content).toBe('Message 3');
  });
});
