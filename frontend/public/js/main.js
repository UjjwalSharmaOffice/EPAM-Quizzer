import SignalingClient from './api/signalingClient.js';
import HostController from './host/hostController.js';
import ParticipantController from './participant/participantController.js';
import UIManager from './ui/uiManager.js';

/**
 * Main application
 */
class App {
  constructor() {
    this.signalingClient = new SignalingClient('http://localhost:3000');
    this.uiManager = new UIManager();

    this.hostController = null;
    this.participantController = null;

    this.initializeEventListeners();
  }

  /**
   * Initialize UI event listeners
   */
  initializeEventListeners() {
    document.getElementById('hostBtn').addEventListener('click', () =>
      this.selectHostRole()
    );
    document.getElementById('participantBtn').addEventListener('click', () =>
      this.selectParticipantRole()
    );

    document.getElementById('hostStartBtn').addEventListener('click', () =>
      this.hostStartRound()
    );

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

      await this.signalingClient.connect();

      this.hostController = new HostController(this.signalingClient);

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

      this.hostController.on('buzzesUpdated', (buzzes) => {
        this.uiManager.updateHostBuzzList(buzzes);
        this.uiManager.updateHostParticipants(this.hostController.getRoomInfo().participants);
      });

      this.hostController.on('roundStarted', () => {
        this.uiManager.updateHostStatus('Round active - waiting for buzz');
        this.uiManager.updateHostBuzzList(null);
        this.uiManager.updateHostParticipants(this.hostController.getRoomInfo().participants);
      });

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
      await this.signalingClient.connect();

      this.participantController = new ParticipantController(this.signalingClient);

      this.participantController.on('joinedRoom', (room) => {
        this.uiManager.showParticipantScreen();
        const inputs = this.uiManager.getParticipantInputs();
        this.uiManager.showParticipantBuzzer(inputs.name);
        this.uiManager.updateParticipantStatus('Connected - waiting for round to start');
      });

      this.participantController.on('roundStarted', () => {
        this.uiManager.setParticipantBuzzButtonState(true, false, false);
        this.uiManager.updateParticipantBuzzStatus(null);
        this.uiManager.updateParticipantStatus('Round active - Ready to buzz!');
      });

      this.participantController.on('buzzed', () => {
        this.uiManager.setParticipantBuzzButtonState(false, true, false);
        this.uiManager.updateParticipantStatus('You buzzed!');
      });

      this.participantController.on('buzzesUpdated', (data) => {
        this.uiManager.updateParticipantBuzzStatus(data);
        this.uiManager.updateParticipantStatus(
          data.myState.isWinner
            ? 'You are the winner!'
            : data.myState.isBuzzed
              ? `You buzzed (Rank #${data.myState.rank})`
              : `${data.winnerName} buzzed first`
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

document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
  console.log('[App] Application initialized');
});
