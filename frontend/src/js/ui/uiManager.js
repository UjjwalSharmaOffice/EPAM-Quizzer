/**
 * UI Manager
 * Handles all UI updates and interactions
 */
class UIManager {
  constructor() {
    this.currentRole = null;
    this.elements = {};
    this.initializeElements();
  }

  /**
   * Initialize DOM element references
   */
  initializeElements() {
    // Screens
    this.elements.roleScreen = document.getElementById('roleScreen');
    this.elements.hostScreen = document.getElementById('hostScreen');
    this.elements.participantScreen = document.getElementById('participantScreen');

    // Host elements
    this.elements.hostRoomId = document.getElementById('hostRoomId');
    this.elements.hostHostName = document.getElementById('hostHostName');
    this.elements.hostStartBtn = document.getElementById('hostStartBtn');
    this.elements.hostParticipantsList = document.getElementById('hostParticipantsList');
    this.elements.hostWinnerDisplay = document.getElementById('hostWinnerDisplay');
    this.elements.hostStatus = document.getElementById('hostStatus');

    // Participant elements
    this.elements.participantRoomIdInput = document.getElementById('participantRoomIdInput');
    this.elements.participantNameInput = document.getElementById('participantNameInput');
    this.elements.participantJoinBtn = document.getElementById('participantJoinBtn');
    this.elements.participantBuzzBtn = document.getElementById('participantBuzzBtn');
    this.elements.participantWinnerDisplay = document.getElementById('participantWinnerDisplay');
    this.elements.participantStatus = document.getElementById('participantStatus');
    this.elements.joinSection = document.getElementById('joinSection');
    this.elements.buzzerSection = document.getElementById('buzzerSection');
  }

  /**
   * Show role selection screen
   */
  showRoleScreen() {
    this.hideAllScreens();
    this.elements.roleScreen.style.display = 'block';
  }

  /**
   * Show host screen
   */
  showHostScreen() {
    this.hideAllScreens();
    this.elements.hostScreen.style.display = 'block';
    this.currentRole = 'host';
  }

  /**
   * Show participant screen
   */
  showParticipantScreen() {
    this.hideAllScreens();
    this.elements.participantScreen.style.display = 'block';
    this.elements.joinSection.style.display = 'block';
    this.elements.buzzerSection.style.display = 'none';
    this.currentRole = 'participant';
  }

  /**
   * Hide all screens
   */
  hideAllScreens() {
    this.elements.roleScreen.style.display = 'none';
    this.elements.hostScreen.style.display = 'none';
    this.elements.participantScreen.style.display = 'none';
  }

  /**
   * Update host room display
   */
  updateHostRoom(roomId, hostName) {
    this.elements.hostRoomId.textContent = roomId;
    this.elements.hostHostName.textContent = hostName;
    this.updateHostStatus('Ready for participants');
  }

  /**
   * Update host participants list
   */
  updateHostParticipants(participants) {
    if (participants.length === 0) {
      this.elements.hostParticipantsList.innerHTML =
        '<div class="empty-message">No participants yet</div>';
      return;
    }

    let html = '';
    participants.forEach((p) => {
      let statusBadge = 'waiting';
      let statusText = 'Waiting';

      if (p.winner) {
        statusBadge = 'winner';
        statusText = 'Winner ✓';
      } else if (p.buzzed) {
        statusBadge = 'buzzed';
        statusText = 'Buzzed';
      }

      html += `
        <div class="participant-item">
          <span class="participant-name">${p.name}</span>
          <span class="participant-status ${statusBadge}">${statusText}</span>
        </div>
      `;
    });

    this.elements.hostParticipantsList.innerHTML = html;
  }

  /**
   * Update host status
   */
  updateHostStatus(status) {
    this.elements.hostStatus.textContent = status;
  }

  /**
   * Update host winner display
   */
  updateHostWinner(winner) {
    if (winner) {
      this.elements.hostWinnerDisplay.innerHTML = `
        <div class="winner-content">
          <div class="winner-emoji">🎉</div>
          <div class="winner-text">${winner.name} BUZZED FIRST!</div>
        </div>
      `;
      this.elements.hostWinnerDisplay.classList.add('active');
    } else {
      this.elements.hostWinnerDisplay.innerHTML = '<div>Waiting for buzzer...</div>';
      this.elements.hostWinnerDisplay.classList.remove('active');
    }
  }

  /**
   * Enable/disable host start button
   */
  setHostStartButtonEnabled(enabled) {
    this.elements.hostStartBtn.disabled = !enabled;
  }

  /**
   * Show participant join form
   */
  showParticipantJoinForm() {
    this.elements.joinSection.style.display = 'block';
    this.elements.buzzerSection.style.display = 'none';
    this.elements.participantRoomIdInput.value = '';
    this.elements.participantNameInput.value = '';
  }

  /**
   * Show participant buzzer
   */
  showParticipantBuzzer(participantName) {
    this.elements.joinSection.style.display = 'none';
    this.elements.buzzerSection.style.display = 'block';
    this.elements.participantBuzzBtn.disabled = false;
    this.elements.participantBuzzBtn.textContent = 'BUZZ!';
    this.updateParticipantStatus(`Connected as: ${participantName}`);
    this.updateParticipantWinner(null);
  }

  /**
   * Update participant status
   */
  updateParticipantStatus(status) {
    this.elements.participantStatus.textContent = status;
  }

  /**
   * Update participant winner display
   */
  updateParticipantWinner(winner) {
    if (winner) {
      if (winner.isWinner) {
        this.elements.participantWinnerDisplay.innerHTML = `
          <div class="winner-content">
            <div class="winner-emoji">🎉</div>
            <div class="winner-text">YOU WIN!</div>
          </div>
        `;
        this.elements.participantBuzzBtn.disabled = true;
        this.elements.participantBuzzBtn.textContent = '✓ You Buzzed First!';
      } else {
        this.elements.participantWinnerDisplay.innerHTML = `
          <div class="winner-content">
            <div class="winner-text">${winner.winnerName} buzzed first!</div>
          </div>
        `;
        this.elements.participantBuzzBtn.disabled = true;
        this.elements.participantBuzzBtn.textContent = '🔒 Locked';
      }
      this.elements.participantWinnerDisplay.classList.add('active');
    } else {
      this.elements.participantWinnerDisplay.innerHTML = '<div>Waiting for host...</div>';
      this.elements.participantWinnerDisplay.classList.remove('active');
    }
  }

  /**
   * Set participant buzz button state
   */
  setParticipantBuzzButtonState(enabled, buzzed, locked) {
    this.elements.participantBuzzBtn.disabled = !enabled;

    if (locked) {
      this.elements.participantBuzzBtn.textContent = '🔒 Locked';
    } else if (buzzed) {
      this.elements.participantBuzzBtn.textContent = '✓ Buzzed';
    } else {
      this.elements.participantBuzzBtn.textContent = 'BUZZ!';
    }
  }

  /**
   * Show error message
   */
  showError(message) {
    alert(`Error: ${message}`);
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    console.log('Success:', message);
  }

  /**
   * Get host name input
   */
  getHostNameInput() {
    const input = prompt('Enter your name:');
    return input ? input.trim() : null;
  }

  /**
   * Get participant inputs
   */
  getParticipantInputs() {
    const roomId = this.elements.participantRoomIdInput.value.trim();
    const name = this.elements.participantNameInput.value.trim();

    return { roomId, name };
  }

  /**
   * Enable/disable participant join button
   */
  setParticipantJoinButtonEnabled(enabled) {
    this.elements.participantJoinBtn.disabled = !enabled;
  }
}

export default UIManager;
