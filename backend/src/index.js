import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import logger from './utils/logger.js';
import config from './config/config.js';
import { createApp } from './server/app.js';
import SignalingServer from './signaling/signalingServer.js';
import BuzzerServer from './signaling/buzzerServer.js';

/**
 * Main application entry point
 */
async function startServer() {
  try {
    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Setup Socket.IO
    const io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
      },
    });

    // Initialize signaling servers
    new SignalingServer(io);
    new BuzzerServer(io);

    // Start server
    httpServer.listen(config.port, () => {
      logger.info('Server', 'Server started', {
        port: config.port,
        env: config.nodeEnv,
        corsOrigin: config.corsOrigin,
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('Server', 'SIGTERM received, shutting down gracefully');
      httpServer.close(() => {
        logger.info('Server', 'Server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('Server', 'SIGINT received, shutting down gracefully');
      httpServer.close(() => {
        logger.info('Server', 'Server closed');
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Server', 'Uncaught exception', {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Server', 'Unhandled rejection', {
        error: String(reason),
        promise: promise.toString(),
      });
    });
  } catch (error) {
    logger.error('Server', 'Failed to start server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

startServer();
