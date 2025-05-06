import { Client } from 'pg';

async function getClient() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT),
    user: process.env.POSTGRES_USER,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    ssl:
      process.env.POSTGRES_SSLMODE === 'require' ||
      process.env.NODE_ENV === 'production',
  });

  await client.connect();

  return client;
}

async function query(
  queryObject:
    | string
    | { text: string; name?: string; values?: unknown[]; rowMode?: 'array' }
) {
  let client: Client;

  try {
    client = await getClient();
    const result = await client.query(queryObject);
    return result;
  } catch (error) {
    console.error('[Source database.ts@query()]', error);
    throw error;
  } finally {
    await client.end();
  }
}

export { query, getClient };
