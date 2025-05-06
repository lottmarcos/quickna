import { query } from 'src/integrations/database';
import { generateRoomId } from 'src/utils';

const insertRoom = async (name: string): Promise<string> => {
  let roomId: string;
  let isUnique = false;

  while (!isUnique) {
    roomId = generateRoomId();

    const sql = 'SELECT id FROM rooms WHERE id = $1';
    const values = [roomId];
    const { rows } = await query({ text: sql, values });
    isUnique = rows.length === 0;
  }

  const sql = 'INSERT INTO rooms (id, name) VALUES ($1, $2) RETURNING id';
  const values = [roomId, name];
  const result = await query({ text: sql, values });

  return result.rows[0].id;
};

export { insertRoom };
