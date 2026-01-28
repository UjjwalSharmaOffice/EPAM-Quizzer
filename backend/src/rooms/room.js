import config from '../config/config.js';

export default class Room {
  constructor(roomId) {
    this.id = roomId;
    this.host = null;
    this.participants = new Map();
    this.buzzerLocked = false;
    this.buzzes = [];
    this.teamScores = new Map(); // Track team scores
    this.createdAt = Date.now();
    this.lastActivity = Date.now();
  }

  isIdle() {
    return Date.now() - this.lastActivity > config.roomIdleTimeout;
  }

  touch() {
    this.lastActivity = Date.now();
  }

  resetRound() {
    this.buzzerLocked = false;
    this.buzzes = [];
    this.participants.forEach((p) => {
      p.buzzed = false;
      p.winner = false;
      p.rank = null;
    });
    this.touch();
  }

  summary() {
    return {
      id: this.id,
      hostId: this.host?.id || null,
      participantCount: this.participants.size,
      buzzerLocked: this.buzzerLocked,
      buzzes: this.buzzes,
      teams: this.getTeamScores(),
    };
  }

  getTeamScores() {
    const teams = [];
    const teamMap = new Map();
    
    // First, collect all teams from participants
    Array.from(this.participants.values()).forEach(p => {
      const match = p.name.match(/\(([^)]+)\)$/);
      if (match) {
        const teamName = match[1];
        if (!teamMap.has(teamName)) {
          teamMap.set(teamName, { name: teamName, score: 0, memberCount: 0 });
        }
        teamMap.get(teamName).memberCount++;
      }
    });
    
    // Then, update scores from teamScores Map
    this.teamScores.forEach((score, teamName) => {
      if (teamMap.has(teamName)) {
        teamMap.get(teamName).score = score;
      } else {
        teamMap.set(teamName, { name: teamName, score: score, memberCount: 0 });
      }
    });
    
    // Convert to array
    teamMap.forEach(team => {
      teams.push(team);
    });
    
    return teams;
  }

  addPointToTeam(participantName) {
    const teamMatch = participantName.match(/\(([^)]+)\)$/);
    if (teamMatch) {
      const teamName = teamMatch[1];
      const currentScore = this.teamScores.get(teamName) || 0;
      this.teamScores.set(teamName, currentScore + 1);
      this.touch();
      return { teamName, newScore: currentScore + 1 };
    }
    return null;
  }

  getSummary() {
    return this.summary();
  }
}
