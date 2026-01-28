import logger from '../utils/logger.js';
import roomManager from '../rooms/roomManager.js';
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
      logger.debug('BuzzerServer', 'Client connected', {
        socketId: socket.id,
      });

      socket.on('host:createRoom', (data, callback) =>
        this.handleHostCreateRoom(socket, data, callback)
      );
      socket.on('participant:joinRoom', (data, callback) =>
        this.handleParticipantJoinRoom(socket, data, callback)
      );
      socket.on('buzzer:startRound', (data, callback) =>
        this.handleStartRound(socket, data, callback)
      );
      socket.on('buzzer:buzz', (data, callback) =>
        this.handleBuzz(socket, data, callback)
      );
      socket.on('buzzer:markCorrect', (data, callback) =>
        this.handleMarkCorrect(socket, data, callback)
      );
      socket.on('leaderboard:request', (data, callback) =>
        this.handleLeaderboardRequest(socket, data, callback)
      );
      socket.on('team:addPoint', (data, callback) =>
        this.handleTeamAddPoint(socket, data, callback)
      );
      socket.on('team:removePoint', (data, callback) =>
        this.handleTeamRemovePoint(socket, data, callback)
      );
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  /**
   * Host creates room
   */
  handleHostCreateRoom(socket, data, callback) {
    try {
      this.validateData(data, ['name']);

      this.validateData(data, ['name']); // roomId is optional

      const room = roomManager.createRoom(data.roomId);
      const roomWithHost = roomManager.joinAsHost(room.id, {
        id: socket.id,
        name: data.name,
      });

      socket.join(`room:${room.id}`);
      socket.data.room = room.id;
      socket.data.role = 'host';
      socket.data.name = data.name;

      logger.info('BuzzerServer', 'Host created room', {
        socketId: socket.id,
        roomId: room.id,
        hostName: data.name,
      });

      callback({ success: true, room: roomWithHost.getSummary() });
    } catch (error) {
      logger.error('BuzzerServer', 'Error creating room', {
        error: error.message,
        socketId: socket.id,
      });
      callback({ success: false, error: error.message });
    }
  }

  /**
   * Participant joins room
   */
  handleParticipantJoinRoom(socket, data, callback) {
    try {
      this.validateData(data, ['roomId', 'name']);

      const room = roomManager.joinAsParticipant(data.roomId, {
        id: socket.id,
        name: data.name,
      });

      socket.join(`room:${data.roomId}`);
      socket.data.room = data.roomId;
      socket.data.role = 'participant';
      socket.data.name = data.name;

      logger.info('BuzzerServer', 'Participant joined room', {
        socketId: socket.id,
        roomId: data.roomId,
        participantName: data.name,
      });

      this.io.to(`room:${data.roomId}`).emit('buzzer:participantJoined', {
        participantId: socket.id,
        participantName: data.name,
        room: room.getSummary(),
      });

      // Broadcast updated leaderboard to show new team
      this.io.to(`room:${data.roomId}`).emit('leaderboard:updated', {
        teams: room.getTeamScores(),
        roomId: data.roomId
      });

      callback({ success: true, room: room.getSummary() });
    } catch (error) {
      logger.error('BuzzerServer', 'Error joining room', {
        error: error.message,
        socketId: socket.id,
      });
      callback({ success: false, error: error.message });
    }
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

      if (result.alreadyBuzzed) {
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
        return;
      }

      // Valid buzz recorded
      logger.info('BuzzerServer', 'Participant buzzed', {
        roomId,
        participantId: socket.data.name,
        timestamp: data.timestamp,
        buzzCount: result.buzzes.length
      });

      const room = roomManager.getRoom(roomId);

      // Broadcast updated buzz list to all
      this.io.to(`room:${roomId}`).emit('buzzer:buzzesUpdated', {
        buzzes: result.buzzes,
        room: room.getSummary(),
      });

      callback({ success: true, buzzes: result.buzzes });
    } catch (error) {
      logger.error('BuzzerServer', 'Error processing buzz', {
        error: error.message,
        socketId: socket.id,
      });
      callback({ success: false, error: error.message });
    }
  }

  /**
   * Host marks a participant's answer as correct
   * Awards a point to the participant's team
   */
  handleMarkCorrect(socket, data, callback) {
    try {
      this.validateHostData(socket, data);
      this.validateData(data, ['participantId']);

      const roomId = socket.data.room;
      const room = roomManager.getRoom(roomId);
      
      if (!room) {
        throw new NotFoundError('Room');
      }

      const participant = room.participants.get(data.participantId);
      if (!participant) {
        throw new NotFoundError('Participant');
      }

      const result = room.addPointToTeam(participant.name);
      
      if (result) {
        logger.info('BuzzerServer', 'Point awarded to team', {
          roomId,
          participantId: data.participantId,
          participantName: participant.name,
          teamName: result.teamName,
          newScore: result.newScore
        });

        // Broadcast updated leaderboard to all clients in room
        this.io.to(`room:${roomId}`).emit('leaderboard:updated', {
          teams: room.getTeamScores(),
          roomId: roomId
        });

        callback({ success: true, teams: room.getTeamScores() });
      } else {
        callback({ success: false, error: 'Participant has no team' });
      }
    } catch (error) {
      logger.error('BuzzerServer', 'Error marking correct', {
        error: error.message,
        socketId: socket.id,
      });
      callback({ success: false, error: error.message });
    }
  }

  /**
   * Handle leaderboard data request
   */
  handleLeaderboardRequest(socket, data, callback) {
    try {
      this.validateData(data, ['roomId']);
      
      const room = roomManager.getRoom(data.roomId);
      
      if (!room) {
        throw new NotFoundError('Room');
      }

      // Join the room to receive updates
      socket.join(`room:${data.roomId}`);

      const teams = room.getTeamScores();
      logger.info('BuzzerServer', 'Leaderboard data requested', {
        socketId: socket.id,
        roomId: data.roomId,
        teamsCount: teams.length,
        teams: teams
      });

      // Send current leaderboard data
      socket.emit('leaderboard:updated', {
        teams: teams,
        roomId: data.roomId
      });

      if (callback) {
        callback({ success: true, teams: teams });
      }
    } catch (error) {
      logger.error('BuzzerServer', 'Error fetching leaderboard', {
        error: error.message,
        socketId: socket.id,
      });
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  }

  /**
   * Handle manual team point addition
   */
  handleTeamAddPoint(socket, data, callback) {
    try {
      this.validateData(data, ['roomId', 'teamName']);
      
      const room = roomManager.getRoom(data.roomId);
      
      if (!room) {
        throw new NotFoundError('Room');
      }

      // Get current score or initialize
      const currentScore = room.teamScores.get(data.teamName) || 0;
      room.teamScores.set(data.teamName, currentScore + 1);
      room.touch();

      logger.info('BuzzerServer', 'Point manually added to team', {
        roomId: data.roomId,
        teamName: data.teamName,
        newScore: currentScore + 1
      });

      // Broadcast updated leaderboard to all clients in room
      this.io.to(`room:${data.roomId}`).emit('leaderboard:updated', {
        teams: room.getTeamScores(),
        roomId: data.roomId
      });

      if (callback) {
        callback({ success: true, teams: room.getTeamScores() });
      }
    } catch (error) {
      logger.error('BuzzerServer', 'Error adding team point', {
        error: error.message,
        socketId: socket.id,
      });
      if (callback) {
        callback({ success: false, error: error.message });
      }
    }
  }

  /**
   * Handle manual team point removal
   */
  handleTeamRemovePoint(socket, data, callback) {
    try {
      this.validateData(data, ['roomId', 'teamName']);
      
      const room = roomManager.getRoom(data.roomId);
      
      if (!room) {
        throw new NotFoundError('Room');
      }

      // Get current score or initialize
      const currentScore = room.teamScores.get(data.teamName) || 0;
      const newScore = Math.max(0, currentScore - 1);
      room.teamScores.set(data.teamName, newScore);
      room.touch();

      logger.info('BuzzerServer', 'Point manually removed from team', {
        roomId: data.roomId,
        teamName: data.teamName,
        newScore: newScore
      });

      // Broadcast updated leaderboard to all clients in room
      this.io.to(`room:${data.roomId}`).emit('leaderboard:updated', {
        teams: room.getTeamScores(),
        roomId: data.roomId
      });

      if (callback) {
        callback({ success: true, teams: room.getTeamScores() });
      }
    } catch (error) {
      logger.error('BuzzerServer', 'Error removing team point', {
        error: error.message,
        socketId: socket.id,
      });
      if (callback) {
        callback({ success: false, error: error.message });
      }
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

  /**
   * Handle disconnect
   */
  handleDisconnect(socket) {
    try {
      const room = roomManager.leaveRoom(socket.id);

      if (room) {
        logger.info('BuzzerServer', 'User disconnected', {
          socketId: socket.id,
          role: socket.data.role,
          roomId: socket.data.room,
        });

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
      logger.error('BuzzerServer', 'Error handling disconnect', {
        error: error.message,
        socketId: socket.id,
      });
    }
  }
}

export default BuzzerServer;
