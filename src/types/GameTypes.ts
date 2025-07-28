interface Position {
  player: 'player1' | 'player2';
  pitIndex: number;
}

interface GameConfig {
  /** The initial number of seeds in each pit */
  initialSeeds: number;
  /** Pits per player */
  pitsPerPlayer: number;
  /** This is added for Point 5 but currently there's no max limit to how many rounds can one player play */
  maxDistributions: number;
}

interface BoardState {
  pits: number[][];
  stores: number[];
  activePits: boolean[][];
}

interface SerializedGameState {
  board: BoardState;
  currentPlayerId: string;
  round: number;
  gamePhase: 'picking' | 'sowing' | 'ended';
  inHandBeads: number;
  distributionCount: number;
  lastSowPosition: Position | null;
}

interface WSMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface JoinRoomMessage extends WSMessage {
  type: 'JOIN_ROOM';
  data: {
    roomCode: string;
    playerName?: string;
    sessionId?: string; // For reconnection
  };
}

interface MakeMoveMessage extends WSMessage {
  type: 'MAKE_MOVE';
  data: {
    action: 'sow' | 'pick';
    position: Position;
    gameStateChecksum?: string; // For validation
  };
}

interface LeaveRoomMessage extends WSMessage {
  type: 'LEAVE_ROOM';
  data: {};
}

interface VoteEndGameMessage extends WSMessage {
  type: 'VOTE_END_GAME';
  data: {};
}

interface PauseGameMessage extends WSMessage {
  type: 'PAUSE_GAME';
  data: {};
}

interface ResumeGameMessage extends WSMessage {
  type: 'RESUME_GAME';
  data: {};
}

// Server -> Client Messages
interface RoomJoinedMessage extends WSMessage {
  type: 'ROOM_JOINED';
  data: {
    roomCode: string;
    sessionId: string;
    playerSide: 'player1' | 'player2';
    playerName: string;
    gameState: SerializedGameState;
    opponent?: {
      name: string;
      connected: boolean;
    };
  };
}

interface PlayerReconnectedMessage extends WSMessage {
  type: 'PLAYER_RECONNECTED';
  data: {
    playerName: string;
    playerSide: 'player1' | 'player2';
  };
}

interface GameStateUpdateMessage extends WSMessage {
  type: 'GAME_STATE_UPDATE';
  data: {
    gameState: SerializedGameState;
    lastAction?: {
      player: string;
      action: 'sow' | 'pick';
      position: Position;
    };
  };
}

interface PlayerJoinedMessage extends WSMessage {
  type: 'PLAYER_JOINED';
  data: {
    playerName: string;
    playerSide: 'player1' | 'player2';
  };
}

interface PlayerLeftMessage extends WSMessage {
  type: 'PLAYER_LEFT';
  data: {
    playerName: string;
    playerSide: 'player1' | 'player2';
    reason: 'disconnect' | 'leave' | 'timeout';
  };
}

interface ErrorMessage extends WSMessage {
  type: 'ERROR';
  data: {
    code: string;
    message: string;
  };
}

interface GamePausedMessage extends WSMessage {
  type: 'GAME_PAUSED';
  data: {
    pausedBy: string;
  };
}

interface GameResumedMessage extends WSMessage {
  type: 'GAME_RESUMED';
  data: {
    resumedBy: string;
  };
}

interface GameEndedMessage extends WSMessage {
  type: 'GAME_ENDED';
  data: {
    reason: string;
  };
}
