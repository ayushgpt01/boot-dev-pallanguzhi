export interface Position {
  player: 'player1' | 'player2';
  pitIndex: number;
}

export interface BoardState {
  pits: number[][];
  stores: number[];
  activePits: boolean[][];
}

export interface SerializedGameState {
  board: BoardState;
  currentPlayerId: string;
  round: number;
  gamePhase: 'picking' | 'sowing' | 'ended';
  inHandBeads: number;
  distributionCount: number;
  lastSowPosition: Position | null;
}

export interface GameConfig {
  /** The initial number of seeds in each pit */
  initialSeeds: number;
  /** Pits per player */
  pitsPerPlayer: number;
  /** This is added for Point 5 but currently there's no max limit to how many rounds can one player play */
  maxDistributions: number;
}

export interface WSMessage {
  type: string;
  data: any;
  timestamp: number;
}

export interface JoinRoomMessage extends WSMessage {
  type: 'JOIN_ROOM';
  data: {
    roomCode: string;
    playerName?: string;
    sessionId?: string; // For reconnection
  };
}

export interface MakeMoveMessage extends WSMessage {
  type: 'MAKE_MOVE';
  data: {
    action: 'sow' | 'pick';
    position: Position;
    gameStateChecksum?: string; // For validation
  };
}

export interface LeaveRoomMessage extends WSMessage {
  type: 'LEAVE_ROOM';
  data: {};
}

export interface VoteEndGameMessage extends WSMessage {
  type: 'VOTE_END_GAME';
  data: {};
}

export interface PauseGameMessage extends WSMessage {
  type: 'PAUSE_GAME';
  data: {};
}

export interface ResumeGameMessage extends WSMessage {
  type: 'RESUME_GAME';
  data: {};
}

// Server -> Client Messages
export interface RoomJoinedMessage extends WSMessage {
  type: 'ROOM_JOINED';
  data: {
    roomCode: string;
    sessionId: string;
    playerSide: 'player1' | 'player2';
    playerName: string;
    gameState: SerializedGameState; // Full game state
    opponent?: {
      name: string;
      connected: boolean;
    };
  };
}

export interface GameStateUpdateMessage extends WSMessage {
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

export interface PlayerJoinedMessage extends WSMessage {
  type: 'PLAYER_JOINED';
  data: {
    playerName: string;
    playerSide: 'player1' | 'player2';
  };
}

export interface PlayerLeftMessage extends WSMessage {
  type: 'PLAYER_LEFT';
  data: {
    playerName: string;
    playerSide: 'player1' | 'player2';
    reason: 'disconnect' | 'leave' | 'timeout';
  };
}

export interface ErrorMessage extends WSMessage {
  type: 'ERROR';
  data: {
    code: string;
    message: string;
  };
}
