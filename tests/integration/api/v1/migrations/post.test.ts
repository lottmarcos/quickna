import { waitForAllServices } from 'tests/orchestrator';
import { clearDatabase, getApiEndpoint } from 'tests/utils';

describe('POST /api/v1/migrations', () => {
  beforeAll(async () => {
    await waitForAllServices();
    await clearDatabase();
  });

  const apiEndpoint = getApiEndpoint();

  it('Validate dryRun is false and migrations is actually running', async () => {
    const firstResponse = await fetch(`${apiEndpoint}/api/v1/migrations`, {
      method: 'POST',
    });
    expect(firstResponse.status).toBe(201);

    const firstBody = await firstResponse.json();
    expect(Array.isArray(firstBody)).toBeTruthy();
    expect(firstBody.length).toBeGreaterThan(0);

    const secondResponse = await fetch(`${apiEndpoint}/api/v1/migrations`, {
      method: 'POST',
    });
    expect(secondResponse.status).toBe(200);

    const secondBody = await secondResponse.json();
    expect(Array.isArray(secondBody)).toBeTruthy();
    expect(secondBody.length).toBe(0);
  });
});
