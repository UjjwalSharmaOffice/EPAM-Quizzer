/**
 * WebRTC Peer Manager
 * Handles peer connection creation and management
 */
class PeerManager {
  constructor(iceServers = []) {
    this.peers = new Map(); // peerId -> peer connection
    this.iceServers = iceServers;
  }

  /**
   * Create peer connection
   */
  createPeerConnection(peerId) {
    const config = {
      iceServers: this.iceServers,
    };

    const peerConnection = new RTCPeerConnection(config);

    // Setup event handlers
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit('iceCandidate', {
          peerId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log(
        `[PeerManager] Connection state with ${peerId}:`,
        peerConnection.connectionState
      );
      this.emit('connectionStateChange', {
        peerId,
        state: peerConnection.connectionState,
      });
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log(
        `[PeerManager] ICE connection state with ${peerId}:`,
        peerConnection.iceConnectionState
      );
    };

    this.peers.set(peerId, peerConnection);
    return peerConnection;
  }

  /**
   * Get peer connection
   */
  getPeerConnection(peerId) {
    return this.peers.get(peerId);
  }

  /**
   * Close peer connection
   */
  closePeerConnection(peerId) {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.close();
      this.peers.delete(peerId);
    }
  }

  /**
   * Close all peer connections
   */
  closeAllPeers() {
    this.peers.forEach((peer) => {
      peer.close();
    });
    this.peers.clear();
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(peerId, candidate) {
    const peer = this.peers.get(peerId);
    if (peer && candidate) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error(
          `[PeerManager] Error adding ICE candidate for ${peerId}:`,
          error
        );
      }
    }
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

  /**
   * Get connection count
   */
  getConnectionCount() {
    return this.peers.size;
  }
}

export default PeerManager;
