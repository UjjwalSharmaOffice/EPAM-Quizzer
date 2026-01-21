/**
 * Participant Controller
 * Manages participant-side logic and state
 */
class ParticipantController {
  constructor(signalingClient) {
    this.signalingClient = signalingClient;

    this.participantId = null;
    this.participantName = null;
    this.roomId = null;
    this.hostId = null;
    this.hasLocalBuzzed = false;
    this.buzzerLocked = false;
  }

  /**
   * Join room as participant
   */
  async joinRoom(roomId, participantName) {
    try {
      const response = await this.signalingClient.participantJoinRoom(
        roomId,
        participantName
      );

      this.participantId = this.signalingClient.getSocketId();
      this.participantName = participantName;
      this.roomId = roomId;
      this.hostId = response.room.hostId;

      console.log('[ParticipantController] Joined room:', roomId);
      this.emit('joinedRoom', response.room);

      this.setupEventListeners();

      return response.room;
    } catch (error) {
      console.error('[ParticipantController] Failed to join room:', error);
      throw error;
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    this.signalingClient.on('buzzer:hostLeft', () => {
      this.handleHostLeft();
    });

    this.signalingClient.on('buzzer:roundStarted', () => {
      this.handleRoundStart();
    });

    this.signalingClient.on('buzzer:winner', (data) => {
      this.handleWinner(data);
    });
  }

  /**
   * Handle round start
   */
  handleRoundStart() {
    this.hasLocalBuzzed = false;
    this.buzzerLocked = false;

    console.log('[ParticipantController] Round started');
    this.emit('roundStarted');
  }

  /**
   * Handle winner announcement
   */
  handleWinner(data) {
    this.buzzerLocked = true;
    const isWinner = data.winnerId === this.participantId;

    console.log('[ParticipantController] Winner:', data.winnerName, isWinner ? '(YOU)' : '');
    this.emit('winner', {
      winnerId: data.winnerId,
      winnerName: data.winnerName,
      isWinner,
    });
  }

  /**
   * Handle host disconnection
   */
  handleHostLeft() {
    console.log('[ParticipantController] Host left');
    this.emit('hostLeft');
  }

  /**
   * Buzz!
   */
  async buzz() {
    if (this.buzzerLocked || this.hasLocalBuzzed) {
      console.log('[ParticipantController] Cannot buzz');
      return false;
    }

    this.hasLocalBuzzed = true;

    try {
      const result = await this.signalingClient.participantBuzz(performance.now());

      if (result.success) {
        console.log('[ParticipantController] Buzzed!');
        this.emit('buzzed');
        return true;
      } else {
        console.log('[ParticipantController] Buzz rejected:', result.error);
        this.hasLocalBuzzed = false;
        return false;
      }
    } catch (error) {
      console.error('[ParticipantController] Error buzzing:', error);
      this.hasLocalBuzzed = false;
      return false;
    }
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      participantId: this.participantId,
      participantName: this.participantName,
      roomId: this.roomId,
      hasLocalBuzzed: this.hasLocalBuzzed,
      buzzerLocked: this.buzzerLocked,
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

export default ParticipantController;
