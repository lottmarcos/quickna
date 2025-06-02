import { Room } from 'src/constants/types';
import { query } from 'src/integrations/database';

const getRoomById = async (roomId: string): Promise<Room | null> => {
  const sql = 'SELECT id, name, created_at FROM rooms WHERE id = $1';
  const values = [roomId];

  try {
    if (roomId.length !== 5)
      throw new Error('Room ID must be exactly 5 characters long');

    const { rows } = await query({ text: sql, values });

    if (rows.length === 0) {
      return null;
    }

    return rows[0] as Room;
  } catch (error) {
    console.error('Error getting room by ID:', error);
    throw error;
  }
};

export { getRoomById };
