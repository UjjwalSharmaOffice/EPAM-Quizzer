import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import SignalingClient from '../services/signalingClient';
import { useHost } from '../hooks/useHost';
import { useParticipant } from '../hooks/useParticipant';
import RoleSelection from '../components/RoleSelection';
import HostView from '../components/HostView';
import ParticipantView from '../components/ParticipantView';
import NameTeamModal from '../components/NameTeamModal';
import ThemeToggle from '../components/ThemeToggle';
import { ShaderAnimation } from '../components/ShaderAnimation';
import '../styles/reset.css';
import '../styles/variables.css';
import '../styles/typography.css';
import '../styles/components.css';
import '../styles/animations.css';
import '../styles/app-layout.css';
import '../styles/theme-toggle.css';

const AppPage = () => {
  const navigate = useNavigate();
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

  const [currentView, setCurrentView] = useState('role'); // 'role', 'host', 'participant'
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalCallback, setModalCallback] = useState(null);
  const [hostDisplayName, setHostDisplayName] = useState('');
  const [modalMode, setModalMode] = useState('host'); // 'host' or 'participant'

  const hostHook = useHost(signalingClient);
  const participantHook = useParticipant(signalingClient);

  const connectToServer = useCallback(async () => {
    if (signalingClient.isConnected()) {
      setIsConnected(true);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await signalingClient.connect();
      setIsConnected(true);
    } catch (err) {
      setError(err.message || 'Failed to connect to server');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [signalingClient]);

  const handleSelectHost = async () => {
    setModalMode('host');
    setShowModal(true);
    setModalCallback(() => async (userData) => {
      setShowModal(false);
      
      if (!userData || !userData.name) return;

      const hostName = userData.team
        ? `${userData.name} (${userData.team})`
        : userData.name;

      try {
        setIsLoading(true);
        await connectToServer();
        await hostHook.createRoom(hostName, userData.roomId || null);
        setHostDisplayName(hostName);
        setCurrentView('host');
      } catch (err) {
        setError(err.message || 'Failed to create room');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleSelectParticipant = async () => {
    setModalMode('participant');
    setShowModal(true);
    setModalCallback(() => async (userData) => {
      setShowModal(false);
      
      if (!userData || !userData.name) return;

      const participantName = userData.team
        ? `${userData.name} (${userData.team})`
        : userData.name;

      try {
        setIsLoading(true);
        await connectToServer();
        
        // Set participant data in the hook
        const fullName = userData.team
          ? `${userData.name} (${userData.team})`
          : userData.name;
        
        participantHook.setParticipantData({
          name: fullName,
          rawName: userData.name,
          team: userData.team || ''
        });
        
        setCurrentView('participant');
      } catch (err) {
        setError(err.message || 'Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    });
  };

  const handleParticipantJoin = async (roomId, name) => {
    try {
      setIsLoading(true);
      setError(null);
      await participantHook.joinRoom(roomId, name);
    } catch (err) {
      setError(err.message || 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHostStartRound = async () => {
    try {
      setError(null);
      await hostHook.startRound();
    } catch (err) {
      setError(err.message || 'Failed to start round');
    }
  };

  const handleMarkCorrect = async (participantId) => {
    try {
      setError(null);
      await signalingClient.emit('buzzer:markCorrect', { participantId });
      console.log('[AppPage] Marked answer as correct for participant:', participantId);
    } catch (err) {
      setError(err.message || 'Failed to mark answer as correct');
    }
  };

  const handleParticipantBuzz = async () => {
    try {
      setError(null);
      const success = await participantHook.buzz();
      if (!success) {
        setError('Cannot buzz now');
      }
    } catch (err) {
      setError(err.message || 'Failed to buzz');
    }
  };

  return (
    <div className="app-container">
      {/* Animated Background */}
      <ShaderAnimation />
      
      {/* Header */}
      <header className="app-header">
        <div className="app-header-content">
          <div className="app-logo">
            <span>Quiz Buzzer</span>
          </div>
          <nav className="app-nav">
            <ThemeToggle />
            <Link to="/" className="app-nav-link">← Back to Home</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <div className="app-content">
          {/* Error Display */}
          {error && (
            <div className="error-banner" onClick={() => setError(null)}>
              {error}
            </div>
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner">Connecting...</div>
            </div>
          )}

          {/* Role Selection Screen */}
          {currentView === 'role' && (
            <RoleSelection 
              onSelectHost={handleSelectHost}
              onSelectParticipant={handleSelectParticipant}
            />
          )}

          {/* Host Screen */}
          {currentView === 'host' && (
            <HostView 
              roomId={hostHook.roomId}
              hostName={hostDisplayName}
              status={hostHook.status}
              participants={hostHook.participants}
              buzzes={hostHook.buzzes}
              onStartRound={handleHostStartRound}
              onMarkCorrect={handleMarkCorrect}
              isRoundActive={hostHook.isRoundActive}
            />
          )}

          {/* Participant Screen */}
          {currentView === 'participant' && (
            <ParticipantView 
              isJoined={!!participantHook.roomId}
              participantName={participantHook.participantName}
              participantData={participantHook.participantData}
              status={participantHook.status}
              buzzStatus={participantHook.buzzStatus}
              canBuzz={participantHook.roundStarted && !participantHook.buzzerLocked}
              onJoin={handleParticipantJoin}
              onBuzz={handleParticipantBuzz}
              isLoading={isLoading}
            />
          )}
        </div>
      </main>

      {/* Name & Team Modal */}
      <NameTeamModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={modalCallback}
        mode={modalMode}
      />
    </div>
  );
};

export default AppPage;
