import logger from '../utils/logger.js';
import roomManager from '../managers/roomManager.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

/**
 * Buzzer Server
 * Handles buzzer logic and winner determination
 */
class BuzzerServer {
  constructor(io) {
    this.io = io;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      socket.on('buzzer:startRound', (data, callback) =>
        this.handleStartRound(socket, data, callback)
      );
      socket.on('buzzer:buzz', (data, callback) =>
        this.handleBuzz(socket, data, callback)
      );
    });
  }

  /**
   * Host starts a new round
   * Resets all participant buzz state
   */
  handleStartRound(socket, data, callback) {
    try {
      this.validateHostData(socket, data);

      const roomId = socket.data.room;
      const room = roomManager.startRound(roomId);

      logger.info('BuzzerServer', 'Round started', {
        roomId,
        hostId: socket.id,
      });

      // Broadcast to all in room
      this.io.to(`room:${roomId}`).emit('buzzer:roundStarted', {
        room: room.getSummary(),
      });

      callback({ success: true, room: room.getSummary() });
    } catch (error) {
      logger.error('BuzzerServer', 'Error starting round', {
        error: error.message,
        socketId: socket.id,
      });
      callback({ success: false, error: error.message });
    }
  }

  /**
   * Participant buzzes
   * First buzz is the winner
   */
  handleBuzz(socket, data, callback) {
    try {
      if (socket.data.role !== 'participant') {
        throw new ValidationError('Only participants can buzz');
      }

      this.validateData(data, ['timestamp']);

      const roomId = socket.data.room;
      const participantId = socket.id;
      const result = roomManager.recordBuzz(
        roomId,
        participantId,
        data.timestamp
      );

      if (result.locked && result.isFirstBuzz) {
        // This was the winning buzz!
        logger.info('BuzzerServer', 'Participant buzzed - Winner!', {
          roomId,
          participantId: socket.data.name,
          timestamp: data.timestamp,
        });

        const room = roomManager.getRoom(roomId);

        // Broadcast winner to all
        this.io.to(`room:${roomId}`).emit('buzzer:winner', {
          winnerId: participantId,
          winnerName: socket.data.name,
          room: room.getSummary(),
        });

        callback({ success: true, winner: true });
      } else if (result.locked) {
        // Buzzer already locked by someone else
        logger.debug('BuzzerServer', 'Buzz ignored - buzzer already locked', {
          roomId,
          participantId,
        });

        callback({ success: false, error: 'Buzzer already locked', locked: true });
      } else if (result.alreadyBuzzed) {
        // Participant already buzzed this round
        logger.debug('BuzzerServer', 'Buzz ignored - already buzzed', {
          roomId,
          participantId,
        });

        callback({
          success: false,
          error: 'Already buzzed this round',
          alreadyBuzzed: true,
        });
      }
    } catch (error) {
      logger.error('BuzzerServer', 'Error processing buzz', {
        error: error.message,
        socketId: socket.id,
      });
      callback({ success: false, error: error.message });
    }
  }

  /**
   * Validation helper
   */
  validateData(data, requiredFields) {
    if (!data) {
      throw new ValidationError('Missing data');
    }

    for (const field of requiredFields) {
      if (!(field in data)) {
        throw new ValidationError(`Missing required field: ${field}`);
      }
    }
  }

  /**
   * Validation helper for host
   */
  validateHostData(socket, data) {
    if (socket.data.role !== 'host') {
      throw new ValidationError('Only host can perform this action');
    }

    if (!socket.data.room) {
      throw new NotFoundError('Room');
    }
  }
}

export default BuzzerServer;
