import SignalingClient from './js/api/signalingClient.js';
import PeerManager from './js/webrtc/peerManager.js';
import DataChannelManager from './js/webrtc/dataChannelManager.js';
import HostController from './js/host/hostController.js';
import ParticipantController from './js/participant/participantController.js';
import UIManager from './js/ui/uiManager.js';

/**
 * Main application
 */
class App {
  constructor() {
    this.signalingClient = new SignalingClient('http://localhost:3000');
    this.peerManager = new PeerManager();
    this.dataChannelManager = new DataChannelManager();
    this.uiManager = new UIManager();

    this.hostController = null;
    this.participantController = null;

    this.initializeEventListeners();
  }

  /**
   * Initialize UI event listeners
   */
  initializeEventListeners() {
    // Role selection
    document.getElementById('hostBtn').addEventListener('click', () =>
      this.selectHostRole()
    );
    document.getElementById('participantBtn').addEventListener('click', () =>
      this.selectParticipantRole()
    );

    // Host controls
    document.getElementById('hostStartBtn').addEventListener('click', () =>
      this.hostStartRound()
    );

    // Participant controls
    document.getElementById('participantJoinBtn').addEventListener('click', () =>
      this.participantJoin()
    );
    document.getElementById('participantBuzzBtn').addEventListener('click', () =>
      this.participantBuzz()
    );
  }

  /**
   * Select host role
   */
  async selectHostRole() {
    try {
      const hostName = this.uiManager.getHostNameInput();
      if (!hostName) return;

      // Connect to server
      await this.signalingClient.connect();

      // Create host controller
      this.hostController = new HostController(
        this.signalingClient,
        this.peerManager,
        this.dataChannelManager
      );

      // Setup host event listeners
      this.hostController.on('roomCreated', (room) => {
        this.uiManager.showHostScreen();
        this.uiManager.updateHostRoom(room.id, hostName);
      });

      this.hostController.on('participantJoined', (data) => {
        const info = this.hostController.getRoomInfo();
        this.uiManager.updateHostParticipants(info.participants);
        this.uiManager.updateHostStatus(
          `${info.participantCount} participant(s) connected`
        );
      });

      this.hostController.on('participantLeft', (data) => {
        const info = this.hostController.getRoomInfo();
        this.uiManager.updateHostParticipants(info.participants);
        this.uiManager.updateHostStatus(
          `${info.participantCount} participant(s) connected`
        );
      });

      this.hostController.on('participantConnected', (data) => {
        console.log('[App] Participant connected:', data.peerId);
        this.uiManager.updateHostStatus('Participant connected');
      });

      this.hostController.on('winner', (winner) => {
        this.uiManager.updateHostWinner(winner);
        this.hostController.getRoomInfo(); // Update list
        this.uiManager.updateHostParticipants(this.hostController.getRoomInfo().participants);
      });

      this.hostController.on('roundStarted', () => {
        this.uiManager.updateHostStatus('Round active - waiting for buzz');
        this.uiManager.updateHostWinner(null);
        this.uiManager.updateHostParticipants(this.hostController.getRoomInfo().participants);
      });

      // Create room
      await this.hostController.createRoom(hostName);
    } catch (error) {
      this.uiManager.showError(error.message);
      console.error('[App] Error selecting host role:', error);
    }
  }

  /**
   * Select participant role
   */
  async selectParticipantRole() {
    try {
      // Connect to server
      await this.signalingClient.connect();

      // Create participant controller
      this.participantController = new ParticipantController(
        this.signalingClient,
        this.peerManager,
        this.dataChannelManager
      );

      // Setup participant event listeners
      this.participantController.on('joinedRoom', (room) => {
        this.uiManager.showParticipantScreen();
      });

      this.participantController.on('connectedToHost', () => {
        const inputs = this.uiManager.getParticipantInputs();
        this.uiManager.showParticipantBuzzer(inputs.name);
        this.uiManager.updateParticipantStatus('Connected to host - Ready to buzz');
      });

      this.participantController.on('roundStarted', () => {
        this.uiManager.setParticipantBuzzButtonState(true, false, false);
        this.uiManager.updateParticipantWinner(null);
        this.uiManager.updateParticipantStatus('Round active - Ready to buzz!');
      });

      this.participantController.on('buzzed', () => {
        this.uiManager.setParticipantBuzzButtonState(false, true, false);
        this.uiManager.updateParticipantStatus('You buzzed!');
      });

      this.participantController.on('winner', (data) => {
        this.uiManager.updateParticipantWinner(data);
        this.uiManager.updateParticipantStatus(
          data.isWinner ? 'You are the winner!' : `${data.winnerName} is the winner`
        );
      });

      this.participantController.on('hostLeft', () => {
        this.uiManager.showError('Host disconnected');
        this.uiManager.showRoleScreen();
      });

      this.uiManager.showParticipantScreen();
    } catch (error) {
      this.uiManager.showError(error.message);
      console.error('[App] Error selecting participant role:', error);
    }
  }

  /**
   * Host start round
   */
  async hostStartRound() {
    try {
      this.uiManager.setHostStartButtonEnabled(false);
      await this.hostController.startRound();
      this.uiManager.setHostStartButtonEnabled(true);
    } catch (error) {
      this.uiManager.showError(error.message);
      this.uiManager.setHostStartButtonEnabled(true);
    }
  }

  /**
   * Participant join room
   */
  async participantJoin() {
    try {
      const { roomId, name } = this.uiManager.getParticipantInputs();

      if (!roomId) {
        this.uiManager.showError('Please enter room ID');
        return;
      }

      if (!name) {
        this.uiManager.showError('Please enter your name');
        return;
      }

      this.uiManager.setParticipantJoinButtonEnabled(false);
      await this.participantController.joinRoom(roomId, name);
      this.uiManager.setParticipantJoinButtonEnabled(true);
    } catch (error) {
      this.uiManager.showError(error.message);
      this.uiManager.setParticipantJoinButtonEnabled(true);
    }
  }

  /**
   * Participant buzz
   */
  async participantBuzz() {
    try {
      const success = await this.participantController.buzz();
      if (!success) {
        this.uiManager.showError('Cannot buzz now');
      }
    } catch (error) {
      this.uiManager.showError(error.message);
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  console.log('[App] Application initialized');
});
