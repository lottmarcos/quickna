import { waitForAllServices } from 'tests/orchestrator';
import { getApiEndpoint } from 'tests/utils';

describe('GET /api/v1/status', () => {
  beforeAll(async () => {
    await waitForAllServices();
  });

  const apiEndpoint = getApiEndpoint();

  it('should GET to /api/v1/status should return 200', async () => {
    const response = await fetch(`${apiEndpoint}/api/v1/status`);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('updated_at');

    const parsedDate = new Date(body.updated_at).toISOString();
    expect(body.updated_at).toEqual(parsedDate);

    expect(body).toHaveProperty('dependencies');
    expect(body.dependencies).toHaveProperty('database');
    expect(body.dependencies.database).toHaveProperty('version');
    expect(body.dependencies.database).toHaveProperty('max_connections');
    expect(body.dependencies.database).not.toHaveProperty('password');
    expect(body.dependencies.database).not.toHaveProperty('email');

    expect(body.dependencies.database.version).toEqual('16.0');
    expect(body.dependencies.database.max_connections).toEqual(100);
    expect(body.dependencies.database.opened_connections).toEqual(1);
  });

  it('should deal with query params', async () => {
    const result = await fetch(
      `${apiEndpoint}/api/v1/status?databaseName=local_db`
    );

    expect(result.status).toBe(200);
  });
});
