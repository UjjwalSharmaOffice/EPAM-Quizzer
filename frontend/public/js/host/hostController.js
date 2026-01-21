/**
 * Host Controller
 * Manages host-side logic and state
 */
class HostController {
  constructor(signalingClient) {
    this.signalingClient = signalingClient;

    this.hostId = null;
    this.roomId = null;
    this.participants = new Map();
    this.buzzerLocked = false;
    this.winner = null;
  }

  /**
   * Create room and initialize as host
   */
  async createRoom(hostName) {
    try {
      const response = await this.signalingClient.hostCreateRoom(hostName);

      this.hostId = this.signalingClient.getSocketId();
      this.roomId = response.room.id;

      console.log('[HostController] Room created:', this.roomId);
      this.emit('roomCreated', response.room);

      this.setupEventListeners();

      return response.room;
    } catch (error) {
      console.error('[HostController] Failed to create room:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners from signaling client
   */
  setupEventListeners() {
    this.signalingClient.on('buzzer:participantJoined', (data) => {
      this.handleParticipantJoined(data);
    });

    this.signalingClient.on('buzzer:participantLeft', (data) => {
      this.handleParticipantLeft(data);
    });

    this.signalingClient.on('buzzer:buzzesUpdated', (data) => {
      console.log('[HostController] Received buzzesUpdated from client', data);
      this.handleBuzzesUpdated(data.buzzes);
    });

    this.signalingClient.on('buzzer:roundStarted', (data) => {
      console.log('[HostController] Round started');
      this.emit('roundStarted');
    });
  }

  /**
   * Handle participant joined event
   */
  handleParticipantJoined(data) {
    const participantId = data.participantId;

    if (!this.participants.has(participantId)) {
      this.participants.set(participantId, {
        id: participantId,
        name: data.participantName,
        buzzed: false,
        winner: false,
      });

      console.log('[HostController] Participant joined:', data.participantName);
      this.emit('participantJoined', data);
    }
  }

  /**
   * Handle participant left event
   */
  handleParticipantLeft(data) {
    const participantId = data.participantId;

    if (this.participants.has(participantId)) {
      this.participants.delete(participantId);
      console.log('[HostController] Participant left:', data.participantName);
      this.emit('participantLeft', data);
    }
  }

  /**
   * Handle buzzes updated
   */
  handleBuzzesUpdated(buzzes) {
    // Reset ranking for all first
    this.participants.forEach(p => {
      p.rank = null;
      p.buzzed = false;
    });

    // Update local participants state with rank
    buzzes.forEach((buzz, index) => {
      const p = this.participants.get(buzz.participantId);
      if (p) {
        p.buzzed = true;
        p.buzzTimestamp = buzz.timestamp;
        p.rank = index + 1;
        p.winner = index === 0;
      }
    });

    console.log('[HostController] Buzzes updated:', buzzes.length);
    this.emit('buzzesUpdated', buzzes);
  }

  /**
   * Start new round
   */
  async startRound() {
    this.buzzerLocked = false;
    this.winner = null;

    this.participants.forEach((participant) => {
      participant.buzzed = false;
      participant.winner = false;
    });

    try {
      await this.signalingClient.hostStartRound();
      console.log('[HostController] Round started');
    } catch (error) {
      console.error('[HostController] Failed to start round:', error);
      throw error;
    }
  }

  /**
   * Get room info
   */
  getRoomInfo() {
    return {
      roomId: this.roomId,
      hostId: this.hostId,
      participantCount: this.participants.size,
      buzzerLocked: this.buzzerLocked,
      winner: this.winner,
      participants: Array.from(this.participants.values()),
    };
  }

  /**
   * Setup listener
   */
  on(event, callback) {
    if (!this.listeners) {
      this.listeners = new Map();
    }
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Emit event
   */
  emit(event, data) {
    if (this.listeners && this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => callback(data));
    }
  }
}

export default HostController;
