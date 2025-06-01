import { waitForAllServices } from 'tests/orchestrator';
import { clearDatabase, getApiEndpoint } from 'tests/utils';

describe('GET /api/v1/migrations', () => {
  beforeAll(async () => {
    await waitForAllServices();
    await clearDatabase();
  });

  const apiEndpoint = getApiEndpoint();

  it('Validate dryRun is true and migrations is simulated', async () => {
    const firstResponse = await fetch(`${apiEndpoint}/api/v1/migrations`);
    expect(firstResponse.status).toBe(201);

    const firstBody = await firstResponse.json();
    expect(Array.isArray(firstBody)).toBeTruthy();
    expect(firstBody.length).toBeGreaterThan(0);

    const secondResponse = await fetch(`${apiEndpoint}/api/v1/migrations`);
    expect(secondResponse.status).toBe(201);

    const secondBody = await secondResponse.json();
    expect(Array.isArray(secondBody)).toBeTruthy();
    expect(secondBody.length).toBeGreaterThan(0);
  });
});
