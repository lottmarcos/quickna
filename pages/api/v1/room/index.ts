import { NextApiRequest, NextApiResponse } from 'next';

import { createRoom, getRoom } from 'src/backend/services';

const rooms = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === 'POST') return createRoom(req, res);
  if (req.method === 'GET') return getRoom(req, res);

  return res.status(405).json({
    error: 'Method not allowed',
  });
};

export default rooms;
