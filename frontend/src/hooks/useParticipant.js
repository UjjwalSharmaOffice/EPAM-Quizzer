import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for participant controller logic
 */
export const useParticipant = (signalingClient) => {
  const [participantId, setParticipantId] = useState(null);
  const [participantName, setParticipantName] = useState(null);
  const [participantData, setParticipantDataState] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [hasLocalBuzzed, setHasLocalBuzzed] = useState(false);
  const [buzzerLocked, setBuzzerLocked] = useState(false);
  const [roundStarted, setRoundStarted] = useState(false);
  const [status, setStatus] = useState('Connected - waiting for round to start');
  const [buzzStatus, setBuzzStatus] = useState(null);

  const setParticipantData = useCallback((data) => {
    console.log('[useParticipant] Setting participant data:', data);
    setParticipantDataState(data);
    setParticipantName(data.name);
  }, []);

  const joinRoom = useCallback(async (roomIdToJoin, name) => {
    try {
      const response = await signalingClient.participantJoinRoom(roomIdToJoin, name);
      setParticipantId(signalingClient.getSocketId());
      setParticipantName(name);
      setRoomId(roomIdToJoin);
      console.log('[useParticipant] Joined room:', roomIdToJoin);
      return response.room;
    } catch (error) {
      console.error('[useParticipant] Failed to join room:', error);
      throw error;
    }
  }, [signalingClient]);

  const buzz = useCallback(async () => {
    if (!roundStarted || hasLocalBuzzed || buzzerLocked) {
      return false;
    }

    try {
      const timestamp = Date.now();
      await signalingClient.participantBuzz(timestamp);
      setHasLocalBuzzed(true);
      setBuzzerLocked(true);
      setStatus('You buzzed!');
      console.log('[useParticipant] Buzzed at', timestamp);
      return true;
    } catch (error) {
      console.error('[useParticipant] Failed to buzz:', error);
      return false;
    }
  }, [signalingClient, roundStarted, hasLocalBuzzed, buzzerLocked]);

  useEffect(() => {
    if (!signalingClient) return;

    const handleRoundStart = () => {
      setHasLocalBuzzed(false);
      setBuzzerLocked(false);
      setRoundStarted(true);
      setStatus('Round active - Ready to buzz!');
      setBuzzStatus(null);
      console.log('[useParticipant] Round started');
    };

    const handleBuzzesUpdated = (data) => {
      const buzzes = data.buzzes;
      const myBuzzIndex = buzzes.findIndex(b => b.participantId === participantId);
      const isWinner = myBuzzIndex === 0;
      const isBuzzed = myBuzzIndex !== -1;
      
      if (isBuzzed) {
        setBuzzerLocked(true);
      }

      const myState = {
        isWinner,
        isBuzzed,
        rank: isBuzzed ? myBuzzIndex + 1 : null,
        buzzTime: isBuzzed ? buzzes[myBuzzIndex].timestamp : null
      };

      setBuzzStatus({
        buzzes,
        myState,
        winnerName: buzzes[0]?.participantName || null
      });

      if (isWinner) {
        setStatus('You are the winner!');
      } else if (isBuzzed) {
        setStatus(`You buzzed (Rank #${myState.rank})`);
      } else if (buzzes.length > 0) {
        setStatus(`${buzzes[0].participantName} buzzed first`);
      }

      console.log('[useParticipant] Buzzes updated. Am I winner?', isWinner);
    };

    const handleHostLeft = () => {
      setStatus('Host disconnected');
      console.log('[useParticipant] Host left');
    };

    signalingClient.on('buzzer:roundStarted', handleRoundStart);
    signalingClient.on('buzzer:buzzesUpdated', handleBuzzesUpdated);
    signalingClient.on('buzzer:hostLeft', handleHostLeft);

    return () => {
      signalingClient.off('buzzer:roundStarted', handleRoundStart);
      signalingClient.off('buzzer:buzzesUpdated', handleBuzzesUpdated);
      signalingClient.off('buzzer:hostLeft', handleHostLeft);
    };
  }, [signalingClient, participantId]);

  return {
    participantId,
    participantName,
    participantData,
    roomId,
    hasLocalBuzzed,
    buzzerLocked,
    roundStarted,
    status,
    buzzStatus,
    joinRoom,
    buzz,
    setParticipantData,
  };
};
