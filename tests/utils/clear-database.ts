import { query } from 'src/integrations/database';

const clearDatabase = async () => {
  await query('DROP SCHEMA public CASCADE;');
  await query('CREATE SCHEMA public;');
};

export { clearDatabase };
