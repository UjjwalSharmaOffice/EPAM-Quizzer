/**
 * Host Controller
 * Manages host-side logic and state
 */
class HostController {
  constructor(signalingClient, peerManager, dataChannelManager) {
    this.signalingClient = signalingClient;
    this.peerManager = peerManager;
    this.dataChannelManager = dataChannelManager;

    this.hostId = null;
    this.roomId = null;
    this.participants = new Map(); // participantId -> participant info
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

      // Setup event listeners
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

    this.signalingClient.on('signaling:answer', (data) => {
      this.handleParticipantAnswer(data);
    });

    this.signalingClient.on('signaling:iceCandidate', (data) => {
      this.handleParticipantIceCandidate(data);
    });

    this.peerManager.on('iceCandidate', (data) => {
      this.handlePeerIceCandidate(data);
    });

    this.dataChannelManager.on('message', (data) => {
      this.handleDataChannelMessage(data);
    });

    this.dataChannelManager.on('channelOpen', (data) => {
      console.log('[HostController] Data channel opened with', data.peerId);
      this.emit('participantConnected', data);
    });
  }

  /**
   * Handle participant joined event
   */
  async handleParticipantJoined(data) {
    const participantId = data.participantId;

    if (!this.participants.has(participantId)) {
      this.participants.set(participantId, {
        id: participantId,
        name: data.participantName,
        buzzed: false,
        winner: false,
        peerConnection: null,
      });

      console.log('[HostController] Participant joined:', data.participantName);
      this.emit('participantJoined', data);

      // Initiate WebRTC connection
      try {
        await this.initiateWebRTCWithParticipant(participantId);
      } catch (error) {
        console.error('[HostController] Failed to setup WebRTC:', error);
      }
    }
  }

  /**
   * Handle participant left event
   */
  handleParticipantLeft(data) {
    const participantId = data.participantId;

    if (this.participants.has(participantId)) {
      this.participants.delete(participantId);
      this.peerManager.closePeerConnection(participantId);
      this.dataChannelManager.closeChannel(participantId);

      console.log('[HostController] Participant left:', data.participantName);
      this.emit('participantLeft', data);
    }
  }

  /**
   * Initiate WebRTC connection with participant
   */
  async initiateWebRTCWithParticipant(participantId) {
    const peerConnection = this.peerManager.createPeerConnection(participantId);

    // Create data channel
    const dataChannel = this.dataChannelManager.createDataChannel(
      peerConnection,
      participantId
    );

    // Create offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    // Wait for ICE gathering
    await this.waitForIceGathering(peerConnection);

    // Send offer to participant
    try {
      await this.signalingClient.hostSendOffer(
        participantId,
        peerConnection.localDescription
      );
    } catch (error) {
      console.error('[HostController] Failed to send offer:', error);
    }
  }

  /**
   * Wait for ICE gathering to complete
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
   * Handle participant answer
   */
  async handleParticipantAnswer(data) {
    const participantId = data.from;
    const peerConnection = this.peerManager.getPeerConnection(participantId);

    if (peerConnection && data.answer) {
      try {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(data.answer)
        );
        console.log('[HostController] Participant answer received');
      } catch (error) {
        console.error('[HostController] Error setting remote description:', error);
      }
    }
  }

  /**
   * Handle ICE candidate from participant
   */
  async handleParticipantIceCandidate(data) {
    const participantId = data.from;
    await this.peerManager.addIceCandidate(participantId, data.candidate);
  }

  /**
   * Handle ICE candidate from peer
   */
  async handlePeerIceCandidate(data) {
    const participantId = data.peerId;

    try {
      await this.signalingClient.hostAddIceCandidate(
        participantId,
        data.candidate
      );
    } catch (error) {
      console.error('[HostController] Failed to add ICE candidate:', error);
    }
  }

  /**
   * Handle data channel message
   */
  handleDataChannelMessage(data) {
    const { peerId, message } = data;

    if (message.type === 'buzz') {
      this.recordBuzz(peerId);
    }
  }

  /**
   * Record buzz from participant
   */
  recordBuzz(participantId) {
    const participant = this.participants.get(participantId);

    if (!participant) {
      return;
    }

    // Ignore if buzzer already locked or participant already buzzed
    if (this.buzzerLocked || participant.buzzed) {
      return;
    }

    // This is the winner!
    this.buzzerLocked = true;
    participant.buzzed = true;
    participant.winner = true;
    this.winner = participant;

    console.log('[HostController] Winner:', participant.name);
    this.emit('winner', participant);

    // Notify all participants
    this.broadcastToAllParticipants({
      type: 'winner',
      winnerId: participantId,
      winnerName: participant.name,
    });
  }

  /**
   * Start new round
   */
  async startRound() {
    this.buzzerLocked = false;
    this.winner = null;

    // Reset all participants
    this.participants.forEach((participant) => {
      participant.buzzed = false;
      participant.winner = false;
    });

    try {
      await this.signalingClient.hostStartRound();
      console.log('[HostController] Round started');
      this.emit('roundStarted');

      // Notify participants through data channels
      this.broadcastToAllParticipants({
        type: 'roundStart',
      });
    } catch (error) {
      console.error('[HostController] Failed to start round:', error);
      throw error;
    }
  }

  /**
   * Broadcast message to all participants
   */
  broadcastToAllParticipants(message) {
    this.participants.forEach((participant) => {
      this.dataChannelManager.send(participant.id, message);
    });
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
