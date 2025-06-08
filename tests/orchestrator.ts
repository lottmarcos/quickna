import retry from 'async-retry';

import { clearDatabase, getApiEndpoint, runMigrations } from './utils';

const fetchStatusPage = async () => {
  const apiEndpoint = getApiEndpoint();
  const response = await fetch(`${apiEndpoint}/api/v1/status`);

  if (response.status !== 200) {
    throw Error();
  }
};

const waitForWebServer = async () => {
  return retry(fetchStatusPage, { retries: 100, maxTimeout: 1000 });
};

const waitForAllServices = async () => {
  await waitForWebServer();
  await clearDatabase();
  await runMigrations();
};

export { waitForAllServices };
