import { waitForAllServices } from 'tests/orchestrator';
import { getApiEndpoint } from 'tests/utils';

describe('POST /api/v1/room', () => {
  beforeAll(async () => {
    await waitForAllServices();
  });

  const apiEndpoint = getApiEndpoint();

  it('should create a room successfully', async () => {
    const response = await fetch(`${apiEndpoint}/api/v1/room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Test Room' }),
    });

    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.id).toBeDefined();
    expect(typeof data.id).toBe('string');
    expect(data.id).toHaveLength(5);
  });

  it('should return 400 if name is missing', async () => {
    const response = await fetch(`${apiEndpoint}/api/v1/room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name is required and must be a string');
  });

  it('should return 400 if name is not a string', async () => {
    const response = await fetch(`${apiEndpoint}/api/v1/room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 123 }),
    });

    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name is required and must be a string');
  });

  it('should return 405 for non-POST methods', async () => {
    const response = await fetch(`${apiEndpoint}/api/v1/room`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    expect(response.status).toBe(405);
    expect(data.error).toBe('Method not allowed');
  });
});
