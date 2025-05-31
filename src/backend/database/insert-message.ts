import { MessageData, SavedMessage } from 'src/constants/types';
import { query } from 'src/integrations/database';

const insertMessage = async (
  messageData: MessageData
): Promise<SavedMessage> => {
  const sql = `
    INSERT INTO messages (room_id, content, author, created_at)
    VALUES ($1, $2, $3, $4)
    RETURNING id, room_id, content, author, created_at
  `;

  const values = [
    messageData.roomId,
    messageData.content,
    messageData.author,
    messageData.createdAt,
  ];

  const result = await query({ text: sql, values });

  return {
    id: result.rows[0].id,
    roomId: result.rows[0].room_id,
    content: result.rows[0].content,
    author: result.rows[0].author,
    createdAt: result.rows[0].created_at,
  };
};

export { insertMessage };
