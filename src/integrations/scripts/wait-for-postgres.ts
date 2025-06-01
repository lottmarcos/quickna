/* eslint-disable no-console */
import { exec } from 'node:child_process';

const checkPostgres = async () => {
  exec(
    'docker exec clone-tabnews-postgres-dev pg_isready --host localhost',
    (_, stdout) => {
      if (stdout.search('accepting connections') === -1) {
        process.stdout.write('.');
        checkPostgres();
        return;
      }

      console.log('\n✅ Postgres está aceitando conexões!\n');
    }
  );
};

process.stdout.write('\n\n⏳ Aguardando Postgres aceitar conexões');
checkPostgres();
