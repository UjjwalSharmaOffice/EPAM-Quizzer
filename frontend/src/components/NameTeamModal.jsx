import React, { useState } from 'react';
import { ButtonColorful } from './ButtonColorful';

const NameTeamModal = ({ isOpen, onClose, onSubmit, mode = 'host' }) => {
  const [name, setName] = useState('');
  const [team, setTeam] = useState('');
  const [roomId, setRoomId] = useState('');

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit({ 
        name: name.trim(), 
        team: team.trim(),
        roomId: roomId.trim() 
      });
      setName('');
      setTeam('');
      setRoomId('');
    }
  };

  const handleCancel = () => {
    setName('');
    setTeam('');
    setRoomId('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-content">
          <h2 className="modal-title">Enter Your Details</h2>
          <p className="modal-subtitle">Please provide your information to continue</p>
          
          <div className="modal-form">
            <div className="form-group">
              <label htmlFor="modalNameInput" className="form-label">Your Name</label>
              <input 
                type="text" 
                id="modalNameInput" 
                className="modal-input" 
                placeholder="Enter your name"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="modalTeamInput" className="form-label">Team Name (Optional)</label>
              <input 
                type="text" 
                id="modalTeamInput" 
                className="modal-input" 
                placeholder="e.g., Team Alpha, Engineering, etc."
                autoComplete="off"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <small className="form-hint">Leave blank if not part of a team</small>
            </div>

            {mode === 'host' && (
              <div className="form-group">
                <label htmlFor="modalRoomIdInput" className="form-label">Room ID (Optional)</label>
                <input 
                  type="text" 
                  id="modalRoomIdInput" 
                  className="modal-input" 
                  placeholder="Enter custom room ID or leave blank for auto-generation"
                  autoComplete="off"
                  maxLength="10"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <small className="form-hint">Leave blank to auto-generate a room ID</small>
              </div>
            )}
            
            <div className="modal-actions">
              <button 
                onClick={handleCancel} 
                className="btn btn-ghost"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <div style={{ flex: 1 }}>
                <ButtonColorful 
                  onClick={handleSubmit}
                  label="Continue"
                  subtitle="Start your quiz"
                  disabled={!name.trim()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NameTeamModal;
