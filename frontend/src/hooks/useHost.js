import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for host controller logic
 */
export const useHost = (signalingClient) => {
  const [hostId, setHostId] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [participants, setParticipants] = useState(new Map());
  const [buzzes, setBuzzes] = useState([]);
  const [status, setStatus] = useState('Waiting for participants...');
  const [isRoundActive, setIsRoundActive] = useState(false);

  const createRoom = useCallback(async (hostName, customRoomId = null) => {
    try {
      const response = await signalingClient.hostCreateRoom(hostName, customRoomId);
      setHostId(signalingClient.getSocketId());
      setRoomId(response.room.id);
      console.log('[useHost] Room created:', response.room.id);
      return response.room;
    } catch (error) {
      console.error('[useHost] Failed to create room:', error);
      throw error;
    }
  }, [signalingClient]);

  const startRound = useCallback(async () => {
    try {
      await signalingClient.hostStartRound();
      setIsRoundActive(true);
      setBuzzes([]);
      setStatus('Round active - waiting for buzz');
      // Reset all participants' buzz status
      setParticipants(prev => {
        const updated = new Map(prev);
        updated.forEach(p => {
          p.buzzed = false;
          p.rank = null;
        });
        return updated;
      });
    } catch (error) {
      console.error('[useHost] Failed to start round:', error);
      throw error;
    }
  }, [signalingClient]);

  useEffect(() => {
    if (!signalingClient) return;

    const handleParticipantJoined = (data) => {
      const participantId = data.participantId;
      setParticipants(prev => {
        const updated = new Map(prev);
        if (!updated.has(participantId)) {
          updated.set(participantId, {
            id: participantId,
            name: data.participantName,
            buzzed: false,
            rank: null,
          });
        }
        return updated;
      });
      setStatus(`${participants.size + 1} participant(s) connected`);
      console.log('[useHost] Participant joined:', data.participantName);
    };

    const handleParticipantLeft = (data) => {
      const participantId = data.participantId;
      setParticipants(prev => {
        const updated = new Map(prev);
        updated.delete(participantId);
        return updated;
      });
      setStatus(`${participants.size - 1} participant(s) connected`);
      console.log('[useHost] Participant left:', data.participantName);
    };

    const handleBuzzesUpdated = (data) => {
      const buzzesList = data.buzzes;
      setBuzzes(buzzesList);
      
      // Update participants with their ranks
      setParticipants(prev => {
        const updated = new Map(prev);
        updated.forEach(p => {
          p.rank = null;
          p.buzzed = false;
        });
        
        buzzesList.forEach((buzz, index) => {
          const participant = updated.get(buzz.participantId);
          if (participant) {
            participant.buzzed = true;
            participant.rank = index + 1;
          }
        });
        
        return updated;
      });
      
      console.log('[useHost] Buzzes updated:', buzzesList);
    };

    const handleRoundStarted = () => {
      setIsRoundActive(true);
      setStatus('Round active - waiting for buzz');
      setBuzzes([]);
      console.log('[useHost] Round started');
    };

    signalingClient.on('buzzer:participantJoined', handleParticipantJoined);
    signalingClient.on('buzzer:participantLeft', handleParticipantLeft);
    signalingClient.on('buzzer:buzzesUpdated', handleBuzzesUpdated);
    signalingClient.on('buzzer:roundStarted', handleRoundStarted);

    return () => {
      signalingClient.off('buzzer:participantJoined', handleParticipantJoined);
      signalingClient.off('buzzer:participantLeft', handleParticipantLeft);
      signalingClient.off('buzzer:buzzesUpdated', handleBuzzesUpdated);
      signalingClient.off('buzzer:roundStarted', handleRoundStarted);
    };
  }, [signalingClient, participants.size]);

  return {
    hostId,
    roomId,
    participants: Array.from(participants.values()),
    buzzes,
    status,
    isRoundActive,
    createRoom,
    startRound,
  };
};
