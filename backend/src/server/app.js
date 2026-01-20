import express from 'express';
import cors from 'cors';
import logger from '../utils/logger.js';
import config from '../config/config.js';

/**
 * Express application setup
 */
export function createApp() {
  const app = express();

  // Middleware
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use(express.static('frontend/public'));

  // Request logging middleware
  app.use((req, res, next) => {
    logger.debug('HTTP', `${req.method} ${req.path}`, {
      ip: req.ip,
    });
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Routes for debugging (optional)
  app.get('/api/rooms', (req, res) => {
    const rooms = require('../managers/roomManager.js').default.getAllRooms();
    res.json({
      count: rooms.length,
      rooms: rooms.map((room) => room.getSummary()),
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use((err, req, res, next) => {
    logger.error('HTTP', 'Unhandled error', {
      error: err.message,
      path: req.path,
      method: req.method,
    });

    const statusCode = err.statusCode || 500;
    const response = {
      error: err.message || 'Internal server error',
      code: err.code || 'INTERNAL_ERROR',
    };

    if (config.isDevelopment) {
      response.stack = err.stack;
    }

    res.status(statusCode).json(response);
  });

  return app;
}
