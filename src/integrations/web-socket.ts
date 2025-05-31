/* eslint-disable no-console */
import path from 'path';

import dotenv from 'dotenv';

import { createWebSocketServer } from '../backend/services/web-socket';

// Load environment variables from the correct file
const envFile =
  process.env.NODE_ENV === 'production' ? '.env' : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

console.log('Starting WebSocket server...');
console.log(`Loading environment from: ${envFile}`);
console.log('Environment check:');
console.log('- POSTGRES_HOST:', process.env.POSTGRES_HOST || 'localhost');
console.log('- POSTGRES_PORT:', process.env.POSTGRES_PORT || '5432');
console.log('- POSTGRES_DB:', process.env.POSTGRES_DB || 'quickna');
console.log('- POSTGRES_USER:', process.env.POSTGRES_USER || 'postgres');
console.log(
  '- POSTGRES_PASSWORD:',
  process.env.POSTGRES_PASSWORD ? '[SET]' : '[NOT SET]'
);
console.log('- WEBSOCKET_PORT:', process.env.WEBSOCKET_PORT || '8080');

const port = process.env.WEBSOCKET_PORT
  ? parseInt(process.env.WEBSOCKET_PORT)
  : 8080;
const server = createWebSocketServer(port);

// Graceful shutdown
const shutdown = () => {
  console.log('\nShutting down WebSocket server...');
  server.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown();
});
