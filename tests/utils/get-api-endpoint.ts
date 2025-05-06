const getApiEndpoint = () =>
  process.env.TEST_API_URL || 'http://localhost:3000';

export { getApiEndpoint };
