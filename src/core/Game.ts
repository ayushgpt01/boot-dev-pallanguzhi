import { Board } from './Board';
import { Player } from './Player';

export class Game {
  private board: Board;
  private currentPlayer: Player;
  private players: Map<string, Player>;
  private round: number;
  private gamePhase: 'picking' | 'sowing' | 'ended';
  private inHandBeads: number;
  private distributionCount: number;
  private maxDistributionCount: number;
  private lastSowPosition: Position | null;

  constructor(player1: Player, player2: Player, config: GameConfig) {
    this.board = new Board(config);

    for (let i = 0; i < config.pitsPerPlayer; i++) {
      this.board.setPitCount(
        { player: 'player1', pitIndex: i },
        config.initialSeeds
      );
      this.board.setPitCount(
        { player: 'player2', pitIndex: i },
        config.initialSeeds
      );

      // console.log(
      //   `Set pit ${i} for ${'player1'} to ${config.initialSeeds}, actual: ${this.board.getPitCount({ player: 'player1', pitIndex: i })}`
      // );
      // console.log(
      //   `Set pit ${i} for ${'player2'} to ${config.initialSeeds}, actual: ${this.board.getPitCount({ player: 'player2', pitIndex: i })}`
      // );
    }

    this.players = new Map([
      ['player1', player1],
      ['player2', player2]
    ]);
    this.currentPlayer = player1;
    this.round = 1;
    this.gamePhase = 'picking';
    this.inHandBeads = 0;
    this.distributionCount = 0;
    this.lastSowPosition = null;
    this.maxDistributionCount = config.maxDistributions;
  }

  // Getters
  getBoard(): Board {
    return this.board;
  }
  getCurrentPlayer(): Player {
    return this.currentPlayer;
  }
  getPlayers(): Map<string, Player> {
    return this.players;
  }
  getRound(): number {
    return this.round;
  }
  getGamePhase(): string {
    return this.gamePhase;
  }
  getInHandBeads(): number {
    console.log('Hello from getInHandBeads');
    return this.inHandBeads;
  }
  getDistributionCount(): number {
    return this.distributionCount;
  }
  getLastSowPosition(): Position | null {
    return this.lastSowPosition;
  }
  getMaxDistributions(): number {
    return this.maxDistributionCount;
  }

  // Setters
  setCurrentPlayer(player: Player): void {
    this.currentPlayer = player;
  }
  setGamePhase(phase: 'picking' | 'sowing' | 'ended'): void {
    this.gamePhase = phase;
  }
  setInHandBeads(count: number): void {
    this.inHandBeads = count;
  }
  setDistributionCount(count: number): void {
    this.distributionCount = count;
  }
  setLastSowPosition(position: Position | null): void {
    this.lastSowPosition = position;
  }
  incrementDistribution(): void {
    this.distributionCount++;
  }
  decrementInHandBeads(): void {
    this.inHandBeads--;
  }

  // State queries
  isGameOver(): boolean {
    return (
      this.gamePhase === 'ended' ||
      this.players.get('player1')!.getActivePitCount(this) === 0 ||
      this.players.get('player2')!.getActivePitCount(this) === 0
    );
  }

  switchPlayer(): void {
    const player1 = this.players.get('player1')!;
    const player2 = this.players.get('player2')!;
    this.currentPlayer = this.currentPlayer === player1 ? player2 : player1;
  }

  reset(): void {
    this.gamePhase = 'picking';
    this.inHandBeads = 0;
    this.distributionCount = 0;
    this.lastSowPosition = null;
  }
}
