import React, { useState } from 'react';
import { ButtonColorful } from './ButtonColorful';

const ParticipantView = ({ 
  isJoined, 
  participantName,
  participantData,
  status, 
  buzzStatus,
  canBuzz,
  onJoin, 
  onBuzz,
  isLoading
}) => {
  const [roomId, setRoomId] = useState('');

  const handleJoin = () => {
    console.log('[ParticipantView] Join clicked', { roomId, participantName, participantData });
    if (roomId.trim() && participantName) {
      console.log('[ParticipantView] Calling onJoin');
      onJoin(roomId.trim(), participantName);
    } else {
      console.warn('[ParticipantView] Missing data:', { roomId: roomId.trim(), participantName });
    }
  };

  const topThree = buzzStatus?.buzzes?.slice(0, 3) || [];

  return (
    <div id="participantScreen">
      <div className="content-card">
        <div className="screen-header">
          <h1 className="screen-title">Participant Control</h1>
          <p className="screen-subtitle">Join a quiz and test your skills</p>
        </div>

        <div className="content-inner">
          {/* Join Section */}
          {!isJoined && (
            <div className="form-section">
              <h3 className="form-section-title">Join Quiz Room</h3>
              <div className="room-info" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="room-info-item">
                  <span className="room-info-label">Your Name</span>
                  <span className="room-info-value">{participantData?.rawName || participantName}</span>
                </div>
                {participantData?.team && (
                  <div className="room-info-item">
                    <span className="room-info-label">Your Team</span>
                    <span className="room-info-value">{participantData.team}</span>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="input-label">Room ID</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Enter room ID"
                  maxLength="10"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
                />
              </div>
              <ButtonColorful 
                onClick={handleJoin}
                label={isLoading ? 'Joining...' : 'Join Room'}
                subtitle="Enter the quiz session"
                disabled={isLoading || !roomId.trim()}
              />
            </div>
          )}

          {/* Buzzer Section */}
          {isJoined && (
            <div className="form-section">
              <div className="room-info" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="room-info-item" style={{ gridColumn: '1 / -1' }}>
                  <span className="room-info-label">Status</span>
                  <span className="room-info-value">{status}</span>
                </div>
              </div>

              <button 
                onClick={onBuzz}
                className={`buzz-button ${!canBuzz ? 'disabled' : ''} ${buzzStatus?.myState?.isBuzzed ? 'buzzed' : ''}`}
                disabled={!canBuzz}
              >
                BUZZ!
              </button>

              {/* Top 3 Participants for Participant View */}
              <div className="form-section" style={{ marginTop: 'var(--space-8)' }}>
                <h3 className="form-section-title">Top Buzzers</h3>
                <div className="top-three-list">
                  {topThree.length > 0 ? (
                    topThree.map((buzz, index) => (
                      <div 
                        key={buzz.participantId} 
                        className={`buzz-item rank-${index + 1} ${buzz.participantId === buzzStatus?.myState?.participantId ? 'me' : ''}`}
                      >
                        <div className="buzz-rank">
                          {index === 0 && '🥇'}
                          {index === 1 && '🥈'}
                          {index === 2 && '🥉'}
                          #{index + 1}
                        </div>
                        <div className="buzz-info">
                          <div className="buzz-name">{buzz.participantName}</div>
                          <div className="buzz-time">
                            {new Date(buzz.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state-text">Waiting for buzzes...</div>
                    </div>
                  )}
                </div>
              </div>

              {buzzStatus?.myState?.isWinner && (
                <div className="winner-display">
                  <div className="winner-content">
                    <div className="winner-emoji">★</div>
                    <div className="winner-text">You are the winner!</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Back Button */}
          <button 
            className="btn btn-ghost btn-lg" 
            style={{ width: '100%', marginTop: '20px' }} 
            onClick={() => window.location.reload()}
          >
            ← Back to Role Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantView;
