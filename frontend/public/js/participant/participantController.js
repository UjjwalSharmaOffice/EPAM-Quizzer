/**
 * Participant Controller
 * Manages participant-side logic and state
 */
class ParticipantController {
  constructor(signalingClient, peerManager, dataChannelManager) {
    this.signalingClient = signalingClient;
    this.peerManager = peerManager;
    this.dataChannelManager = dataChannelManager;

    this.participantId = null;
    this.participantName = null;
    this.roomId = null;
    this.hostId = null;
    this.peerConnection = null;
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

      // Setup event listeners
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
    this.signalingClient.on('signaling:offer', (data) => {
      this.handleHostOffer(data);
    });

    this.signalingClient.on('signaling:answer', (data) => {
      this.handleHostAnswer(data);
    });

    this.signalingClient.on('signaling:iceCandidate', (data) => {
      this.handleHostIceCandidate(data);
    });

    this.signalingClient.on('buzzer:hostLeft', () => {
      this.handleHostLeft();
    });

    this.dataChannelManager.on('message', (data) => {
      this.handleDataChannelMessage(data);
    });

    this.dataChannelManager.on('channelOpen', () => {
      console.log('[ParticipantController] Data channel opened to host');
      this.emit('connectedToHost');
    });
  }

  /**
   * Handle host offer
   */
  async handleHostOffer(data) {
    const { offer, iceServers } = data;

    try {
      // Create peer connection
      this.peerConnection = this.peerManager.createPeerConnection('host');

      // Update ICE servers
      this.peerManager.iceServers = iceServers;

      // Setup data channel listener
      this.dataChannelManager.onDataChannel(this.peerConnection);

      // Set remote description
      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      // Create answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Wait for ICE gathering
      await this.waitForIceGathering(this.peerConnection);

      // Send answer to host
      await this.signalingClient.participantSendAnswer(
        this.hostId,
        this.peerConnection.localDescription
      );

      console.log('[ParticipantController] Answer sent to host');
    } catch (error) {
      console.error('[ParticipantController] Error handling offer:', error);
    }
  }

  /**
   * Handle host answer
   */
  async handleHostAnswer(data) {
    const { answer } = data;

    if (this.peerConnection && answer) {
      try {
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
        console.log('[ParticipantController] Answer received from host');
      } catch (error) {
        console.error('[ParticipantController] Error setting remote description:', error);
      }
    }
  }

  /**
   * Handle ICE candidate from host
   */
  async handleHostIceCandidate(data) {
    const { candidate } = data;
    await this.peerManager.addIceCandidate('host', candidate);
  }

  /**
   * Handle ICE candidate from peer
   */
  async handlePeerIceCandidate(data) {
    const { candidate } = data;

    try {
      await this.signalingClient.participantAddIceCandidate(
        this.hostId,
        candidate
      );
    } catch (error) {
      console.error('[ParticipantController] Failed to send ICE candidate:', error);
    }
  }

  /**
   * Handle data channel message
   */
  handleDataChannelMessage(data) {
    const { message } = data;

    if (message.type === 'roundStart') {
      this.handleRoundStart();
    } else if (message.type === 'winner') {
      this.handleWinner(message);
    }
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
  handleWinner(message) {
    this.buzzerLocked = true;
    const isWinner = message.winnerId === this.participantId;

    console.log('[ParticipantController] Winner:', message.winnerName, isWinner ? '(YOU)' : '');
    this.emit('winner', {
      winnerId: message.winnerId,
      winnerName: message.winnerName,
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

    // Send buzz through data channel
    const success = this.dataChannelManager.send('host', {
      type: 'buzz',
      timestamp: performance.now(),
    });

    if (!success) {
      console.error('[ParticipantController] Failed to send buzz');
      this.hasLocalBuzzed = false;
      return false;
    }

    console.log('[ParticipantController] Buzzed!');
    this.emit('buzzed');

    // Also notify server
    try {
      await this.signalingClient.participantBuzz(performance.now());
    } catch (error) {
      console.error('[ParticipantController] Error notifying buzz:', error);
    }

    return true;
  }

  /**
   * Wait for ICE gathering
   */
  waitForIceGathering(peerConnection) {
    return new Promise((resolve) => {
      if (peerConnection.iceGatheringState === 'complete') {
        resolve();
      } else {
        const handler = () => {
          if (peerConnection.iceGatheringState === 'complete') {
            peerConnection.removeEventListener('icegatheringstatechange', handler);
            resolve();
          }
        };
        peerConnection.addEventListener('icegatheringstatechange', handler);
      }
    });
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
