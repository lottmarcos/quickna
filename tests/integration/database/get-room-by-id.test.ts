import { getRoomById } from 'src/backend/database/get-room-by-id';
import { query } from 'src/integrations/database';
import { waitForAllServices } from 'tests/orchestrator';

describe('getRoomById', () => {
  beforeAll(async () => {
    await waitForAllServices();
  });

  beforeEach(async () => {
    await query({ text: 'DELETE FROM rooms', values: [] });
  });

  it('should return room data for existing room', async () => {
    const roomId = 'ABC12';
    const roomName = 'Test Room';
    const createdAt = new Date('2023-01-01T10:00:00Z');

    await query({
      text: 'INSERT INTO rooms (id, name, created_at) VALUES ($1, $2, $3)',
      values: [roomId, roomName, createdAt],
    });

    const result = await getRoomById(roomId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(roomId);
    expect(result!.name).toBe(roomName);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.created_at.getTime()).toBe(createdAt.getTime());
  });

  it('should return null for non-existent room with valid 5-character ID', async () => {
    const result = await getRoomById('NONE1');

    expect(result).toBeNull();
  });

  it('should throw error for room ID not exactly 5 characters', async () => {
    await expect(getRoomById('TOOLONG')).rejects.toThrow(
      'Room ID must be exactly 5 characters long'
    );
    await expect(getRoomById('SHRT')).rejects.toThrow(
      'Room ID must be exactly 5 characters long'
    );
    await expect(getRoomById('')).rejects.toThrow(
      'Room ID must be exactly 5 characters long'
    );
    await expect(getRoomById('A')).rejects.toThrow(
      'Room ID must be exactly 5 characters long'
    );
  });

  it('should return correct data types', async () => {
    const roomId = 'ABC12';
    const roomName = 'Test Room';

    await query({
      text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
      values: [roomId, roomName],
    });

    const result = await getRoomById(roomId);

    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('string');
    expect(typeof result!.name).toBe('string');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should handle room names with special characters', async () => {
    const roomId = 'ABC12';
    const roomName =
      'Test Room with \'quotes\', "double quotes", & symbols! 🎉';

    await query({
      text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
      values: [roomId, roomName],
    });

    const result = await getRoomById(roomId);

    expect(result).not.toBeNull();
    expect(result!.name).toBe(roomName);
  });

  it('should handle empty room name', async () => {
    const roomId = 'ABC12';
    const roomName = '';

    await query({
      text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
      values: [roomId, roomName],
    });

    const result = await getRoomById(roomId);

    expect(result).not.toBeNull();
    expect(result!.name).toBe('');
  });

  it('should handle valid 5-character room IDs with different formats', async () => {
    const testCases = [
      { id: 'ABC12', name: 'Alphanumeric ID' },
      { id: '12345', name: 'Numeric ID' },
      { id: 'MIXD3', name: 'Mixed characters' },
      { id: 'UPPER', name: 'All uppercase' },
      { id: 'lower', name: 'All lowercase' },
    ];

    for (const testCase of testCases) {
      await query({
        text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
        values: [testCase.id, testCase.name],
      });
    }

    for (const testCase of testCases) {
      const result = await getRoomById(testCase.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(testCase.id);
      expect(result!.name).toBe(testCase.name);
    }
  });

  it('should return only the specified room among multiple rooms', async () => {
    const rooms = [
      { id: 'ROOM1', name: 'First Room' },
      { id: 'ROOM2', name: 'Second Room' },
      { id: 'ROOM3', name: 'Third Room' },
    ];

    for (const room of rooms) {
      await query({
        text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
        values: [room.id, room.name],
      });
    }

    const result = await getRoomById('ROOM2');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('ROOM2');
    expect(result!.name).toBe('Second Room');
  });

  it('should handle case-sensitive room IDs', async () => {
    const roomIds = ['ABC12', 'abc12', 'AbC12'];

    for (let i = 0; i < roomIds.length; i++) {
      await query({
        text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
        values: [roomIds[i], `Room ${i + 1}`],
      });
    }

    const result1 = await getRoomById('ABC12');
    const result2 = await getRoomById('abc12');
    const result3 = await getRoomById('AbC12');

    expect(result1!.name).toBe('Room 1');
    expect(result2!.name).toBe('Room 2');
    expect(result3!.name).toBe('Room 3');
  });

  it('should throw error for room ID with whitespace (making it not 5 chars)', async () => {
    const roomId = 'ABC12';
    const roomName = 'Test Room';

    await query({
      text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
      values: [roomId, roomName],
    });

    const result1 = await getRoomById('ABC12');
    expect(result1).not.toBeNull();

    await expect(getRoomById(' ABC12 ')).rejects.toThrow(
      'Room ID must be exactly 5 characters long'
    );
    await expect(getRoomById(' ABC12')).rejects.toThrow(
      'Room ID must be exactly 5 characters long'
    );
    await expect(getRoomById('ABC12 ')).rejects.toThrow(
      'Room ID must be exactly 5 characters long'
    );
  });

  it('should handle long room names within database limits', async () => {
    const roomId = 'ABC12';
    const longRoomName = 'A'.repeat(250);

    await query({
      text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
      values: [roomId, longRoomName],
    });

    const result = await getRoomById(roomId);

    expect(result).not.toBeNull();
    expect(result!.name).toBe(longRoomName);
    expect(result!.name.length).toBe(250);
  });

  it('should handle rooms with default created_at values', async () => {
    const roomId = 'ABC12';
    const roomName = 'Test Room';

    await query({
      text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
      values: [roomId, roomName],
    });

    const result = await getRoomById(roomId);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(roomId);
    expect(result!.name).toBe(roomName);
    expect(result!.created_at).toBeInstanceOf(Date);
    const now = new Date();
    const diffInMs = Math.abs(now.getTime() - result!.created_at.getTime());
    expect(diffInMs).toBeLessThan(60000);
  });

  it('should maintain data integrity across multiple calls', async () => {
    const roomId = 'ABC12';
    const roomName = 'Test Room';

    await query({
      text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
      values: [roomId, roomName],
    });

    const result1 = await getRoomById(roomId);
    const result2 = await getRoomById(roomId);
    const result3 = await getRoomById(roomId);

    expect(result1).toEqual(result2);
    expect(result2).toEqual(result3);
    expect(result1!.id).toBe(roomId);
    expect(result1!.name).toBe(roomName);
  });

  it('should handle database errors gracefully by throwing', async () => {
    await expect(getRoomById('')).rejects.toThrow(
      'Room ID must be exactly 5 characters long'
    );

    const result = await getRoomById('AAAAA');
    expect(result).toBeNull();
  });

  it('should return complete room object structure', async () => {
    const roomId = 'ABC12';
    const roomName = 'Test Room';

    await query({
      text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
      values: [roomId, roomName],
    });

    const result = await getRoomById(roomId);

    expect(result).not.toBeNull();

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('name');
    expect(result).toHaveProperty('created_at');

    const expectedKeys = ['id', 'name', 'created_at'];
    const actualKeys = Object.keys(result!);
    expect(actualKeys.sort()).toEqual(expectedKeys.sort());
  });

  it('should validate room ID length before database query', async () => {
    const invalidIds = ['A', 'AB', 'ABC', 'ABCD', 'ABCDEF', 'ABCDEFG'];

    for (const invalidId of invalidIds) {
      await expect(getRoomById(invalidId)).rejects.toThrow(
        'Room ID must be exactly 5 characters long'
      );
    }
  });

  it('should handle special characters in valid 5-character room IDs', async () => {
    const testCases = [
      { id: 'AB-12', name: 'With dash' },
      { id: 'AB_12', name: 'With underscore' },
      { id: 'AB.12', name: 'With dot' },
    ];

    for (const testCase of testCases) {
      await query({
        text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
        values: [testCase.id, testCase.name],
      });

      const result = await getRoomById(testCase.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(testCase.id);
      expect(result!.name).toBe(testCase.name);
    }
  });

  it('should handle maximum length room names', async () => {
    const roomId = 'ABC12';
    const maxLengthRoomName = 'A'.repeat(255);

    await query({
      text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
      values: [roomId, maxLengthRoomName],
    });

    const result = await getRoomById(roomId);

    expect(result).not.toBeNull();
    expect(result!.name).toBe(maxLengthRoomName);
    expect(result!.name.length).toBe(255);
  });

  it('should handle rooms created at specific timestamps', async () => {
    const roomId = 'ABC12';
    const roomName = 'Test Room';
    const specificDate = new Date('2024-01-15T14:30:00Z');

    await query({
      text: 'INSERT INTO rooms (id, name, created_at) VALUES ($1, $2, $3)',
      values: [roomId, roomName, specificDate],
    });

    const result = await getRoomById(roomId);

    expect(result).not.toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.created_at.getTime()).toBe(specificDate.getTime());
  });
});
