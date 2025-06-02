import { waitForAllServices } from 'tests/orchestrator';
import { getApiEndpoint } from 'tests/utils';

describe('GET /api/v1/room', () => {
  beforeAll(async () => {
    await waitForAllServices();
  });

  const apiEndpoint = getApiEndpoint();

  let testRoomId: string;

  beforeEach(async () => {
    const createResponse = await fetch(`${apiEndpoint}/api/v1/room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test Room for GET' }),
    });

    const createData = await createResponse.json();
    testRoomId = createData.id;
  });

  it('should get an existing room successfully', async () => {
    const response = await fetch(
      `${apiEndpoint}/api/v1/room?room=${testRoomId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.room).toBeDefined();
    expect(data.room.id).toBe(testRoomId);
    expect(data.room.name).toBe('Test Room for GET');
  });

  it('should return 404 if room does not exist', async () => {
    const response = await fetch(`${apiEndpoint}/api/v1/room?room=NONEX`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Room not found');
  });

  it('should return 400 if room ID is missing', async () => {
    const response = await fetch(`${apiEndpoint}/api/v1/room`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Room is required and must be a string');
  });

  it('should return 400 if room ID is empty string', async () => {
    const response = await fetch(`${apiEndpoint}/api/v1/room?room=`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Room is required and must be a string');
  });

  it('should return 400 if room ID is not exactly 5 characters', async () => {
    const response = await fetch(`${apiEndpoint}/api/v1/room?room=TOOLONG`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Room ID must be exactly 5 characters long');
  });

  it('should handle URL encoded room IDs', async () => {
    const createResponse = await fetch(`${apiEndpoint}/api/v1/room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Special Room' }),
    });

    const createData = await createResponse.json();
    const specialRoomId = createData.id;

    const response = await fetch(
      `${apiEndpoint}/api/v1/room?room=${encodeURIComponent(specialRoomId)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.room.id).toBe(specialRoomId);
  });

  it('should handle case-sensitive room IDs', async () => {
    const upperCaseResponse = await fetch(
      `${apiEndpoint}/api/v1/room?room=${testRoomId.toUpperCase()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const lowerCaseResponse = await fetch(
      `${apiEndpoint}/api/v1/room?room=${testRoomId.toLowerCase()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (testRoomId !== testRoomId.toUpperCase()) {
      const upperData = await upperCaseResponse.json();
      expect(upperCaseResponse.status).toBe(404);
      expect(upperData.error).toBe('Room not found');
    }

    if (testRoomId !== testRoomId.toLowerCase()) {
      const lowerData = await lowerCaseResponse.json();
      expect(lowerCaseResponse.status).toBe(404);
      expect(lowerData.error).toBe('Room not found');
    }
  });
});
