import { getApiEndpoint } from './get-api-endpoint';

const runMigrations = async (): Promise<void> => {
  const apiEndpoint = getApiEndpoint();

  try {
    const migrationsResponse = await fetch(`${apiEndpoint}/api/v1/migrations`, {
      method: 'POST',
    });

    if (
      migrationsResponse.status !== 201 &&
      migrationsResponse.status !== 200
    ) {
      const body = await migrationsResponse.text();
      throw new Error(
        `Failed to run migrations: ${migrationsResponse.status} ${body}`
      );
    }
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
};

export { runMigrations };
