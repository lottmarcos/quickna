import { insertMessage } from 'src/backend/database/insert-message';
import { MessageData } from 'src/constants/types';
import { query } from 'src/integrations/database';
import { waitForAllServices } from 'tests/orchestrator';

describe('insertMessage', () => {
  beforeAll(async () => {
    await waitForAllServices();
  });

  beforeEach(async () => {
    await query({ text: 'DELETE FROM messages', values: [] });
    await query({ text: 'DELETE FROM rooms', values: [] });

    await query({
      text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
      values: ['TEST1', 'Test Room'],
    });
  });

  it('should insert a message successfully with author', async () => {
    const messageData: MessageData = {
      roomId: 'TEST1',
      content: 'Hello, world!',
      author: 'John Doe',
      createdAt: new Date('2023-01-01T10:00:00Z'),
    };

    const result = await insertMessage(messageData);

    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.roomId).toBe(messageData.roomId);
    expect(result.content).toBe(messageData.content);
    expect(result.author).toBe(messageData.author);
    expect(result.createdAt).toEqual(messageData.createdAt);

    const checkSql = 'SELECT * FROM messages WHERE id = $1';
    const checkResult = await query({ text: checkSql, values: [result.id] });

    expect(checkResult.rows).toHaveLength(1);
    expect(checkResult.rows[0].room_id).toBe(messageData.roomId);
    expect(checkResult.rows[0].content).toBe(messageData.content);
    expect(checkResult.rows[0].author).toBe(messageData.author);
  });

  it('should insert a message successfully without author (null)', async () => {
    const messageData: MessageData = {
      roomId: 'TEST1',
      content: 'Anonymous message',
      author: null,
      createdAt: new Date('2023-01-01T10:00:00Z'),
    };

    const result = await insertMessage(messageData);

    expect(result.id).toBeDefined();
    expect(result.roomId).toBe(messageData.roomId);
    expect(result.content).toBe(messageData.content);
    expect(result.author).toBeNull();
    expect(result.createdAt).toEqual(messageData.createdAt);

    const checkSql = 'SELECT author FROM messages WHERE id = $1';
    const checkResult = await query({ text: checkSql, values: [result.id] });

    expect(checkResult.rows[0].author).toBeNull();
  });

  it('should handle message content with special characters', async () => {
    const messageData: MessageData = {
      roomId: 'TEST1',
      content: 'Message with \'quotes\', "double quotes", & symbols! 🎉',
      author: 'Test User',
      createdAt: new Date('2023-01-01T10:00:00Z'),
    };

    const result = await insertMessage(messageData);

    expect(result.content).toBe(messageData.content);

    const checkSql = 'SELECT content FROM messages WHERE id = $1';
    const checkResult = await query({ text: checkSql, values: [result.id] });

    expect(checkResult.rows[0].content).toBe(messageData.content);
  });

  it('should handle long message content', async () => {
    const longContent = 'A'.repeat(1000);
    const messageData: MessageData = {
      roomId: 'TEST1',
      content: longContent,
      author: 'Test User',
      createdAt: new Date('2023-01-01T10:00:00Z'),
    };

    const result = await insertMessage(messageData);

    expect(result.content).toBe(longContent);
    expect(result.content.length).toBe(1000);
  });

  it('should handle empty message content', async () => {
    const messageData: MessageData = {
      roomId: 'TEST1',
      content: '',
      author: 'Test User',
      createdAt: new Date('2023-01-01T10:00:00Z'),
    };

    const result = await insertMessage(messageData);

    expect(result.content).toBe('');
  });

  it('should handle different date formats correctly', async () => {
    const testDate = new Date('2023-12-25T15:30:45.123Z');
    const messageData: MessageData = {
      roomId: 'TEST1',
      content: 'Christmas message',
      author: 'Santa',
      createdAt: testDate,
    };

    const result = await insertMessage(messageData);

    expect(result.createdAt).toEqual(testDate);
  });

  it('should auto-increment message IDs for multiple messages', async () => {
    const messageData1: MessageData = {
      roomId: 'TEST1',
      content: 'First message',
      author: 'User 1',
      createdAt: new Date('2023-01-01T10:00:00Z'),
    };

    const messageData2: MessageData = {
      roomId: 'TEST1',
      content: 'Second message',
      author: 'User 2',
      createdAt: new Date('2023-01-01T10:01:00Z'),
    };

    const result1 = await insertMessage(messageData1);
    const result2 = await insertMessage(messageData2);

    expect(result2.id).toBeGreaterThan(result1.id);
    expect(result2.id).toBe(result1.id + 1);
  });

  it('should throw error for non-existent room ID (foreign key constraint)', async () => {
    const messageData: MessageData = {
      roomId: 'INVALID',
      content: 'This should fail',
      author: 'Test User',
      createdAt: new Date('2023-01-01T10:00:00Z'),
    };

    await expect(insertMessage(messageData)).rejects.toThrow();
  });

  it('should handle messages from different rooms', async () => {
    await query({
      text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
      values: ['TEST2', 'Test Room 2'],
    });

    const messageData1: MessageData = {
      roomId: 'TEST1',
      content: 'Message in room 1',
      author: 'User 1',
      createdAt: new Date('2023-01-01T10:00:00Z'),
    };

    const messageData2: MessageData = {
      roomId: 'TEST2',
      content: 'Message in room 2',
      author: 'User 2',
      createdAt: new Date('2023-01-01T10:01:00Z'),
    };

    const result1 = await insertMessage(messageData1);
    const result2 = await insertMessage(messageData2);

    expect(result1.roomId).toBe('TEST1');
    expect(result2.roomId).toBe('TEST2');
    expect(result1.content).toBe('Message in room 1');
    expect(result2.content).toBe('Message in room 2');
  });

  it('should return all fields with correct types', async () => {
    const messageData: MessageData = {
      roomId: 'TEST1',
      content: 'Type check message',
      author: 'Type Checker',
      createdAt: new Date('2023-01-01T10:00:00Z'),
    };

    const result = await insertMessage(messageData);

    expect(typeof result.id).toBe('number');
    expect(typeof result.roomId).toBe('string');
    expect(typeof result.content).toBe('string');
    expect(typeof result.author).toBe('string');
    expect(result.createdAt).toBeInstanceOf(Date);
  });

  it('should handle author field with various string lengths', async () => {
    const testCases = [
      'A',
      'John Doe',
      'Very Long Username That Might Be Used In Some Systems',
    ];

    for (const author of testCases) {
      const messageData: MessageData = {
        roomId: 'TEST1',
        content: `Message from ${author}`,
        author,
        createdAt: new Date(),
      };

      const result = await insertMessage(messageData);
      expect(result.author).toBe(author);
    }
  });
});
