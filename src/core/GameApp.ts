/* eslint-disable @typescript-eslint/no-unused-vars */
import { GameConfig, Position } from '../types/GameTypes';
import { GameClient } from './GameClient';
import { GameView } from './GameView';
import { MultiplayerGameController } from './MultiplayerController';

export class MultiplayerGameApp {
  private gameClient: GameClient;
  private gameController: MultiplayerGameController;
  // Use this for UI Updates
  // private gameView: GameView;

  constructor(gameView: GameView, gameConfig: GameConfig, serverUrl: string) {
    // this.gameView = gameView;
    this.gameClient = new GameClient(gameView, gameConfig, serverUrl);
    this.gameController = new MultiplayerGameController(
      this.gameClient,
      gameView,
      gameConfig
    );

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Connection events
    this.gameClient.on('connected', () => {
      console.log('Connected to server');
      this.updateUI('connected');
    });

    this.gameClient.on('disconnected', () => {
      console.log('Disconnected from server');
      this.updateUI('disconnected');
    });

    this.gameClient.on('connectionError', () => {
      console.log('Connection error');
      this.updateUI('connectionError');
    });

    // Room events
    this.gameClient.on('roomJoined', (event) => {
      const { roomCode, playerSide, playerName, opponent } = event.detail;
      console.log(`Joined room ${roomCode} as ${playerName} (${playerSide})`);
      this.updateUI('roomJoined', {
        roomCode,
        playerSide,
        playerName,
        opponent
      });
    });

    this.gameClient.on('playerJoined', (event) => {
      const { playerName, playerSide } = event.detail;
      console.log(`${playerName} joined as ${playerSide}`);
      this.updateUI('playerJoined', { playerName, playerSide });
    });

    this.gameClient.on('playerLeft', (event) => {
      const { playerName, reason } = event.detail;
      console.log(`${playerName} left (${reason})`);
      this.updateUI('playerLeft', { playerName, reason });
    });

    // Game events
    this.gameClient.on('opponentMove', (event) => {
      const { player, action, position } = event.detail;
      console.log(`${player} made ${action} at`, position);
      this.updateUI('opponentMove', { player, action, position });
    });

    this.gameClient.on('gamePaused', (event) => {
      const { pausedBy } = event.detail;
      console.log(`Game paused by ${pausedBy}`);
      this.updateUI('gamePaused', { pausedBy });
    });

    this.gameClient.on('gameResumed', (event) => {
      const { resumedBy } = event.detail;
      console.log(`Game resumed by ${resumedBy}`);
      this.updateUI('gameResumed', { resumedBy });
    });

    this.gameClient.on('gameEnded', (event) => {
      const { reason } = event.detail;
      console.log(`Game ended: ${reason}`);
      this.updateUI('gameEnded', { reason });
    });

    // Error events
    this.gameClient.on('serverError', (event) => {
      const { code, message } = event.detail;
      console.error(`Server error [${code}]: ${message}`);
      this.updateUI('serverError', { code, message });
    });
  }

  // Public API for UI
  joinRoom(roomCode: string, playerName?: string): void {
    this.gameClient.joinRoom(roomCode, playerName);
  }

  leaveRoom(): void {
    this.gameClient.leaveRoom();
  }

  pauseGame(): void {
    this.gameController.pauseGame();
  }

  resumeGame(): void {
    this.gameController.resumeGame();
  }

  voteEndGame(): void {
    this.gameClient.voteEndGame();
  }

  // Handle mouse events from PixiJS
  handleMouseClick(position: Position, button: 'left' | 'right'): void {
    if (button === 'left') {
      this.gameController.handleSowClick(position);
    } else if (button === 'right') {
      this.gameController.handlePickClick(position);
    }
  }

  private updateUI(eventType: string, data?: unknown): void {
    // Update UI based on events - Example
    // const event = new CustomEvent('gameAppEvent', {
    //   detail: { type: eventType, data }
    // });
    // document.dispatchEvent(event);
  }

  getConnectionStatus(): {
    connected: boolean;
    inRoom: boolean;
    player: { name: string; side: string } | null;
  } {
    return {
      connected: this.gameClient.isConnected(),
      inRoom: this.gameClient.isInRoom(),
      player: this.gameClient.getCurrentPlayer()
    };
  }

  disconnect(): void {
    this.gameClient.disconnect();
  }
}
