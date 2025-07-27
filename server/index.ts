import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { WebSocket, WebSocketServer } from 'ws';
import {
  ErrorMessage,
  GameConfig,
  GameStateUpdateMessage,
  JoinRoomMessage,
  MakeMoveMessage,
  PlayerJoinedMessage,
  PlayerLeftMessage,
  Position,
  RoomJoinedMessage,
  WSMessage
} from './src/types/GameTypes';

interface PlayerSession {
  sessionId: string;
  playerName: string;
  playerSide: 'player1' | 'player2';
  ws: WebSocket;
  connected: boolean;
  lastSeen: number;
}

interface GameRoom {
  roomCode: string;
  players: Map<string, PlayerSession>; // sessionId -> PlayerSession
  gameState: any; // Your Game class instance serialized
  createdAt: number;
  lastActivity: number;
  gameStarted: boolean;
  isPaused: boolean;
  endGameVotes: Set<string>; // sessionIds who voted to end
  config: GameConfig;
}

class GameServer {
  private wss: WebSocketServer;
  private rooms: Map<string, GameRoom> = new Map();
  private sessionToRoom: Map<string, string> = new Map(); // sessionId -> roomCode
  private cleanupInterval: NodeJS.Timeout | null;

  constructor(port: number = 3001) {
    this.wss = new WebSocketServer({ port });
    this.setupWebSocketServer();
    this.cleanupInterval = this.getCleanupTimer();

    console.log(`Game server running on port ${port}`);
  }

  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New WebSocket connection');

      ws.on('message', (data: Buffer) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          this.sendError(ws, 'INVALID_MESSAGE', 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnection(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private handleMessage(ws: WebSocket, message: WSMessage): void {
    switch (message.type) {
      case 'JOIN_ROOM':
        this.handleJoinRoom(ws, message as JoinRoomMessage);
        break;
      case 'MAKE_MOVE':
        this.handleMakeMove(ws, message as MakeMoveMessage);
        break;
      case 'LEAVE_ROOM':
        this.handleLeaveRoom(ws);
        break;
      case 'VOTE_END_GAME':
        this.handleVoteEndGame(ws);
        break;
      case 'PAUSE_GAME':
        this.handlePauseGame(ws);
        break;
      case 'RESUME_GAME':
        this.handleResumeGame(ws);
        break;
      default:
        this.sendError(
          ws,
          'UNKNOWN_MESSAGE_TYPE',
          `Unknown message type: ${message.type}`
        );
    }
  }

  private handleJoinRoom(ws: WebSocket, message: JoinRoomMessage): void {
    const { roomCode, playerName, sessionId } = message.data;

    // Try to reconnect existing session
    if (sessionId && this.sessionToRoom.has(sessionId)) {
      const existingRoomCode = this.sessionToRoom.get(sessionId)!;
      const room = this.rooms.get(existingRoomCode);

      if (room && room.players.has(sessionId)) {
        this.reconnectPlayer(ws, room, sessionId);
        return;
      }
    }

    // Join or create new room
    let room = this.rooms.get(roomCode);

    if (!room) {
      room = this.createRoom(roomCode);
    }

    if (room.players.size >= 2) {
      this.sendError(ws, 'ROOM_FULL', 'Room is already full');
      return;
    }

    const newSessionId = uuidv4();
    const generatedName = playerName || this.generatePlayerName();
    const playerSide: 'player1' | 'player2' =
      room.players.size === 0 ? 'player1' : 'player2';

    const playerSession: PlayerSession = {
      sessionId: newSessionId,
      playerName: generatedName,
      playerSide,
      ws,
      connected: true,
      lastSeen: Date.now()
    };

    room.players.set(newSessionId, playerSession);
    this.sessionToRoom.set(newSessionId, roomCode);
    room.lastActivity = Date.now();

    // Start game if both players joined
    if (room.players.size === 2 && !room.gameStarted) {
      room.gameStarted = true;
      this.initializeGameState(room);
    }

    this.sendRoomJoined(ws, room, playerSession);
    this.broadcastPlayerJoined(room, playerSession);

    console.log(
      `Player ${generatedName} joined room ${roomCode} as ${playerSide}`
    );
  }

  private handleMakeMove(ws: WebSocket, message: MakeMoveMessage): void {
    const sessionId = this.getSessionId(ws);
    if (!sessionId) {
      this.sendError(ws, 'NO_SESSION', 'No active session');
      return;
    }

    const roomCode = this.sessionToRoom.get(sessionId);
    if (!roomCode) {
      this.sendError(ws, 'NO_ROOM', 'Not in any room');
      return;
    }

    const room = this.rooms.get(roomCode);
    if (!room || !room.gameStarted) {
      this.sendError(ws, 'GAME_NOT_STARTED', 'Game not started');
      return;
    }

    const player = room.players.get(sessionId);
    if (!player) {
      this.sendError(ws, 'PLAYER_NOT_FOUND', 'Player not found');
      return;
    }

    // Validate and apply move
    try {
      const { action, position } = message.data;

      // Apply move to game state (you'll need to implement this)
      const newGameState = this.applyMove(
        room.gameState,
        player.playerSide,
        action,
        position
      );
      room.gameState = newGameState;
      room.lastActivity = Date.now();

      // Broadcast state update to all players
      this.broadcastGameStateUpdate(room, {
        player: player.playerName,
        action,
        position
      });
    } catch (error) {
      this.sendError(ws, 'INVALID_MOVE', (error as Error).message);
    }
  }

  private handleLeaveRoom(ws: WebSocket): void {
    const sessionId = this.getSessionId(ws);
    if (!sessionId) return;

    this.removePlayerFromRoom(sessionId, 'leave');
  }

  private handleVoteEndGame(ws: WebSocket): void {
    const sessionId = this.getSessionId(ws);
    if (!sessionId) return;

    const roomCode = this.sessionToRoom.get(sessionId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.endGameVotes.add(sessionId);

    // End game if both players voted
    if (room.endGameVotes.size === room.players.size) {
      this.endGame(room, 'vote');
    }
  }

  private handlePauseGame(ws: WebSocket): void {
    const sessionId = this.getSessionId(ws);
    if (!sessionId) return;

    const roomCode = this.sessionToRoom.get(sessionId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.isPaused = true;
    this.broadcastToRoom(room, {
      type: 'GAME_PAUSED',
      data: { pausedBy: room.players.get(sessionId)?.playerName },
      timestamp: Date.now()
    });
  }

  private handleResumeGame(ws: WebSocket): void {
    const sessionId = this.getSessionId(ws);
    if (!sessionId) return;

    const roomCode = this.sessionToRoom.get(sessionId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.isPaused = false;
    this.broadcastToRoom(room, {
      type: 'GAME_RESUMED',
      data: { resumedBy: room.players.get(sessionId)?.playerName },
      timestamp: Date.now()
    });
  }

  private handleDisconnection(ws: WebSocket): void {
    const sessionId = this.getSessionId(ws);
    if (!sessionId) return;

    const roomCode = this.sessionToRoom.get(sessionId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.get(sessionId);
    if (player) {
      player.connected = false;
      player.lastSeen = Date.now();

      this.broadcastPlayerLeft(room, player, 'disconnect');

      // Start disconnect timeout
      setTimeout(() => {
        this.checkPlayerTimeout(sessionId);
      }, 30000); // 30 second timeout
    }
  }

  private reconnectPlayer(
    ws: WebSocket,
    room: GameRoom,
    sessionId: string
  ): void {
    const player = room.players.get(sessionId)!;
    player.ws = ws;
    player.connected = true;
    player.lastSeen = Date.now();

    this.sendRoomJoined(ws, room, player);

    // Notify other players of reconnection
    this.broadcastToRoom(
      room,
      {
        type: 'PLAYER_RECONNECTED',
        data: { playerName: player.playerName, playerSide: player.playerSide },
        timestamp: Date.now()
      },
      [sessionId]
    );
  }

  private createRoom(roomCode: string): GameRoom {
    const room: GameRoom = {
      roomCode,
      players: new Map(),
      gameState: null,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      gameStarted: false,
      isPaused: false,
      endGameVotes: new Set(),
      config: {
        initialSeeds: 5,
        pitsPerPlayer: 7,
        maxDistributions: 2
      }
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  private generatePlayerName(): string {
    const adjectives = ['Swift', 'Clever', 'Bold', 'Wise', 'Quick'];
    const nouns = ['Player', 'Gamer', 'Master', 'Champion', 'Hero'];

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 1000);

    return `${adj}${noun}${num}`;
  }

  private initializeGameState(room: GameRoom): void {
    // Initialize your Game class here with the two players
    // room.gameState = new Game(player1, player2, room.config);
    room.gameState = {
      /* serialized game state */
    };
  }

  private applyMove(
    gameState: any,
    playerSide: string,
    action: string,
    position: Position
  ): any {
    // Apply the move to your game state and return new state
    // This is where you'd integrate with your existing Game class
    return gameState;
  }

  private sendRoomJoined(
    ws: WebSocket,
    room: GameRoom,
    player: PlayerSession
  ): void {
    const opponent = Array.from(room.players.values()).find(
      (p) => p.sessionId !== player.sessionId
    );

    const message: RoomJoinedMessage = {
      type: 'ROOM_JOINED',
      data: {
        roomCode: room.roomCode,
        sessionId: player.sessionId,
        playerSide: player.playerSide,
        playerName: player.playerName,
        gameState: room.gameState,
        opponent: opponent
          ? {
              name: opponent.playerName,
              connected: opponent.connected
            }
          : undefined
      },
      timestamp: Date.now()
    };

    ws.send(JSON.stringify(message));
  }

  private broadcastGameStateUpdate(room: GameRoom, lastAction: any): void {
    const message: GameStateUpdateMessage = {
      type: 'GAME_STATE_UPDATE',
      data: {
        gameState: room.gameState,
        lastAction
      },
      timestamp: Date.now()
    };

    this.broadcastToRoom(room, message);
  }

  private broadcastPlayerJoined(
    room: GameRoom,
    joinedPlayer: PlayerSession
  ): void {
    const message: PlayerJoinedMessage = {
      type: 'PLAYER_JOINED',
      data: {
        playerName: joinedPlayer.playerName,
        playerSide: joinedPlayer.playerSide
      },
      timestamp: Date.now()
    };

    this.broadcastToRoom(room, message, [joinedPlayer.sessionId]);
  }

  private broadcastPlayerLeft(
    room: GameRoom,
    leftPlayer: PlayerSession,
    reason: string
  ): void {
    const message: PlayerLeftMessage = {
      type: 'PLAYER_LEFT',
      data: {
        playerName: leftPlayer.playerName,
        playerSide: leftPlayer.playerSide,
        reason: reason as any
      },
      timestamp: Date.now()
    };

    this.broadcastToRoom(room, message, [leftPlayer.sessionId]);
  }

  private broadcastToRoom(
    room: GameRoom,
    message: WSMessage,
    excludeSessions: string[] = []
  ): void {
    room.players.forEach((player, sessionId) => {
      if (player.connected && !excludeSessions.includes(sessionId)) {
        try {
          player.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Failed to send message:', error);
          player.connected = false;
        }
      }
    });
  }

  private sendError(ws: WebSocket, code: string, message: string): void {
    const errorMessage: ErrorMessage = {
      type: 'ERROR',
      data: { code, message },
      timestamp: Date.now()
    };

    ws.send(JSON.stringify(errorMessage));
  }

  private getSessionId(ws: WebSocket): string | null {
    // You'll need to store sessionId on the WebSocket connection
    return (ws as any).sessionId || null;
  }

  private removePlayerFromRoom(sessionId: string, reason: string): void {
    const roomCode = this.sessionToRoom.get(sessionId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.get(sessionId);
    if (player) {
      this.broadcastPlayerLeft(room, player, reason);
      room.players.delete(sessionId);
      this.sessionToRoom.delete(sessionId);

      // Clean up room if empty
      if (room.players.size === 0) {
        this.rooms.delete(roomCode);
      }
    }
  }

  private checkPlayerTimeout(sessionId: string): void {
    const roomCode = this.sessionToRoom.get(sessionId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) return;

    const player = room.players.get(sessionId);
    if (player && !player.connected && Date.now() - player.lastSeen > 30000) {
      this.removePlayerFromRoom(sessionId, 'timeout');
    }
  }

  private endGame(room: GameRoom, reason: string): void {
    this.broadcastToRoom(room, {
      type: 'GAME_ENDED',
      data: { reason },
      timestamp: Date.now()
    });

    // Clean up room after delay
    setTimeout(() => {
      this.rooms.delete(room.roomCode);
      room.players.forEach((_, sessionId) => {
        this.sessionToRoom.delete(sessionId);
      });
    }, 5000);
  }

  private getCleanupTimer(): NodeJS.Timeout {
    return setInterval(() => {
      const now = Date.now();
      const roomsToDelete: string[] = [];

      this.rooms.forEach((room, roomCode) => {
        // Remove inactive rooms (1 hour timeout)
        if (now - room.lastActivity > 3600000) {
          roomsToDelete.push(roomCode);
        }
      });

      roomsToDelete.forEach((roomCode) => {
        const room = this.rooms.get(roomCode);
        if (room) {
          room.players.forEach((_, sessionId) => {
            this.sessionToRoom.delete(sessionId);
          });
          this.rooms.delete(roomCode);
        }
      });

      console.log(`Cleaned up ${roomsToDelete.length} inactive rooms`);
    }, 300000); // Check every 5 minutes
  }

  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.wss.close();
  }
}

// Start server
const server = new GameServer(3001);

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
