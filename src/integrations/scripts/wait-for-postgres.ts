/* eslint-disable no-console */
import { exec } from 'node:child_process';

const checkPostgres = async () => {
  exec(
    'docker exec quickna-postgres-dev pg_isready --host localhost',
    (_, stdout) => {
      if (stdout.search('accepting connections') === -1) {
        setTimeout(() => {
          checkPostgres();
        }, 1000);
        return;
      }

      console.log('✅ Postgres está aceitando conexões!\n');
    }
  );
};

console.log('\n⏳ Aguardando Postgres aceitar conexões');
checkPostgres();
