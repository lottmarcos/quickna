import { clearDatabase, runMigrations } from 'tests/utils';

describe('GET /api/v1/migrations', () => {
  beforeAll(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await clearDatabase().then(async () => await runMigrations());
  });

  it('Validate dryRun is true and migrations is simulated', async () => {
    const firstResponse = await fetch(
      'http://localhost:3000/api/v1/migrations'
    );
    expect(firstResponse.status).toBe(201);

    const firstBody = await firstResponse.json();
    expect(Array.isArray(firstBody)).toBeTruthy();
    expect(firstBody.length).toBeGreaterThan(0);

    const secondResponse = await fetch(
      'http://localhost:3000/api/v1/migrations'
    );
    expect(secondResponse.status).toBe(201);

    const secondBody = await secondResponse.json();
    expect(Array.isArray(secondBody)).toBeTruthy();
    expect(secondBody.length).toBeGreaterThan(0);
  });
});
