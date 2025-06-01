/* eslint-disable no-console */
import path from 'path';

import dotenv from 'dotenv';

import { createWebSocketServer } from '../backend/services/web-socket';

const envFile =
  process.env.NODE_ENV === 'production'
    ? '.env.production'
    : '.env.development';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

console.log('🚀 Starting WebSocket server...');
console.log(`📄 Config file: ${envFile}`);

let server = null;
let isShuttingDown = false;

const startServer = () => {
  try {
    const port = process.env.WEBSOCKET_PORT
      ? parseInt(process.env.WEBSOCKET_PORT)
      : 8080;
    server = createWebSocketServer(port);

    console.log(`✅ WebSocket server started on port ${port}`);

    server.on('error', (error: Error) => {
      console.error('❌ WebSocket server error:', error);
      if (!isShuttingDown) {
        gracefulShutdown('server-error');
      }
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start WebSocket server:', error);
    process.exit(1);
  }
};

const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) {
    console.log('⚠️  Shutdown already in progress...');
    return;
  }

  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  const forceShutdownTimeout = setTimeout(() => {
    console.log('❌ Force shutdown - timeout exceeded');
    process.exit(1);
  }, 10000);

  const cleanup = () => {
    clearTimeout(forceShutdownTimeout);
    console.log('✅ WebSocket server shutdown complete');
    process.exit(0);
  };

  if (server) {
    console.log('🔄 Closing WebSocket server...');

    server.close((error: Error) => {
      if (error) {
        console.error('❌ Error during server shutdown:', error);
        process.exit(1);
      } else {
        console.log('✅ WebSocket server closed successfully');
        cleanup();
      }
    });

    setTimeout(() => {
      if (isShuttingDown) {
        console.log(
          '⚠️  Server close timeout, attempting alternative cleanup...'
        );
        cleanup();
      }
    }, 5000);
  } else {
    console.log('⚠️ No server to close');
    cleanup();
  }
};

const handleError = (error: Error, source: string) => {
  console.error(`❌ ${source}:`, error);

  if (isShuttingDown) return;

  if (error.stack) {
    console.error('📋 Stack trace:', error.stack);
  }

  gracefulShutdown(source);
};

const signals = ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT'] as const;

signals.forEach((signal) => {
  process.on(signal, () => {
    gracefulShutdown(signal);
  });
});

process.on('uncaughtException', (error) => {
  handleError(error, 'uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  const error = reason instanceof Error ? reason : new Error(String(reason));
  console.error('🚫 Unhandled Rejection at:', promise);
  handleError(error, 'unhandledRejection');
});

process.on('exit', (code) => {
  console.log(`🏁 Process exiting with code: ${code}`);
});

const startHealthCheck = () => {
  if (!server) return;

  const healthInterval = setInterval(() => {
    if (isShuttingDown) {
      clearInterval(healthInterval);
      return;
    }
  }, 30000);

  process.on('beforeExit', () => {
    clearInterval(healthInterval);
  });
};

try {
  startServer();
  startHealthCheck();

  console.log('🎯 WebSocket server is ready and listening for connections');
} catch (error) {
  handleError(error as Error, 'server-startup');
}

export { gracefulShutdown };
