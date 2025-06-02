import { insertRoom } from 'src/backend/database/insert-room';
import { query } from 'src/integrations/database';
import { generateRoomId } from 'src/utils';
import { waitForAllServices } from 'tests/orchestrator';

jest.mock('src/utils', () => ({
  generateRoomId: jest.fn(),
}));

const mockGenerateRoomId = generateRoomId as jest.MockedFunction<
  typeof generateRoomId
>;

describe('insertRoom', () => {
  beforeAll(async () => {
    await waitForAllServices();
  });

  beforeEach(async () => {
    await query({ text: 'DELETE FROM rooms', values: [] });
    jest.clearAllMocks();
  });

  it('should insert a room successfully with unique ID', async () => {
    const roomName = 'Test Room';
    const mockRoomId = 'ABC12';

    mockGenerateRoomId.mockReturnValue(mockRoomId);

    const result = await insertRoom(roomName);

    expect(result).toBe(mockRoomId);
    expect(mockGenerateRoomId).toHaveBeenCalledTimes(1);

    const checkSql = 'SELECT id, name FROM rooms WHERE id = $1';
    const checkResult = await query({ text: checkSql, values: [mockRoomId] });

    expect(checkResult.rows).toHaveLength(1);
    expect(checkResult.rows[0].id).toBe(mockRoomId);
    expect(checkResult.rows[0].name).toBe(roomName);
  });

  it('should generate new ID if first one is not unique', async () => {
    const roomName = 'Test Room';
    const existingRoomId = 'ABC12';
    const newRoomId = 'DEF34';

    await query({
      text: 'INSERT INTO rooms (id, name) VALUES ($1, $2)',
      values: [existingRoomId, 'Existing Room'],
    });

    mockGenerateRoomId
      .mockReturnValueOnce(existingRoomId)
      .mockReturnValueOnce(newRoomId);

    const result = await insertRoom(roomName);

    expect(result).toBe(newRoomId);
    expect(mockGenerateRoomId).toHaveBeenCalledTimes(2);

    const checkSql = 'SELECT id, name FROM rooms WHERE id = $1';
    const checkResult = await query({ text: checkSql, values: [newRoomId] });

    expect(checkResult.rows).toHaveLength(1);
    expect(checkResult.rows[0].id).toBe(newRoomId);
    expect(checkResult.rows[0].name).toBe(roomName);
  });

  it('should handle multiple collisions before finding unique ID', async () => {
    const roomName = 'Test Room';
    const existingId1 = 'ABC12';
    const existingId2 = 'DEF34';
    const uniqueId = 'GHI56';

    await query({
      text: 'INSERT INTO rooms (id, name) VALUES ($1, $2), ($3, $4)',
      values: [existingId1, 'Room 1', existingId2, 'Room 2'],
    });

    mockGenerateRoomId
      .mockReturnValueOnce(existingId1)
      .mockReturnValueOnce(existingId2)
      .mockReturnValueOnce(uniqueId);

    const result = await insertRoom(roomName);

    expect(result).toBe(uniqueId);
    expect(mockGenerateRoomId).toHaveBeenCalledTimes(3);

    const checkSql = 'SELECT COUNT(*) as count FROM rooms';
    const checkResult = await query({ text: checkSql, values: [] });
    expect(parseInt(checkResult.rows[0].count)).toBe(3);
  });

  it('should handle room names with special characters', async () => {
    const roomName = "Test Room with 'quotes' & symbols!";
    const mockRoomId = 'ABC12';

    mockGenerateRoomId.mockReturnValue(mockRoomId);

    const result = await insertRoom(roomName);

    expect(result).toBe(mockRoomId);

    const checkSql = 'SELECT name FROM rooms WHERE id = $1';
    const checkResult = await query({ text: checkSql, values: [mockRoomId] });

    expect(checkResult.rows[0].name).toBe(roomName);
  });

  it('should handle empty room name', async () => {
    const roomName = '';
    const mockRoomId = 'ABC12';

    mockGenerateRoomId.mockReturnValue(mockRoomId);

    const result = await insertRoom(roomName);

    expect(result).toBe(mockRoomId);

    const checkSql = 'SELECT name FROM rooms WHERE id = $1';
    const checkResult = await query({ text: checkSql, values: [mockRoomId] });

    expect(checkResult.rows[0].name).toBe('');
  });

  it('should return the exact ID that was inserted', async () => {
    const roomName = 'Test Room';
    const mockRoomId = 'XYZ99';

    mockGenerateRoomId.mockReturnValue(mockRoomId);

    const result = await insertRoom(roomName);

    expect(result).toBe(mockRoomId);
    expect(typeof result).toBe('string');
    expect(result.length).toBe(5);
  });
});
