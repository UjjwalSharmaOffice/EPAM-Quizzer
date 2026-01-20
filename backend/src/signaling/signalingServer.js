import logger from '../utils/logger.js';
import roomManager from '../managers/roomManager.js';
import config from '../config/config.js';
import {
  ValidationError,
  NotFoundError,
  ConflictError,
} from '../utils/errors.js';

/**
 * WebRTC Signaling Server
 * Handles SDP offer/answer exchange and coordination
 */
class SignalingServer {
  constructor(io) {
    this.io = io;
    this.setupEventHandlers();
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.debug('SignalingServer', 'Client connected', {
        socketId: socket.id,
      });

      // Host events
      socket.on('host:createRoom', (data, callback) =>
        this.handleHostCreateRoom(socket, data, callback)
      );
      socket.on('host:joinRoom', (data, callback) =>
        this.handleHostJoinRoom(socket, data, callback)
      );
      socket.on('host:sendOffer', (data, callback) =>
        this.handleHostSendOffer(socket, data, callback)
      );
      socket.on('host:receiveAnswer', (data, callback) =>
        this.handleHostReceiveAnswer(socket, data, callback)
      );
      socket.on('host:addIceCandidate', (data, callback) =>
        this.handleHostAddIceCandidate(socket, data, callback)
      );

      // Participant events
      socket.on('participant:joinRoom', (data, callback) =>
        this.handleParticipantJoinRoom(socket, data, callback)
      );
      socket.on('participant:sendAnswer', (data, callback) =>
        this.handleParticipantSendAnswer(socket, data, callback)
      );
      socket.on('participant:addIceCandidate', (data, callback) =>
        this.handleParticipantAddIceCandidate(socket, data, callback)
      );

      // Disconnection
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  /**
   * SIGNALING: Host creates room
   */
  handleHostCreateRoom(socket, data, callback) {
    try {
      this.validateData(data, ['name']);

      const room = roomManager.createRoom();
      const roomWithHost = roomManager.joinAsHost(room.id, {
        id: socket.id,
        name: data.name,
      });

      // Store room info in socket
      socket.join(`room:${room.id}`);
      socket.data.room = room.id;
      socket.data.role = 'host';
      socket.data.name = data.name;

      logger.info('SignalingServer', 'Host created room', {
        socketId: socket.id,
        roomId: room.id,
        hostName: data.name,
      });

      callback({ success: true, room: roomWithHost.getSummary() });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }

  /**
   * SIGNALING: Participant joins room
   */
  handleParticipantJoinRoom(socket, data, callback) {
    try {
      this.validateData(data, ['roomId', 'name']);

      const room = roomManager.joinAsParticipant(data.roomId, {
        id: socket.id,
        name: data.name,
      });

      // Store room info in socket
      socket.join(`room:${data.roomId}`);
      socket.data.room = data.roomId;
      socket.data.role = 'participant';
      socket.data.name = data.name;

      logger.info('SignalingServer', 'Participant joined room', {
        socketId: socket.id,
        roomId: data.roomId,
        participantName: data.name,
      });

      // Notify host
      this.io.to(`room:${data.roomId}`).emit('buzzer:participantJoined', {
        participantId: socket.id,
        participantName: data.name,
        room: room.getSummary(),
      });

      callback({ success: true, room: room.getSummary() });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }

  /**
   * SIGNALING: Host sends SDP offer to participant
   */
  handleHostSendOffer(socket, data, callback) {
    try {
      this.validateData(data, ['participantId', 'offer']);
      this.validateHostAction(socket);

      const roomId = socket.data.room;
      const participantSocket = this.io.sockets.sockets.get(data.participantId);

      if (!participantSocket) {
        throw new NotFoundError('Participant socket');
      }

      logger.debug('SignalingServer', 'Host sending offer', {
        roomId,
        hostId: socket.id,
        participantId: data.participantId,
      });

      // Send offer to participant
      participantSocket.emit('signaling:receiveOffer', {
        from: socket.id,
        offer: data.offer,
        iceServers: config.iceServers,
      });

      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }

  /**
   * SIGNALING: Host receives SDP answer from participant
   */
  handleHostReceiveAnswer(socket, data, callback) {
    try {
      this.validateData(data, ['participantId', 'answer']);
      this.validateHostAction(socket);

      const participantSocket = this.io.sockets.sockets.get(data.participantId);

      if (!participantSocket) {
        throw new NotFoundError('Participant socket');
      }

      logger.debug('SignalingServer', 'Host sending answer', {
        roomId: socket.data.room,
        hostId: socket.id,
        participantId: data.participantId,
      });

      // Send answer to participant
      participantSocket.emit('signaling:receiveAnswer', {
        from: socket.id,
        answer: data.answer,
      });

      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }

  /**
   * SIGNALING: Host adds ICE candidate
   */
  handleHostAddIceCandidate(socket, data, callback) {
    try {
      this.validateData(data, ['participantId', 'candidate']);
      this.validateHostAction(socket);

      const participantSocket = this.io.sockets.sockets.get(data.participantId);

      if (participantSocket) {
        participantSocket.emit('signaling:iceCandidate', {
          from: socket.id,
          candidate: data.candidate,
        });
      }

      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }

  /**
   * SIGNALING: Participant sends SDP answer to host
   */
  handleParticipantSendAnswer(socket, data, callback) {
    try {
      this.validateData(data, ['hostId', 'answer']);
      this.validateParticipantAction(socket);

      const hostSocket = this.io.sockets.sockets.get(data.hostId);

      if (!hostSocket) {
        throw new NotFoundError('Host socket');
      }

      logger.debug('SignalingServer', 'Participant sending answer', {
        roomId: socket.data.room,
        participantId: socket.id,
        hostId: data.hostId,
      });

      // Send answer to host
      hostSocket.emit('signaling:receiveAnswer', {
        from: socket.id,
        answer: data.answer,
      });

      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }

  /**
   * SIGNALING: Participant adds ICE candidate
   */
  handleParticipantAddIceCandidate(socket, data, callback) {
    try {
      this.validateData(data, ['hostId', 'candidate']);
      this.validateParticipantAction(socket);

      const hostSocket = this.io.sockets.sockets.get(data.hostId);

      if (hostSocket) {
        hostSocket.emit('signaling:iceCandidate', {
          from: socket.id,
          candidate: data.candidate,
        });
      }

      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  }

  /**
   * Handle disconnect
   */
  handleDisconnect(socket) {
    try {
      const room = roomManager.leaveRoom(socket.id);

      if (room) {
        logger.info('SignalingServer', 'User disconnected', {
          socketId: socket.id,
          role: socket.data.role,
          roomId: socket.data.room,
        });

        // Notify remaining users
        if (socket.data.role === 'host') {
          this.io.to(`room:${socket.data.room}`).emit('buzzer:hostLeft', {
            roomId: socket.data.room,
          });
        } else {
          this.io.to(`room:${socket.data.room}`).emit('buzzer:participantLeft', {
            participantId: socket.id,
            participantName: socket.data.name,
            room: room.getSummary(),
          });
        }
      }
    } catch (error) {
      logger.error('SignalingServer', 'Error handling disconnect', {
        error: error.message,
        socketId: socket.id,
      });
    }
  }

  /**
   * VALIDATION: Ensure required fields exist
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
   * VALIDATION: Ensure socket is host
   */
  validateHostAction(socket) {
    if (socket.data.role !== 'host') {
      throw new ValidationError('Only host can perform this action');
    }
  }

  /**
   * VALIDATION: Ensure socket is participant
   */
  validateParticipantAction(socket) {
    if (socket.data.role !== 'participant') {
      throw new ValidationError('Only participant can perform this action');
    }
  }
}

export default SignalingServer;
