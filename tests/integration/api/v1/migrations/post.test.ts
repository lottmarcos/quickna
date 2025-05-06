import { clearDatabase, runMigrations } from 'tests/utils';

describe('POST /api/v1/migrations', () => {
  beforeAll(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await clearDatabase().then(async () => await runMigrations());
  });

  it('Validate dryRun is false and migrations is actually running', async () => {
    const firstResponse = await fetch(
      'http://localhost:3000/api/v1/migrations',
      {
        method: 'POST',
      }
    );
    expect(firstResponse.status).toBe(201);

    const firstBody = await firstResponse.json();
    expect(Array.isArray(firstBody)).toBeTruthy();
    expect(firstBody.length).toBeGreaterThan(0);

    const secondResponse = await fetch(
      'http://localhost:3000/api/v1/migrations',
      {
        method: 'POST',
      }
    );
    expect(secondResponse.status).toBe(200);

    const secondBody = await secondResponse.json();
    expect(Array.isArray(secondBody)).toBeTruthy();
    expect(secondBody.length).toBe(0);
  });
});
