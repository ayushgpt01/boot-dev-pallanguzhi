import { Game } from './Game';
import { GameView } from './GameView';
import { HumanPlayer, Player } from './Player';

export class GameController {
  private gameState: Game;
  private gameView: GameView;
  private eventEmitter: EventTarget;

  constructor(
    player1: Player,
    player2: Player,
    gameView: GameView,
    config: GameConfig
  ) {
    this.gameState = new Game(player1, player2, config);
    this.gameView = gameView;
    this.eventEmitter = new EventTarget();

    this.setupEventListeners();
    this.updateView();
  }

  private setupEventListeners(): void {
    this.eventEmitter.addEventListener('gameStateChanged', () => {
      this.updateView();
    });
  }

  async startGame(): Promise<void> {
    while (!this.gameState.isGameOver()) {
      await this.playTurn();
    }
    this.endGame();
  }

  private async playTurn(): Promise<void> {
    const currentPlayer = this.gameState.getCurrentPlayer();

    // Phase 1: Pick beads
    if (this.gameState.getGamePhase() === 'picking') {
      const pickPosition = await currentPlayer.makeMove(this.gameState);
      this.pickBeads(pickPosition);
    }

    // Phase 2: Sow beads
    while (this.gameState.getGamePhase() === 'sowing') {
      await this.sowNextBead();
    }

    this.endTurn();
  }

  private pickBeads(position: Position): void {
    const board = this.gameState.getBoard();

    if (!this.canPickFrom(position)) {
      throw new Error('Invalid pick position');
    }

    const beads = board.emptyPit(position);
    this.gameState.setInHandBeads(beads);
    this.gameState.setGamePhase('sowing');
    this.gameState.setLastSowPosition(position);

    this.emitStateChange();
  }

  private async sowNextBead(): Promise<void> {
    if (this.gameState.getInHandBeads() <= 0) {
      this.handleEmptyHand();
      return;
    }

    const board = this.gameState.getBoard();
    const lastPosition = this.gameState.getLastSowPosition()!;
    const nextPosition = board.getNextPosition(lastPosition);

    // Sow one bead
    board.incrementPit(nextPosition);
    this.gameState.decrementInHandBeads();
    this.gameState.setLastSowPosition(nextPosition);

    // Check for 4-bead capture
    if (board.getPitCount(nextPosition) === 4) {
      this.performFourBeadCapture(nextPosition);
    }

    this.emitStateChange();

    // Add delay for animation
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  private handleEmptyHand(): void {
    const board = this.gameState.getBoard();
    const lastPosition = this.gameState.getLastSowPosition()!;
    const nextPosition = board.getNextPosition(lastPosition);

    if (board.isPitEmpty(nextPosition)) {
      this.performEmptyPitCapture(nextPosition);
      this.gameState.setGamePhase('picking');
    } else if (this.gameState.getDistributionCount() < 2) {
      // Start second distribution
      this.gameState.incrementDistribution();
      const beads = board.emptyPit(nextPosition);
      this.gameState.setInHandBeads(beads);
      this.gameState.setLastSowPosition(nextPosition);
    } else {
      this.gameState.setGamePhase('picking');
    }
  }

  private performEmptyPitCapture(emptyPosition: Position): void {
    const board = this.gameState.getBoard();
    const nextPosition = board.getNextPosition(emptyPosition);
    const oppositePosition = board.getOppositePosition(nextPosition);

    let capturedBeads = board.emptyPit(nextPosition);

    if (!board.isPitEmpty(oppositePosition)) {
      capturedBeads += board.emptyPit(oppositePosition);
    }

    const currentPlayer = this.gameState.getCurrentPlayer();
    board.addToStore(currentPlayer.getPlayerSide(), capturedBeads);
  }

  private performFourBeadCapture(position: Position): void {
    const board = this.gameState.getBoard();
    const currentPlayer = this.gameState.getCurrentPlayer();

    const capturedBeads = board.emptyPit(position);
    board.addToStore(currentPlayer.getPlayerSide(), capturedBeads);
  }

  private canPickFrom(position: Position): boolean {
    const board = this.gameState.getBoard();
    const currentPlayer = this.gameState.getCurrentPlayer();

    return (
      position.player === currentPlayer.getPlayerSide() &&
      board.isPitActive(position) &&
      !board.isPitEmpty(position) &&
      this.gameState.getGamePhase() === 'picking'
    );
  }

  private endTurn(): void {
    this.gameState.switchPlayer();
    this.gameState.reset();

    if (this.isRoundComplete()) {
      this.endRound();
    }
  }

  private isRoundComplete(): boolean {
    return this.gameState.getBoard().getTotalBeadsOnBoard() === 0;
  }

  private endRound(): void {
    this.applyPauperLogic();
    // Start new round or end game
  }

  private applyPauperLogic(): void {
    // Implementation for pauper logic
  }

  private endGame(): void {
    this.gameState.setGamePhase('ended');
    this.emitStateChange();
  }

  private updateView(): void {
    this.gameView.render(this.gameState);
  }

  private emitStateChange(): void {
    this.eventEmitter.dispatchEvent(new CustomEvent('gameStateChanged'));
  }

  // Public methods for UI interaction
  handlePitClick(position: Position): void {
    const currentPlayer = this.gameState.getCurrentPlayer();
    if (
      currentPlayer instanceof HumanPlayer &&
      this.gameState.getGamePhase() === 'picking'
    ) {
      currentPlayer.submitMove(position);
    }
  }

  getGameState(): Game {
    return this.gameState;
  }
}
