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

    // Modal elements
    this.elements.nameTeamModal = document.getElementById('nameTeamModal');
    this.elements.modalNameInput = document.getElementById('modalNameInput');
    this.elements.modalTeamInput = document.getElementById('modalTeamInput');
    this.elements.modalSubmitBtn = document.getElementById('modalSubmitBtn');
    this.elements.modalCancelBtn = document.getElementById('modalCancelBtn');

    // Host elements
    this.elements.hostRoomId = document.getElementById('hostRoomId');
    this.elements.hostHostName = document.getElementById('hostHostName');
    this.elements.hostStartBtn = document.getElementById('hostStartBtn');
    this.elements.hostTopThreeList = document.getElementById('hostTopThreeList');
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

    // Group participants by team
    const teams = {};
    const noTeam = [];

    participants.forEach((p) => {
      // Extract team from name if in format "Name (Team)"
      const teamMatch = p.name.match(/\(([^)]+)\)$/);
      const teamName = teamMatch ? teamMatch[1] : null;

      if (teamName) {
        if (!teams[teamName]) {
          teams[teamName] = [];
        }
        teams[teamName].push(p);
      } else {
        noTeam.push(p);
      }
    });

    let html = '';

    // Render teams
    Object.keys(teams).sort().forEach((teamName) => {
      html += `
        <div class="team-section">
          <div class="team-header">${teamName}</div>
          <div class="team-members">
      `;

      teams[teamName].forEach((p) => {
        let statusBadge = 'waiting';
        let statusText = 'Waiting';

        if (p.rank) {
          if (p.winner) {
            statusBadge = 'winner';
            statusText = `#${p.rank} Winner`;
          } else {
            statusBadge = 'buzzed';
            statusText = `#${p.rank} Buzzed`;
          }
        } else if (p.buzzed) {
          statusBadge = 'buzzed';
          statusText = 'Buzzed';
        }

        // Remove team name from display
        const displayName = p.name.replace(/\s*\([^)]+\)$/, '');

        html += `
          <div class="participant-item">
            <span class="participant-name">${displayName}</span>
            <span class="participant-status ${statusBadge}">${statusText}</span>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    // Render participants without teams
    if (noTeam.length > 0) {
      if (Object.keys(teams).length > 0) {
        html += `
          <div class="team-section">
            <div class="team-header">Individual Participants</div>
            <div class="team-members">
        `;
      }

      noTeam.forEach((p) => {
        let statusBadge = 'waiting';
        let statusText = 'Waiting';

        if (p.rank) {
          if (p.winner) {
            statusBadge = 'winner';
            statusText = `#${p.rank} Winner`;
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

      if (Object.keys(teams).length > 0) {
        html += `
            </div>
          </div>
        `;
      }
    }

    this.elements.hostParticipantsList.innerHTML = html;
    
    // Update top 3 participants list
    this.updateTopThreeParticipants(participants);
  }

  /**
   * Update top 3 participants display
   */
  updateTopThreeParticipants(participants) {
    if (participants.length === 0) {
      this.elements.hostTopThreeList.innerHTML =
        '<div class="empty-state"><div class="empty-state-text">Waiting for participants to join...</div></div>';
      return;
    }

    // Sort by rank (buzzed participants have ranks, others don't)
    const buzzedParticipants = participants
      .filter(p => p.rank)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 3);

    if (buzzedParticipants.length === 0) {
      this.elements.hostTopThreeList.innerHTML =
        '<div class="empty-state"><div class="empty-state-text">No one has buzzed yet...</div></div>';
      return;
    }

    let html = '<div class="top-three-container">';

    buzzedParticipants.forEach((p, index) => {
      // Extract team from name if in format "Name (Team)"
      const teamMatch = p.name.match(/\(([^)]+)\)$/);
      const teamName = teamMatch ? teamMatch[1] : 'No Team';
      const displayName = p.name.replace(/\s*\([^)]+\)$/, '');

      const medalEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      const statusText = p.winner ? 'WINNER' : `Rank #${p.rank}`;

      html += `
        <div class="top-three-item rank-${index + 1}">
          <div class="top-three-medal">${medalEmoji}</div>
          <div class="top-three-info">
            <div class="top-three-rank">Position ${index + 1}</div>
            <div class="top-three-name">${displayName}</div>
            <div class="top-three-team">${teamName}</div>
            <div class="top-three-status">${statusText}</div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    this.elements.hostTopThreeList.innerHTML = html;
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
      let html = '<div class="winner-content"><div class="winner-text">Buzzer Order</div></div><div class="buzz-list-container"><ol class="buzz-list">';

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
   * Set participant name value
   */
  setParticipantNameValue(name) {
    this.elements.participantNameInput.value = name;
    this.elements.participantNameInput.readOnly = true;
    this.elements.participantNameInput.style.opacity = '0.7';
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
   * Show loading overlay
   */
  showLoading(message = 'Loading...') {
    // Check if overlay exists, if not create it
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loadingOverlay';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      overlay.style.color = '#fff';
      overlay.style.display = 'flex';
      overlay.style.justifyContent = 'center';
      overlay.style.alignItems = 'center';
      overlay.style.zIndex = '9999';
      overlay.style.fontSize = '1.5rem';
      overlay.style.flexDirection = 'column';
      document.body.appendChild(overlay);
    }
    overlay.innerHTML = `<div class="spinner" style="margin-bottom: 20px; font-size: 3rem;">⏳</div><div>${message}</div>`;
    overlay.style.display = 'flex';
  }

  /**
   * Hide loading overlay
   */
  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = 'none';
    }
  }

  /**
   * Get host name input
   */
  getHostNameInput() {
    return new Promise((resolve) => {
      this.showNameTeamModal((name, team) => {
        resolve({ name, team });
      });
    });
  }

  /**
   * Show name and team modal
   */
  showNameTeamModal(callback) {
    this.elements.modalNameInput.value = '';
    this.elements.modalTeamInput.value = '';
    this.elements.nameTeamModal.style.display = 'flex';
    this.elements.modalNameInput.focus();

    // Handle Enter key in inputs
    const handleEnter = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.elements.modalSubmitBtn.click();
      }
    };

    this.elements.modalNameInput.addEventListener('keypress', handleEnter);
    this.elements.modalTeamInput.addEventListener('keypress', handleEnter);

    // Submit handler
    const submitHandler = () => {
      const name = this.elements.modalNameInput.value.trim();
      const team = this.elements.modalTeamInput.value.trim();

      if (!name) {
        alert('Please enter your name');
        this.elements.modalNameInput.focus();
        return;
      }

      // Convert team name to uppercase to avoid case-sensitivity issues
      const normalizedTeam = team.toUpperCase();

      this.hideNameTeamModal();
      this.elements.modalNameInput.removeEventListener('keypress', handleEnter);
      this.elements.modalTeamInput.removeEventListener('keypress', handleEnter);
      this.elements.modalSubmitBtn.removeEventListener('click', submitHandler);
      this.elements.modalCancelBtn.removeEventListener('click', cancelHandler);

      callback(name, normalizedTeam);
    };

    // Cancel handler
    const cancelHandler = () => {
      this.hideNameTeamModal();
      this.elements.modalNameInput.removeEventListener('keypress', handleEnter);
      this.elements.modalTeamInput.removeEventListener('keypress', handleEnter);
      this.elements.modalSubmitBtn.removeEventListener('click', submitHandler);
      this.elements.modalCancelBtn.removeEventListener('click', cancelHandler);
      callback(null, null);
    };

    this.elements.modalSubmitBtn.addEventListener('click', submitHandler);
    this.elements.modalCancelBtn.addEventListener('click', cancelHandler);
  }

  /**
   * Hide name and team modal
   */
  hideNameTeamModal() {
    this.elements.nameTeamModal.style.display = 'none';
  }

  /**
   * Get server URL from user or storage
   * @param {boolean} forcePrompt - Force a prompt even if saved
   */
  getServerUrlInput(forcePrompt = false) {
    if (!forcePrompt) {
      const savedUrl = sessionStorage.getItem('quizzer_server_url');
      if (savedUrl) {
        return savedUrl;
      }
    }

    let url = prompt('Connection failed. Please enter Server URL (e.g., https://your-ngrok-url.io):');
    if (!url) {
      return null;
    }

    // Remove trailing slash if present
    url = url.replace(/\/$/, "");

    sessionStorage.setItem('quizzer_server_url', url);
    return url;
  }

  /**
   * Change server URL and reload
   */
  changeServerUrl() {
    // Prompt immediately
    const url = prompt('Enter new Server URL (e.g., https://your-ngrok-url.io):');
    if (url) {
      // Save and reload
      const cleanUrl = url.replace(/\/$/, "");
      sessionStorage.setItem('quizzer_server_url', cleanUrl);
      window.location.reload();
    }
  }

  /**
   * Get host room ID input
   */
  getHostRoomIdInput() {
    const input = prompt('Enter custom Room ID (optional, leave blank for random):');
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
