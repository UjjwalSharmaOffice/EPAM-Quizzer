import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import LeaderboardBackground from '../components/LeaderboardBackground';
import SignalingClient from '../services/signalingClient';
import { Trophy, Plus, Minus } from 'lucide-react';
import '../styles/leaderboard.css';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [roomId, setRoomId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [signalingClient] = useState(() => {
    const sessionUrl = sessionStorage.getItem("quizzer_server_url");
    const defaultUrl =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
        ? "http://localhost:3000"
        : window.location.origin;
    const initialUrl = sessionUrl || defaultUrl;
    return new SignalingClient(initialUrl);
  });

  // Get room ID from URL params and connect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('roomId');
    if (!room) return;

    setRoomId(room);

    const connectToRoom = async () => {
      try {
        console.log('[Leaderboard] Connecting to room:', room);
        await signalingClient.connect();
        setIsConnected(true);
        
        // Listen for team score updates BEFORE requesting data
        signalingClient.on('leaderboard:updated', (data) => {
          console.log('[Leaderboard] Teams updated via event:', data.teams);
          setTeams(data.teams || []);
        });

        // Listen for participant joined to update teams immediately
        signalingClient.on('buzzer:participantJoined', (data) => {
          console.log('[Leaderboard] Participant joined:', data.participantName);
        });

        // Request initial leaderboard data
        console.log('[Leaderboard] Requesting initial data for room:', room);
        const result = await signalingClient.send('leaderboard:request', { roomId: room });
        console.log('[Leaderboard] Initial request result:', result);
        if (result?.success && result?.teams) {
          console.log('[Leaderboard] Setting teams from response:', result.teams);
          setTeams(result.teams);
        } else {
          console.warn('[Leaderboard] No teams in response:', result);
        }
      } catch (error) {
        console.error('[Leaderboard] Connection failed:', error);
      }
    };

    connectToRoom();

    return () => {
      signalingClient.disconnect();
    };
  }, [signalingClient]);

  const handleAddPoint = async (teamName) => {
    try {
      if (!isConnected || !roomId) {
        console.error('[Leaderboard] Not connected or no room ID');
        return;
      }
      
      console.log('[Leaderboard] Adding point to team:', teamName);
      await signalingClient.send('team:addPoint', { roomId, teamName });
    } catch (error) {
      console.error('[Leaderboard] Failed to add point:', error);
    }
  };

  const handleRemovePoint = async (teamName) => {
    try {
      if (!isConnected || !roomId) {
        console.error('[Leaderboard] Not connected or no room ID');
        return;
      }

      const team = teams.find(t => t.name === teamName);
      if (!team || team.score === 0) {
        return;
      }
      
      console.log('[Leaderboard] Removing point from team:', teamName);
      await signalingClient.send('team:removePoint', { roomId, teamName });
    } catch (error) {
      console.error('[Leaderboard] Failed to remove point:', error);
    }
  };

  const handleFinishQuiz = () => {
    setShowWinner(true);
  };

  const getRankIcon = (index) => {
    if (index === 0 && showWinner) {
      return <Trophy className="rank-icon gold winner-trophy" size={48} />;
    }
    return <span className="rank-number">#{index + 1}</span>;
  };

  const getRankClass = (index) => {
    switch(index) {
      case 0: return 'rank-1';
      case 1: return 'rank-2';
      case 2: return 'rank-3';
      default: return '';
    }
  };

  // Sort teams by score
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="leaderboard-container">
      <LeaderboardBackground />
      
      {showWinner && sortedTeams.length > 0 && (
        <div className="winner-overlay">
          <div className="winner-announcement">
            <Trophy className="winner-trophy-large" size={100} />
            <h1 className="winner-title">Team {sortedTeams[0].name} Wins!</h1>
            <p className="winner-score">{sortedTeams[0].score} Points</p>
            <button 
              className="close-winner-btn"
              onClick={() => setShowWinner(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      <div className="leaderboard-content">
        <header className="leaderboard-header">
          <h1 className="leaderboard-title">Team Leaderboard</h1>
          <p className="leaderboard-subtitle">Live Quiz Rankings</p>
          {roomId && <div className="leaderboard-room-id">Room: {roomId}</div>}
        </header>

        <div className="leaderboard-board">
          {/* Team Scores Section */}
          <div className="leaderboard-section">
            <h2 className="section-title">Team Standings</h2>
            <p className="section-subtitle">Click +1 to award points to teams</p>
            {sortedTeams.length > 0 ? (
              <div className="teams-list">
                {sortedTeams.map((team, index) => (
                  <div key={team.name} className={`team-card ${getRankClass(index)}`}>
                    <div className="team-rank">
                      {getRankIcon(index)}
                    </div>
                    <div className="team-info">
                      <h3 className="team-name">{team.name}</h3>
                      <p className="team-members">{team.memberCount || 0} member{team.memberCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="team-score">
                      <div className="score-value">{team.score || 0}</div>
                      <div className="score-label">points</div>
                    </div>
                    {!showWinner && (
                      <div className="team-actions">
                        <button
                          onClick={() => handleRemovePoint(team.name)}
                          className="remove-point-button"
                          disabled={team.score === 0}
                          type="button"
                        >
                          <Minus size={24} />
                        </button>
                        <button
                          onClick={() => handleAddPoint(team.name)}
                          className="add-point-button"
                          type="button"
                        >
                          <Plus size={24} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-leaderboard">
                <div className="empty-icon">🏆</div>
                <h3>No Teams Yet</h3>
                <p>Waiting for participants to join...</p>
              </div>
            )}
            
            {sortedTeams.length > 0 && (
              <button 
                className="finish-quiz-button"
                onClick={handleFinishQuiz}
              >
                <Trophy size={24} />
                Finish Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
