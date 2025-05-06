import { NextApiRequest, NextApiResponse } from 'next';

import { insertRoom } from '../database';

const createRoom = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const body = req.body;
    if (!body.name || typeof body.name !== 'string') {
      return res.status(400).json({
        error: 'Name is required and must be a string',
      });
    }

    const roomId = await insertRoom(body.name);

    return res.status(201).json({
      success: true,
      id: roomId,
    });
  } catch (error) {
    return res.status(500).json({
      error: 'An error occurred while creating the room',
      details: error,
    });
  }
};

export { createRoom };
