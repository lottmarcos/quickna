import { SavedMessage } from 'src/constants/types';
import { query } from 'src/integrations/database';

const getRoomMessages = async (
  roomId: string,
  limit: number = 50
): Promise<SavedMessage[]> => {
  const sql = `
    SELECT id, room_id, content, author, created_at
    FROM messages
    WHERE room_id = $1
    ORDER BY created_at DESC
    LIMIT $2
  `;

  const values = [roomId, limit];
  const result = await query({ text: sql, values });

  return result.rows
    .map((row) => ({
      id: row.id,
      roomId: row.room_id,
      content: row.content,
      author: row.author,
      createdAt: row.created_at,
    }))
    .reverse();
  // Reverse to maintain chronological order
};

export { getRoomMessages };
