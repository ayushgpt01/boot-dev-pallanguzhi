import { Application, Texture } from 'pixi.js';
import { Game } from './Game';
import { GameView } from './GameView';
import {
  AIPlayer,
  HumanPlayer,
  isAIPlayer,
  isHumanPlayer,
  Player
} from './Player';

interface SeedAssets {
  [key: string]: Texture;
}

export class GameController {
  private gameState: Game;
  public gameView: GameView;
  private eventEmitter: EventTarget;
  private isPaused: boolean = false;
  private pauseResolver: ((value: void) => void) | null = null;
  private currentTurnResolver: ((value: void) => void) | null = null;

  constructor(
    player1: Player,
    player2: Player,
    app: Application,
    seedAssets: SeedAssets,
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
      console.log('Game paused');
    });

    this.eventEmitter.addEventListener('gameResumed', () => {
      console.log('Game resumed');
    });

    this.eventEmitter.addEventListener('turnCompleted', () => {
      if (this.currentTurnResolver) {
        this.currentTurnResolver();
        this.currentTurnResolver = null;
      }
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

    // Wait if game is paused
    await this.waitIfPaused();

    if (isAIPlayer(currentPlayer)) {
      await this.handleAITurn();
    } else {
      await this.handleHumanTurn();
    }
  }

  private async handleAITurn(): Promise<void> {
    const currentPlayer = this.gameState.getCurrentPlayer() as AIPlayer;

    // Phase 1: AI picks beads
    if (this.gameState.getGamePhase() === 'picking') {
      try {
        const pickPosition = await currentPlayer.makeMove(this.gameState);
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

      const nextSowPosition = currentPlayer.getNextSowPosition(this.gameState);
      if (nextSowPosition && this.gameState.getInHandBeads() > 0) {
        this.sowBead(nextSowPosition);
        // Add delay for animation
        await new Promise((resolve) => setTimeout(resolve, 300));
      } else {
        break;
      }
    }

    this.endTurn();
  }

  private async handleHumanTurn(): Promise<void> {
    // Human turn is handled by mouse events
    // Wait until turn is completed (phase returns to picking with no beads in hand)
    return new Promise((resolve) => {
      this.currentTurnResolver = resolve;

      // Set up a backup check in case events don't fire properly
      // NOTE - If game ends prematurely check here
      const checkTurnComplete = () => {
        if (
          this.gameState.getGamePhase() === 'picking' &&
          this.gameState.getInHandBeads() === 0
        ) {
          if (this.currentTurnResolver) {
            this.currentTurnResolver();
            this.currentTurnResolver = null;
          }
        } else {
          setTimeout(checkTurnComplete, 100);
        }
      };

      // Start the backup check
      setTimeout(checkTurnComplete, 100);
    });
  }

  private async waitIfPaused(): Promise<void> {
    if (this.isPaused) {
      return new Promise((resolve) => {
        this.pauseResolver = resolve;
      });
    }
  }

  /**
   * Handle left mouse button - SOW action
   * Only current human player can sow
   */
  handleSowClick(position: Position): boolean {
    const currentPlayer = this.gameState.getCurrentPlayer();

    // Only human players can manually sow
    if (!isHumanPlayer(currentPlayer)) {
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

      // Check if turn is complete after sowing
      if (
        this.gameState.getGamePhase() === 'picking' &&
        this.gameState.getInHandBeads() === 0
      ) {
        this.completeTurn();
      }

      return true;
    } catch (e) {
      console.error('Invalid sow:', e);
      return false;
    }
  }

  /**
   * Handle right mouse button - PICK action
   */
  handlePickClick(player: Player, position: Position): boolean {
    // Only human players can manually pick
    if (!isHumanPlayer(player)) {
      return false;
    }

    // Can only pick during picking phase
    if (this.gameState.getGamePhase() !== 'picking') {
      return false;
    }

    // Player can only pick from their own side
    if (position.player !== player.getPlayerSide()) {
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

  private completeTurn(): void {
    this.eventEmitter.dispatchEvent(new CustomEvent('turnCompleted'));
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

  getValidPickPositionsForPlayer(player: Player): Position[] {
    if (isHumanPlayer(player)) {
      return player.getValidPickPositions(this.gameState);
    }

    return [];
  }

  getValidSowPositions(): Position[] {
    const currentPlayer = this.gameState.getCurrentPlayer();

    if (
      !isHumanPlayer(currentPlayer) ||
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
    const currentPlayer = this.gameState.getCurrentPlayer();

    if (
      !isHumanPlayer(currentPlayer) ||
      this.gameState.getGamePhase() !== 'picking'
    ) {
      return [];
    }

    return currentPlayer.getValidPickPositions(this.gameState);
  }

  isCurrentPlayerHuman(): boolean {
    return isHumanPlayer(this.gameState.getCurrentPlayer());
  }

  getCurrentPlayerInfo(): {
    id: string;
    name: string;
    side: 'player1' | 'player2';
    isHuman: boolean;
  } {
    const player = this.gameState.getCurrentPlayer();
    return {
      id: player.getId(),
      name: player.getName(),
      side: player.getPlayerSide(),
      isHuman: isHumanPlayer(player)
    };
  }

  getGameState(): Game {
    return this.gameState;
  }
}
