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

      if (p.rank) {
        if (p.winner) {
          statusBadge = 'winner';
          statusText = `#${p.rank} Winner 🏆`;
        } else {
          statusBadge = 'buzzed';
          statusText = `#${p.rank} Buzzed`;
        }
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
   * Update host buzz list display
   */
  updateHostBuzzList(buzzes) {
    if (buzzes && buzzes.length > 0) {
      let html = '<div class="winner-content"><div class="winner-emoji">📊</div><div class="winner-text">Buzzer Order</div></div><div class="buzz-list-container"><ol class="buzz-list">';

      buzzes.forEach((buzz, index) => {
        const isWinner = index === 0;
        const timeDiff = buzz.diff > 0 ? `+${(buzz.diff / 1000).toFixed(3)}s` : 'WINNER';

        html += `
            <li class="buzz-item ${isWinner ? 'winner' : ''}">
              <span class="rank">#${index + 1}</span>
              <span class="name">${buzz.name}</span>
              <span class="time">${timeDiff}</span>
            </li>
          `;
      });

      html += '</ol></div>';

      this.elements.hostWinnerDisplay.innerHTML = html;
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
    this.updateParticipantBuzzStatus(null);
  }

  /**
   * Update participant status
   */
  updateParticipantStatus(status) {
    this.elements.participantStatus.textContent = status;
  }

  /**
   * Update participant buzz status
   */
  updateParticipantBuzzStatus(data) {
    if (data && data.myState.isBuzzed) {
      const myState = data.myState;
      if (myState.isWinner) {
        this.elements.participantWinnerDisplay.innerHTML = `
            <div class="winner-content">
              <div class="winner-emoji">🎉</div>
              <div class="winner-text">YOU WON!</div>
              <div class="rank-text">Rank #1</div>
            </div>
          `;
        this.elements.participantBuzzBtn.textContent = '✓ You Buzzed First!';
      } else {
        this.elements.participantWinnerDisplay.innerHTML = `
            <div class="winner-content">
              <div class="winner-text">Rank #${myState.rank}</div>
              <div class="sub-text">Winner: ${data.winnerName}</div>
            </div>
          `;
        this.elements.participantBuzzBtn.textContent = `✓ Buzzed (#${myState.rank})`;
      }
      this.elements.participantWinnerDisplay.classList.add('active');
      this.elements.participantBuzzBtn.disabled = true;
    } else if (data) {
      // Someone else buzzed but I didn't (or I'm not in the list yet? theoretically impossible if locked=true and I haven't buzzed? 
      // actually if I haven't buzzed, I just see the winner)
      this.elements.participantWinnerDisplay.innerHTML = `
            <div class="winner-content">
              <div class="winner-text">${data.winnerName} buzzed first!</div>
            </div>
          `;
      this.elements.participantWinnerDisplay.classList.add('active');
      // Don't disable button here if we want to allow late buzzing? 
      // The requirement says "get sequence of the person who pushed afterwards". 
      // So we should NOT lock the button for me if I haven't buzzed.
      // Only lock if I have buzzed.
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
