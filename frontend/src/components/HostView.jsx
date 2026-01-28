import React from 'react';
import { ButtonColorful } from './ButtonColorful';
import { ExternalLink } from 'lucide-react';

const HostView = ({ roomId, hostName, status, participants, buzzes, onStartRound, isRoundActive, onMarkCorrect }) => {
  const allBuzzes = buzzes; // Show all buzzers, not just top 3
  
  // Group participants by team
  const participantsByTeam = participants.reduce((acc, participant) => {
    // Extract team name from participant name like "John (Team A)"
    const teamMatch = participant.name.match(/\(([^)]+)\)$/);
    const teamName = teamMatch ? teamMatch[1] : 'No Team';
    
    if (!acc[teamName]) {
      acc[teamName] = [];
    }
    acc[teamName].push(participant);
    return acc;
  }, {});
  
  const openLeaderboard = () => {
    const leaderboardUrl = `/leaderboard?roomId=${roomId}`;
    window.open(leaderboardUrl, '_blank', 'width=1280,height=720');
  };
  
  return (
    <div id="hostScreen">
      <div className="content-card">
        <div className="screen-header">
          <h1 className="screen-title">Host Control Panel</h1>
          <p className="screen-subtitle">Manage your quiz session</p>
        </div>

        <div className="content-inner">
          {/* Room Information */}
          <div className="room-info">
            <div className="room-info-item">
              <span className="room-info-label">Room ID</span>
              <span className="room-info-value">{roomId || '-'}</span>
            </div>
            <div className="room-info-item">
              <span className="room-info-label">Host Name</span>
              <span className="room-info-value">{hostName || '-'}</span>
            </div>
            <div className="room-info-item">
              <span className="room-info-label">Status</span>
              <span className="room-info-value">{status || '-'}</span>
            </div>
          </div>

          {/* Start Button and Leaderboard Button */}
          <div style={{ marginBottom: 'var(--space-8)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1', minWidth: '250px' }}>
              <ButtonColorful 
                onClick={onStartRound}
                label="Start Round"
                subtitle="Begin quiz buzzer round"
                className="start-round-button"
              />
            </div>
            <button
              onClick={openLeaderboard}
              className="leaderboard-button"
              style={{
                padding: '1.5rem 2rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: '2px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '1rem',
                color: 'white',
                fontSize: '1.125rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.4)',
                transition: 'all 0.3s ease',
                minWidth: '200px',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.4)';
              }}
            >
              <ExternalLink size={20} />
              Open Leaderboard
            </button>
          </div>

          {/* Winner Display */}
          {allBuzzes.length > 0 && (
            <div className="winner-display">
              <div className="winner-content">
                <div className="winner-text">First Buzz</div>
                <div className="winner-name">{allBuzzes[0].participantName}</div>
              </div>
            </div>
          )}

          {/* Buzzers Section - Simple Rank Display */}
          <div className="form-section">
            <h3 className="form-section-title">Buzzer Rankings</h3>
            <div className="top-three-list">
              {allBuzzes.length > 0 ? (
                allBuzzes.map((buzz, index) => (
                  <div key={buzz.participantId} className="buzz-item">
                    <div className="buzz-rank-number">#{index + 1}</div>
                    <div className="buzz-info" style={{ flex: 1 }}>
                      <div className="buzz-name">{buzz.participantName || buzz.name}</div>
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

          {/* Participants Section - Grouped by Team */}
          <div className="form-section">
            <h3 className="form-section-title">Participants by Team</h3>
            <div className="participants-list">
              {participants.length > 0 ? (
                Object.entries(participantsByTeam).map(([teamName, teamMembers]) => (
                  <div key={teamName} className="team-group">
                    <div className="team-header">
                      <span className="team-name">{teamName}</span>
                      <span className="team-count">{teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="team-members">
                      {teamMembers.map((participant) => (
                        <div 
                          key={participant.id} 
                          className={`participant-item ${participant.buzzed ? 'buzzed' : ''} ${participant.rank === 1 ? 'winner' : ''}`}
                        >
                          <div className="participant-name">{participant.name}</div>
                          {participant.rank && (
                            <div className="participant-rank">
                              #{participant.rank}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">▶</div>
                  <div className="empty-state-text">No participants yet. Share the room ID!</div>
                </div>
              )}
            </div>
          </div>

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

export default HostView;
