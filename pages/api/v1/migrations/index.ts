import { NextApiRequest, NextApiResponse } from 'next';

import { join } from 'node:path';

import node_pg_migration from 'node-pg-migrate';
import { getClient } from 'src/integrations/database';

const migrations = async (req: NextApiRequest, res: NextApiResponse) => {
  const alowedMethods = ['GET', 'POST'];
  if (!alowedMethods.includes(req.method)) {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const dbClient = await getClient();

  const dryRun = req.method === 'GET';

  try {
    const migrations = await node_pg_migration({
      dbClient,
      migrationsTable: 'pgmigrations',
      dir: join('src', 'integrations', 'migrations'),
      direction: 'up',
      dryRun,
      verbose: true,
    });

    if (migrations.length > 0) return res.status(201).json(migrations);

    res.status(200).json(migrations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
    throw error;
  } finally {
    await dbClient.end();
  }
};

export default migrations;
