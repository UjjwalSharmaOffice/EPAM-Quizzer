import React from 'react';
import { ButtonColorful } from './ButtonColorful';
import { Play } from 'lucide-react';

const HostView = ({ roomId, hostName, status, participants, buzzes, onStartRound, isRoundActive }) => {
  const topThree = buzzes.slice(0, 3);
  
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

          {/* Start Button */}
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <ButtonColorful 
              onClick={onStartRound}
              label="Start Round"
              subtitle="Begin quiz buzzer round"
              className="start-round-button"
            />
          </div>

          {/* Winner Display */}
          {topThree.length > 0 && (
            <div className="winner-display">
              <div className="winner-content">
                <div className="winner-text">Winner Announced</div>
                <div className="winner-name">{topThree[0].participantName}</div>
              </div>
            </div>
          )}

          {/* Top 3 Participants Section */}
          <div className="form-section">
            <h3 className="form-section-title">Leaderboard - Top Buzzers</h3>
            <div className="top-three-list">
              {topThree.length > 0 ? (
                topThree.map((buzz, index) => (
                  <div key={buzz.participantId} className={`buzz-item rank-${index + 1}`}>
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
                              {participant.rank === 1 && '🥇'}
                              {participant.rank === 2 && '🥈'}
                              {participant.rank === 3 && '🥉'}
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
