import { NextApiRequest, NextApiResponse } from 'next';

import { getRoomById } from '../database';

const getRoom = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const { room } = req.query;

    if (!room || typeof room !== 'string') {
      return res.status(400).json({
        error: 'Room is required and must be a string',
      });
    }

    const roomData = await getRoomById(room);

    if (!roomData) {
      return res.status(404).json({
        error: 'Room not found',
      });
    }

    return res.status(200).json({
      success: true,
      room: roomData,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'Room ID must be exactly 5 characters long'
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: 'An error occurred while searching the room',
      details: error,
    });
  }
};

export { getRoom };
