import { GameConfig, Position } from '../types/GameTypes';
import { EventTypes, GameClient } from './GameClient';
import { GameController } from './GameController';
import { GameView } from './GameView';
import { createPlayer } from './Player';

export class MultiplayerGameController extends GameController {
  private gameClient: GameClient;
  private isPausedRemotely = false;

  constructor(
    gameClient: GameClient,
    gameView: GameView,
    gameConfig: GameConfig
  ) {
    // Initialize with placeholder players - real players will be set when joining room
    const placeholderPlayer1 = createPlayer(
      'human',
      'temp1',
      'Temp1',
      'player1'
    );
    const placeholderPlayer2 = createPlayer(
      'human',
      'temp2',
      'Temp2',
      'player2'
    );

    super(placeholderPlayer1, placeholderPlayer2, gameView, gameConfig);

    this.gameClient = gameClient;
    this.setupGameClientListeners();
  }

  private setupGameClientListeners() {
    this.gameClient.on(EventTypes.roomJoined, ({ detail }) => {
      const { opponent } = detail;
      if (opponent && opponent.name && opponent.isConnected) {
        this.onOpponentJoined(opponent.name);
      }
    });

    // this.gameClient.on(EventTypes.opponentDisconnected, () => {});
    // this.gameClient.on(EventTypes.opponentReconnected, () => {});
    this.gameClient.on(EventTypes.gamePaused, ({ detail }) => {
      const { pausedBy } = detail;
      if (pausedBy) {
        this.onGamePaused(pausedBy);
      }
    });
    this.gameClient.on(EventTypes.gameResumed, ({ detail }) => {
      const { resumedBy } = detail;
      if (resumedBy) {
        this.onGameResumed(resumedBy);
      }
    });
    this.gameClient.on(EventTypes.gameEnded, ({ detail }) => {
      const { reason } = detail;
      if (reason) {
        this.onGameEnded(reason);
      }
    });
    this.gameClient.on(EventTypes.opponentMove, ({ detail }) => {
      const { player, action, position } = detail;
      if (player && action && position) {
        if (action === 'sow') {
          this.handleSowClick(position);
        } else {
          this.handlePickClick(position);
        }
      }
    });
  }

  private getGameView(): GameView {
    return super.getGameViewInstance();
  }

  private onOpponentJoined(name: string) {
    this.getGameView().onOpponentJoined(name);
  }

  private onOpponentDisconnected() {
    this.isPausedRemotely = true;
    this.getGameView().onOpponentDisconnected();
  }

  private onOpponentReconnected() {
    this.isPausedRemotely = false;
    this.getGameView().onOpponentReconnected();
  }

  private onGamePaused(by: string) {
    this.isPausedRemotely = true;
    this.getGameView().onGamePaused(by);
  }

  private onGameResumed(by: string) {
    this.isPausedRemotely = false;
    this.getGameView().onGameResumed(by);
  }

  private onGameEnded(reason: string) {
    this.getGameView().onGameEnded(reason);
    super.endGame(); // Ensures game logic ends too
  }

  // Override to use network communication
  handleSowClick(position: Position): boolean {
    // Only allow moves for current player
    const connectionState = this.gameClient.getConnectionState();
    const currentPlayer = this.getGameInstance().getCurrentPlayer();

    if (connectionState.playerSide !== currentPlayer.getPlayerSide()) {
      return false;
    }

    return this.gameClient.makeMove('sow', position);
  }

  handlePickClick(position: Position): boolean {
    // Only allow moves for current player
    const connectionState = this.gameClient.getConnectionState();
    const currentPlayer = this.getGameInstance().getCurrentPlayer();

    if (connectionState.playerSide !== currentPlayer.getPlayerSide()) {
      return false;
    }

    return this.gameClient.makeMove('pick', position);
  }

  // Override pause/resume to use network
  pauseGame(): void {
    this.gameClient.pauseGame();
  }

  resumeGame(): void {
    this.gameClient.resumeGame();
  }

  voteEndGame(): void {
    this.gameClient.voteEndGame();
  }

  isGamePausedRemotely(): boolean {
    return this.isPausedRemotely;
  }
}
