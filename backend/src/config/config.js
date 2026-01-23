import dotenv from 'dotenv';

dotenv.config();

/**
 * Application configuration from environment variables
 * Provides centralized configuration management
 */
const config = {
  // Server
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // WebRTC
  iceServers: (process.env.ICE_SERVERS || 'stun:stun.l.google.com:19302')
    .split(',')
    .map((url) => ({ urls: [url.trim()] })),

  // Room settings
  maxParticipantsPerRoom: 25,
  roomIdleTimeout: 10 * 60 * 1000, // 10 minutes
  socketPingInterval: 30 * 1000, // 30 seconds

  // Validation
  minParticipantNameLength: 1,
  maxParticipantNameLength: 50,
};

Object.freeze(config);

export default config;
