/**
 * Data Channel Manager
 * Handles WebRTC data channel communication
 */
class DataChannelManager {
  constructor() {
    this.channels = new Map(); // peerId -> data channel
  }

  /**
   * Create data channel (host side)
   */
  createDataChannel(peerConnection, peerId) {
    const dataChannel = peerConnection.createDataChannel('buzzer', {
      ordered: true,
    });
    this.setupDataChannel(dataChannel, peerId);
    this.channels.set(peerId, dataChannel);
    return dataChannel;
  }

  /**
   * Setup data channel event handlers
   */
  setupDataChannel(dataChannel, peerId) {
    dataChannel.onopen = () => {
      console.log(`[DataChannelManager] Channel opened with ${peerId}`);
      this.emit('channelOpen', { peerId });
    };

    dataChannel.onclose = () => {
      console.log(`[DataChannelManager] Channel closed with ${peerId}`);
      this.emit('channelClose', { peerId });
    };

    dataChannel.onerror = (error) => {
      console.error(`[DataChannelManager] Error with ${peerId}:`, error);
      this.emit('channelError', { peerId, error });
    };

    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emit('message', { peerId, message });
      } catch (error) {
        console.error(
          `[DataChannelManager] Error parsing message from ${peerId}:`,
          error
        );
      }
    };
  }

  /**
   * Handle incoming data channel (participant side)
   */
  onDataChannel(peerConnection, callback) {
    peerConnection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      const peerId = 'host'; // Participants only have one channel to host

      this.setupDataChannel(dataChannel, peerId);
      this.channels.set(peerId, dataChannel);

      if (callback) {
        callback(dataChannel, peerId);
      }
    };
  }

  /**
   * Send message
   */
  send(peerId, message) {
    const channel = this.channels.get(peerId);
    if (channel && channel.readyState === 'open') {
      channel.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  /**
   * Check if channel is open
   */
  isChannelOpen(peerId) {
    const channel = this.channels.get(peerId);
    return channel && channel.readyState === 'open';
  }

  /**
   * Get channel
   */
  getDataChannel(peerId) {
    return this.channels.get(peerId);
  }

  /**
   * Close channel
   */
  closeChannel(peerId) {
    const channel = this.channels.get(peerId);
    if (channel) {
      channel.close();
      this.channels.delete(peerId);
    }
  }

  /**
   * Close all channels
   */
  closeAllChannels() {
    this.channels.forEach((channel) => {
      channel.close();
    });
    this.channels.clear();
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

export default DataChannelManager;
