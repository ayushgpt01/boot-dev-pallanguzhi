import { GameController } from './GameController';
import { GameView } from './GameView';
import { createPlayer, Player, RemotePlayer } from './Player';

export enum EventTypes {
  connected = 'connected',
  disconnected = 'disconnected',
  connectionError = 'connectionError',
  roomJoined = 'roomJoined',
  opponentMove = 'opponentMove',
  playerJoined = 'playerJoined',
  playerLeft = 'playerLeft',
  playerReconnected = 'playerReconnected',
  gamePaused = 'gamePaused',
  gameResumed = 'gameResumed',
  gameEnded = 'gameEnded',
  serverError = 'serverError'
}

interface ConnectionState {
  connected: boolean;
  reconnecting: boolean;
  roomCode: string | null;
  sessionId: string | null;
  playerSide: 'player1' | 'player2' | null;
  playerName: string | null;
}

export class GameClient {
  private ws: WebSocket | null = null;
  private gameController: GameController | null = null;
  private gameView: GameView;
  private gameConfig: GameConfig;
  private connectionState: ConnectionState;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private eventEmitter = new EventTarget();

  constructor(gameView: GameView, gameConfig: GameConfig, serverUrl: string) {
    this.gameView = gameView;
    this.gameConfig = gameConfig;
    this.connectionState = {
      connected: false,
      reconnecting: false,
      roomCode: null,
      sessionId: null,
      playerSide: null,
      playerName: null
    };

    this.connect(serverUrl);
  }

  // ---- WEBSOCKET CONNECTION METHODS ----

  private connect(serverUrl: string): void {
    try {
      this.ws = new WebSocket(serverUrl);
      this.setupWebSocketHandlers();
    } catch (error) {
      console.error('Failed to connect to game server:', error);
      this.handleConnectionError();
    }
  }

  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('Connected to game server');
      this.connectionState.connected = true;
      this.connectionState.reconnecting = false;
      this.reconnectAttempts = 0;
      this.emitEvent(EventTypes.connected);

      const { roomCode, sessionId, playerName } = this.connectionState;
      if (roomCode && sessionId) {
        this.joinRoom(roomCode, playerName || undefined);
      }
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WSMessage = JSON.parse(event.data);
        this.handleServerMessage(message);
      } catch (error) {
        console.error('Failed to parse server message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected from game server');
      this.connectionState.connected = false;
      this.emitEvent(EventTypes.disconnected);
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleConnectionError();
    };
  }

  private attemptReconnect(): void {
    if (
      this.connectionState.reconnecting ||
      this.reconnectAttempts >= this.maxReconnectAttempts
    ) {
      return;
    }

    this.connectionState.reconnecting = true;
    this.reconnectAttempts++;

    // Exponential backoff delay increment
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts - 1),
      10000
    );

    setTimeout(() => {
      console.log(
        `Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
      );
      this.connect(this.ws?.url || 'ws://localhost:3001');
    }, delay);
  }

  private handleConnectionError(): void {
    this.connectionState.connected = false;
    this.emitEvent(EventTypes.connectionError);
  }

  // ---- SERVER MESSAGE HANDLERS ----

  private handleServerMessage(message: WSMessage): void {
    switch (message.type) {
      case 'ROOM_JOINED':
        this.handleRoomJoined(message as RoomJoinedMessage);
        break;
      case 'GAME_STATE_UPDATE':
        this.handleGameStateUpdate(message as GameStateUpdateMessage);
        break;
      case 'PLAYER_JOINED':
        this.handlePlayerJoined(message as PlayerJoinedMessage);
        break;
      case 'PLAYER_LEFT':
        this.handlePlayerLeft(message as PlayerLeftMessage);
        break;
      case 'PLAYER_RECONNECTED':
        this.handlePlayerReconnected(message as PlayerReconnectedMessage);
        break;
      case 'GAME_PAUSED':
        this.handleGamePaused(message as GamePausedMessage);
        break;
      case 'GAME_RESUMED':
        this.handleGameResumed(message as GameResumedMessage);
        break;
      case 'GAME_ENDED':
        this.handleGameEnded(message as GameEndedMessage);
        break;
      case 'ERROR':
        this.handleError(message as ErrorMessage);
        break;
      default:
        console.warn('Unknown message type:', message.type);
    }
  }

  private handleRoomJoined(message: RoomJoinedMessage): void {
    const { roomCode, sessionId, playerSide, playerName, gameState, opponent } =
      message.data;

    this.connectionState.roomCode = roomCode;
    this.connectionState.sessionId = sessionId;
    this.connectionState.playerSide = playerSide;
    this.connectionState.playerName = playerName;

    // Create players
    const localPlayer = createPlayer(
      'human',
      sessionId,
      playerName,
      playerSide
    );
    let remotePlayer: Player | null = null;

    if (opponent) {
      const remoteSide = playerSide === 'player1' ? 'player2' : 'player1';
      remotePlayer = new RemotePlayer('remote', opponent.name, remoteSide);
    } else {
      // Create placeholder for second player
      const remoteSide = playerSide === 'player1' ? 'player2' : 'player1';
      remotePlayer = new RemotePlayer('waiting', 'Waiting...', remoteSide);
    }

    // Initialize game controller
    const player1 = playerSide === 'player1' ? localPlayer : remotePlayer;
    const player2 = playerSide === 'player2' ? localPlayer : remotePlayer;

    this.gameController = new GameController(
      player1,
      player2,
      this.gameView,
      this.gameConfig
    );

    // If there's existing game state, restore it
    if (gameState) {
      this.syncGameState(gameState);
    }

    this.emitEvent(EventTypes.roomJoined, {
      roomCode,
      playerSide,
      playerName,
      opponent
    });
  }

  private handleGameStateUpdate(message: GameStateUpdateMessage): void {
    const { gameState, lastAction } = message.data;

    if (this.gameController) {
      this.syncGameState(gameState);

      if (lastAction) {
        this.emitEvent(EventTypes.opponentMove, lastAction);
      }
    }
  }

  private handlePlayerJoined(message: PlayerJoinedMessage): void {
    const { playerName, playerSide } = message.data;
    this.emitEvent(EventTypes.playerJoined, { playerName, playerSide });
  }

  private handlePlayerLeft(message: PlayerLeftMessage): void {
    const { playerName, playerSide, reason } = message.data;
    this.emitEvent(EventTypes.playerLeft, { playerName, playerSide, reason });
  }

  private handlePlayerReconnected(message: PlayerReconnectedMessage): void {
    const { playerName, playerSide } = message.data;
    this.emitEvent(EventTypes.playerReconnected, { playerName, playerSide });
  }

  private handleGamePaused(message: GamePausedMessage): void {
    if (this.gameController) {
      this.gameController.pauseGame();
    }
    this.emitEvent(EventTypes.gamePaused, message.data);
  }

  private handleGameResumed(message: GameResumedMessage): void {
    if (this.gameController) {
      this.gameController.resumeGame();
    }
    this.emitEvent(EventTypes.gameResumed, message.data);
  }

  private handleGameEnded(message: GameEndedMessage): void {
    this.emitEvent(EventTypes.gameEnded, message.data);
  }

  private handleError(message: ErrorMessage): void {
    const { code, message: errorMessage } = message.data;
    console.error(`Server error [${code}]: ${errorMessage}`);
    this.emitEvent(EventTypes.serverError, { code, message: errorMessage });
  }

  // ---- SERVER ACTIONS ----

  private syncGameState(serverGameState: SerializedGameState): void {
    if (!this.gameController) return;

    const localGameState = this.gameController.getGameState();
    const serverCheckSum = this.getGameStateChecksum(serverGameState);
    const localGameStateChecksum = this.getGameStateChecksum(localGameState);

    if (serverCheckSum !== localGameStateChecksum) {
      this.gameController.getGameInstance().updateGameState(serverGameState);
      console.log('Resyncing game state:', serverGameState);
    }
  }

  // ---- CLIENT ACTIONS ----

  joinRoom(roomCode: string, playerName?: string): void {
    if (!this.connectionState.connected) {
      throw new Error('Not connected to server');
    }

    const message = {
      type: 'JOIN_ROOM',
      data: {
        roomCode,
        playerName,
        sessionId: this.connectionState.sessionId // For reconnection
      },
      timestamp: Date.now()
    };

    this.sendMessage(message);
  }

  leaveRoom(): void {
    if (!this.connectionState.connected || !this.connectionState.roomCode) {
      return;
    }

    const message = {
      type: 'LEAVE_ROOM',
      data: {},
      timestamp: Date.now()
    };

    this.sendMessage(message);
    this.resetConnectionState();
  }

  makeMove(action: 'sow' | 'pick', position: Position): boolean {
    if (!this.connectionState.connected || !this.connectionState.roomCode) {
      return false;
    }

    // First try to make the move locally
    let moveSuccess = false;

    if (this.gameController) {
      if (action === 'sow') {
        moveSuccess = this.gameController.handleSowClick(position);
      } else {
        moveSuccess = this.gameController.handlePickClick(position);
      }
    }

    // If local move succeeded, send to server
    if (moveSuccess) {
      const message = {
        type: 'MAKE_MOVE',
        data: {
          action,
          position,
          gameStateChecksum: this.gameController
            ? this.getGameStateChecksum(this.gameController.getGameState())
            : ''
        },
        timestamp: Date.now()
      };

      this.sendMessage(message);
    }

    return moveSuccess;
  }

  pauseGame(): void {
    if (!this.connectionState.connected || !this.connectionState.roomCode) {
      return;
    }

    const message = {
      type: 'PAUSE_GAME',
      data: {},
      timestamp: Date.now()
    };

    this.sendMessage(message);
  }

  resumeGame(): void {
    if (!this.connectionState.connected || !this.connectionState.roomCode) {
      return;
    }

    const message = {
      type: 'RESUME_GAME',
      data: {},
      timestamp: Date.now()
    };

    this.sendMessage(message);
  }

  voteEndGame(): void {
    if (!this.connectionState.connected || !this.connectionState.roomCode) {
      return;
    }

    const message = {
      type: 'VOTE_END_GAME',
      data: {},
      timestamp: Date.now()
    };

    this.sendMessage(message);
  }

  // ---- Private Helpers ----

  private sendMessage(message: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  private getGameStateChecksum(state: SerializedGameState): string {
    const data = JSON.stringify(state);
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return hash.toString();
  }

  private resetConnectionState(): void {
    this.connectionState = {
      ...this.connectionState,
      roomCode: null,
      sessionId: null,
      playerSide: null,
      playerName: null
    };
    this.gameController = null;
  }

  // ---- Event Emitter ----

  private emitEvent(eventType: EventTypes, data?: any): void {
    this.eventEmitter.dispatchEvent(
      new CustomEvent(eventType, { detail: data })
    );
  }

  on(eventType: string, callback: (event: CustomEvent) => void): void {
    this.eventEmitter.addEventListener(eventType, callback as EventListener);
  }

  off(eventType: string, callback: (event: CustomEvent) => void): void {
    this.eventEmitter.removeEventListener(eventType, callback as EventListener);
  }

  // ---- GameClient GETTER METHODS ----

  isConnected(): boolean {
    return this.connectionState.connected;
  }

  isInRoom(): boolean {
    return !!this.connectionState.roomCode;
  }

  getConnectionState(): Readonly<ConnectionState> {
    return { ...this.connectionState };
  }

  getCurrentPlayer(): { name: string; side: string } | null {
    if (!this.connectionState.playerName || !this.connectionState.playerSide) {
      return null;
    }

    return {
      name: this.connectionState.playerName,
      side: this.connectionState.playerSide
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.resetConnectionState();
  }
}
