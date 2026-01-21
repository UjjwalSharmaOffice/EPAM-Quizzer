import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';
import config from '../config/config.js';
import { NotFoundError, ConflictError } from '../utils/errors.js';

/**
 * Room represents a quiz session
 * Manages host, participants, and buzzer state
 */
class Room {
  constructor(roomId) {
    this.id = roomId;
    this.host = null;
    this.participants = new Map(); // participantId -> participant
    this.buzzerLocked = false;
    this.buzzes = []; // Array of { participantId, name, timestamp, diff }
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
  }

  /**
   * Check if room is idle (no activity for timeout period)
   */
  isIdle() {
    return Date.now() - this.lastActivity > config.roomIdleTimeout;
  }

  /**
   * Update last activity timestamp
   */
  touch() {
    this.lastActivity = Date.now();
  }

  /**
   * Get room summary for clients
   */
  getSummary() {
    return {
      id: this.id,
      hostId: this.host?.id || null,
      participantCount: this.participants.size,
      buzzerLocked: this.buzzerLocked,
      buzzes: this.buzzes,
    };
  }
}

/**
 * Manages multiple quiz rooms
 * Single source of truth for room state
 */
class RoomManager {
  constructor() {
    this.rooms = new Map(); // roomId -> Room
    this.userRooms = new Map(); // userId -> roomId (for quick lookup)
    this.startCleanupInterval();
  }

  /**
   * Create a new room
   */
  createRoom() {
    const roomId = uuidv4().substring(0, 8);
    const room = new Room(roomId);
    this.rooms.set(roomId, room);
    logger.info('RoomManager', 'Room created', { roomId });
    return room;
  }

  /**
   * Get room by ID
   */
  getRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw new NotFoundError('Room');
    }
    return room;
  }

  /**
   * Get all rooms (for debug/admin purposes)
   */
  getAllRooms() {
    return Array.from(this.rooms.values());
  }

  /**
   * Delete room
   */
  deleteRoom(roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.delete(roomId);
      logger.info('RoomManager', 'Room deleted', { roomId });
    }
  }

  /**
   * Join room as host
   */
  joinAsHost(roomId, hostData) {
    const room = this.getRoom(roomId);

    if (room.host) {
      throw new ConflictError('Room already has a host');
    }

    if (room.participants.size > 0) {
      throw new ConflictError('Cannot join as host - participants already in room');
    }

    room.host = {
      id: hostData.id,
      name: hostData.name,
      joinedAt: Date.now(),
    };

    this.userRooms.set(hostData.id, roomId);
    room.touch();

    logger.info('RoomManager', 'Host joined room', {
      roomId,
      hostId: hostData.id,
    });

    return room;
  }

  /**
   * Join room as participant
   */
  joinAsParticipant(roomId, participantData) {
    const room = this.getRoom(roomId);

    if (!room.host) {
      throw new ConflictError('Room has no host');
    }

    if (room.participants.size >= config.maxParticipantsPerRoom) {
      throw new ConflictError('Room is full');
    }

    if (room.participants.has(participantData.id)) {
      throw new ConflictError('Participant already in room');
    }

    room.participants.set(participantData.id, {
      id: participantData.id,
      name: participantData.name,
      joinedAt: Date.now(),
      buzzed: false,
    });

    this.userRooms.set(participantData.id, roomId);
    room.touch();

    logger.debug('RoomManager', 'Participant joined room', {
      roomId,
      participantId: participantData.id,
      totalParticipants: room.participants.size,
    });

    return room;
  }

  /**
   * Leave room
   */
  leaveRoom(userId) {
    const roomId = this.userRooms.get(userId);
    if (!roomId) {
      return null;
    }

    const room = this.rooms.get(roomId);
    if (!room) {
      this.userRooms.delete(userId);
      return null;
    }

    // If host leaves, delete entire room
    if (room.host?.id === userId) {
      this.deleteRoom(roomId);
      this.userRooms.delete(userId);
      logger.info('RoomManager', 'Room deleted - host left', { roomId });
      return room;
    }

    // If participant leaves, just remove them
    if (room.participants.has(userId)) {
      room.participants.delete(userId);
      this.userRooms.delete(userId);
      room.touch();
      logger.debug('RoomManager', 'Participant left room', {
        roomId,
        userId,
        remainingParticipants: room.participants.size,
      });
    }

    return room;
  }

  /**
   * Start a round
   */
  startRound(roomId) {
    const room = this.getRoom(roomId);

    room.buzzerLocked = false;
    room.buzzes = [];

    // Reset all participants
    room.participants.forEach((participant) => {
      participant.buzzed = false;
    });

    room.touch();
    logger.debug('RoomManager', 'Round started', { roomId });

    return room;
  }

  /**
   * Record a buzz from participant
   * Returns the updated buzzes list
   */
  recordBuzz(roomId, participantId, timestamp) {
    const room = this.getRoom(roomId);

    const participant = room.participants.get(participantId);
    if (!participant) {
      throw new NotFoundError('Participant');
    }

    // Participant already buzzed this round
    if (participant.buzzed) {
      logger.debug('RoomManager', 'Buzz ignored - participant already buzzed', {
        roomId,
        participantId,
      });
      return { alreadyBuzzed: true, buzzes: room.buzzes };
    }

    // Record buzz with SERVER timestamp to ensure fair ordering
    // Client timestamps (performance.now()) are relative to page load and cannot be compared across devices
    const serverTimestamp = Date.now();
    participant.buzzed = true;

    // Calculate diff from first buzz
    let diff = 0;
    if (room.buzzes.length > 0) {
      diff = serverTimestamp - room.buzzes[0].timestamp;
    }

    const buzzEntry = {
      participantId,
      name: participant.name,
      timestamp: serverTimestamp,
      diff
    };

    room.buzzes.push(buzzEntry);

    // No need to sort, push order is the natural arrival order
    // room.buzzes.sort((a, b) => a.timestamp - b.timestamp);

    // Re-calculate diffs after sort to be safe
    if (room.buzzes.length > 0) {
      const firstTimestamp = room.buzzes[0].timestamp;
      room.buzzes.forEach(b => {
        b.diff = b.timestamp - firstTimestamp;
      });
    }

    // We can optionally lock the buzzer after N buzzes, or keep it open.
    // User asked for "sequence", implies multiple. 
    // We will set buzzerLocked to true if we want to stop accepting after some limit, 
    // but for now let's keep it open or maybe lock after all participants have buzzed?
    // User didn't specify a limit, so we won't lock global buzzer.

    room.touch();

    logger.info('RoomManager', 'Buzz recorded', {
      roomId,
      participantId,
      buzzCount: room.buzzes.length
    });

    return { buzzes: room.buzzes };
  }

  /**
   * Get participant user IDs in room (for broadcast)
   */
  getParticipantUserIds(roomId) {
    const room = this.getRoom(roomId);
    return Array.from(room.participants.keys());
  }

  /**
   * Start cleanup interval to remove idle rooms
   */
  startCleanupInterval() {
    setInterval(() => {
      const idleRooms = Array.from(this.rooms.values()).filter((room) =>
        room.isIdle()
      );

      idleRooms.forEach((room) => {
        logger.info('RoomManager', 'Cleaning up idle room', { roomId: room.id });
        this.deleteRoom(room.id);

        // Clean up user mappings
        if (room.host) {
          this.userRooms.delete(room.host.id);
        }
        room.participants.forEach((participant) => {
          this.userRooms.delete(participant.id);
        });
      });

      if (idleRooms.length > 0) {
        logger.debug('RoomManager', 'Cleanup completed', {
          idleRoomsCount: idleRooms.length,
          totalRooms: this.rooms.size,
        });
      }
    }, 60 * 1000); // Run every minute
  }
}

export default new RoomManager();
