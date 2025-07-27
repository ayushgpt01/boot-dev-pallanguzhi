import { GameClient } from './GameClient';
import { GameController } from './GameController';
import { GameView } from './GameView';
import { createPlayer } from './Player';

export class MultiplayerGameController extends GameController {
  private gameClient: GameClient;

  constructor(gameClient: GameClient, gameView: GameView) {
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

    super(placeholderPlayer1, placeholderPlayer2, gameView, {
      initialSeeds: 5,
      pitsPerPlayer: 7,
      maxDistributions: 2
    });

    this.gameClient = gameClient;
  }

  // Override to use network communication
  handleSowClick(position: Position): boolean {
    // Only allow moves for current player
    const connectionState = this.gameClient.getConnectionState();
    const currentPlayer = this.getGameState().getCurrentPlayer();

    if (connectionState.playerSide !== currentPlayer.getPlayerSide()) {
      return false;
    }

    return this.gameClient.makeMove('sow', position);
  }

  handlePickClick(position: Position): boolean {
    // Only allow moves for current player
    const connectionState = this.gameClient.getConnectionState();
    const currentPlayer = this.getGameState().getCurrentPlayer();

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
}
