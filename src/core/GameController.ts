import { Game } from './Game';
import { GameView } from './GameView';
import { HumanPlayer, Player } from './Player';

export class GameController {
  private gameState: Game;
  public gameView: GameView;
  private eventEmitter: EventTarget;
  private isPaused: boolean = false;
  private pauseResolver: ((value: void) => void) | null = null;

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

    this.eventEmitter.addEventListener('gamePaused', () => {
      // Need to show the pause Game UI
      console.log('Game paused');
    });

    this.eventEmitter.addEventListener('gameResumed', () => {
      // Need to show the resume Game UI
      console.log('Game resumed');
    });
    // Other event listeners like 'gameEnded' or 'updateUI' or web socket events
  }

  async startGame(): Promise<void> {
    while (!this.gameState.isGameOver()) {
      await this.playTurn();
    }
    this.endGame();
  }

  private async playTurn(): Promise<void> {
    const currentPlayer = this.gameState.getCurrentPlayer();

    // Wait if game is paused
    await this.waitIfPaused();

    // For AI players, handle automatically
    if (!(currentPlayer instanceof HumanPlayer)) {
      await this.handleAITurn();
      return;
    }

    // For human players, wait for user interactions
    await this.handleHumanTurn();
  }

  private async handleAITurn(): Promise<void> {
    const currentPlayer = this.gameState.getCurrentPlayer();

    // Phase 1: AI picks beads
    if (this.gameState.getGamePhase() === 'picking') {
      const pickPosition = await currentPlayer.makeMove(this.gameState);
      try {
        this.pickBeads(pickPosition);
      } catch (e) {
        console.error('AI invalid move:', e);
        this.endTurn();
        return;
      }
    }

    // Phase 2: AI sows automatically with animation delays
    while (this.gameState.getGamePhase() === 'sowing') {
      await this.waitIfPaused();
      await this.sowNextBead();
    }

    this.endTurn();
  }

  private async handleHumanTurn(): Promise<void> {
    // Human turn is handled by user events (mouse clicks)
    // This method waits until the turn is complete
    return new Promise((resolve) => {
      const checkTurnComplete = () => {
        if (
          this.gameState.getGamePhase() === 'picking' &&
          this.gameState.getInHandBeads() === 0
        ) {
          resolve();
        } else {
          setTimeout(checkTurnComplete, 100);
        }
      };
      checkTurnComplete();
    });
  }

  private async waitIfPaused(): Promise<void> {
    if (this.isPaused) {
      return new Promise((resolve) => {
        this.pauseResolver = resolve;
      });
    }
  }

  handleSowClick(position: Position): boolean {
    const currentPlayer = this.gameState.getCurrentPlayer();

    // Only current player can sow
    if (!(currentPlayer instanceof HumanPlayer)) {
      return false;
    }

    // Can only sow when in sowing phase and have beads
    if (
      this.gameState.getGamePhase() !== 'sowing' ||
      this.gameState.getInHandBeads() <= 0
    ) {
      return false;
    }

    // Can only sow to next valid position
    const board = this.gameState.getBoard();
    const lastPosition = this.gameState.getLastSowPosition()!;
    const nextPosition = board.getNextPosition(lastPosition);

    if (
      position.player !== nextPosition.player ||
      position.pitIndex !== nextPosition.pitIndex
    ) {
      return false;
    }

    try {
      this.sowBead(position);
      return true;
    } catch (e) {
      console.error('Invalid sow:', e);
      return false;
    }
  }

  /**
   * Handle right mouse button - PICK action
   * Any player can pick from their own side
   */
  handlePickClick(position: Position): boolean {
    // Can only pick during picking phase
    if (this.gameState.getGamePhase() !== 'picking') {
      return false;
    }

    // Player can only pick from their own side
    const currentPlayer = this.gameState.getCurrentPlayer();
    if (!(currentPlayer instanceof HumanPlayer)) {
      return false;
    }

    if (position.player !== currentPlayer.getPlayerSide()) {
      return false;
    }

    try {
      this.pickBeads(position);
      return true;
    } catch (e) {
      console.error('Invalid pick:', e);
      return false;
    }
  }

  pauseGame(): void {
    this.isPaused = true;
    this.eventEmitter.dispatchEvent(new CustomEvent('gamePaused'));
  }

  resumeGame(): void {
    this.isPaused = false;
    if (this.pauseResolver) {
      this.pauseResolver();
      this.pauseResolver = null;
    }
    this.eventEmitter.dispatchEvent(new CustomEvent('gameResumed'));
  }

  togglePause(): void {
    if (this.isPaused) {
      this.resumeGame();
    } else {
      this.pauseGame();
    }
  }

  isPausedState(): boolean {
    return this.isPaused;
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

  private sowBead(position: Position): void {
    if (this.gameState.getInHandBeads() <= 0) {
      throw new Error('No beads in hand');
    }

    const board = this.gameState.getBoard();

    // Sow one bead
    board.incrementPit(position);
    this.gameState.decrementInHandBeads();
    this.gameState.setLastSowPosition(position);

    // Check for 4-bead capture
    if (board.getPitCount(position) === 4) {
      this.performFourBeadCapture(position);
    }

    // Handle empty hand
    if (this.gameState.getInHandBeads() === 0) {
      this.handleEmptyHand();
    }

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
    } else if (
      this.gameState.getDistributionCount() <
      this.gameState.getMaxDistributions()
    ) {
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

  getGameState(): Game {
    return this.gameState;
  }

  getValidSowPositions(): Position[] {
    if (
      this.gameState.getGamePhase() !== 'sowing' ||
      this.gameState.getInHandBeads() <= 0
    ) {
      return [];
    }

    const board = this.gameState.getBoard();
    const lastPosition = this.gameState.getLastSowPosition()!;
    const nextPosition = board.getNextPosition(lastPosition);

    return [nextPosition];
  }

  getValidPickPositions(): Position[] {
    if (this.gameState.getGamePhase() !== 'picking') {
      return [];
    }

    const currentPlayer = this.gameState.getCurrentPlayer();
    if (!(currentPlayer instanceof HumanPlayer)) {
      return [];
    }

    const board = this.gameState.getBoard();
    const validPositions: Position[] = [];

    for (let i = 0; i < 7; i++) {
      const position: Position = {
        player: currentPlayer.getPlayerSide(),
        pitIndex: i
      };

      if (board.isPitActive(position) && !board.isPitEmpty(position)) {
        validPositions.push(position);
      }
    }

    return validPositions;
  }

  getInHandBeads(): number {
    return this.gameState.getInHandBeads();
  }

  isCurrentPlayerTurn(playerSide: 'player1' | 'player2'): boolean {
    return this.gameState.getCurrentPlayer().getPlayerSide() === playerSide;
  }
}
