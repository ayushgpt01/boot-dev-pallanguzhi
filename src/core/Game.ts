import { GameConfig, Position, SerializedGameState } from '../types/GameTypes';
import { Board } from './Board';
import { Player } from './Player';

export class Game {
  private board: Board;
  private currentPlayer: Player;
  private player1Id: string;
  private player2Id: string;
  private players: Map<string, Player>;
  private round: number;
  private gamePhase: 'picking' | 'sowing' | 'ended';
  private inHandBeads: number;
  private distributionCount: number;
  private maxDistributionCount: number;
  private lastSowPosition: Position | null;

  constructor(player1: Player, player2: Player, config: GameConfig) {
    this.board = new Board(config);
    this.player1Id = player1.getId();
    this.player2Id = player2.getId();
    this.players = new Map([
      [player1.getId(), player1],
      [player2.getId(), player2]
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
  setRound(round: number): void {
    this.round = round;
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
      this.players.get(this.player1Id)!.getActivePitCount(this) === 0 ||
      this.players.get(this.player2Id)!.getActivePitCount(this) === 0
    );
  }

  switchPlayer(): void {
    const player1 = this.players.get(this.player1Id)!;
    const player2 = this.players.get(this.player2Id)!;
    this.currentPlayer = this.currentPlayer === player1 ? player2 : player1;
  }

  reset(): void {
    this.gamePhase = 'picking';
    this.inHandBeads = 0;
    this.distributionCount = 0;
    this.lastSowPosition = null;
  }

  getGameState(): SerializedGameState {
    return {
      board: this.board.getBoardState(),
      currentPlayerId: this.currentPlayer.getId(),
      round: this.round,
      gamePhase: this.gamePhase,
      inHandBeads: this.inHandBeads,
      distributionCount: this.distributionCount,
      lastSowPosition: this.lastSowPosition
    };
  }

  updateGameState(state: SerializedGameState): void {
    this.board.applyBoardState(state.board);
    this.currentPlayer = this.players.get(state.currentPlayerId)!;
    this.round = state.round;
    this.gamePhase = state.gamePhase;
    this.inHandBeads = state.inHandBeads;
    this.distributionCount = state.distributionCount;
    this.lastSowPosition = state.lastSowPosition;
  }
}
