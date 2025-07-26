import { GameEvent, GameEventType, GameState } from '../types/GameTypes';
import { Board } from './Board';
import { Player } from './Player';

export class Game {
  board: Board;
  players: [Player, Player];
  activePlayer: number = 0;
  state: GameState = 'playing';

  onEvent?: (event: GameEvent) => void;

  constructor(p1: Player, p2: Player) {
    this.players = [p1, p2];
    this.board = new Board();
  }

  async playTurn(): Promise<void> {
    if (this.state !== 'playing') return;

    const player = this.players[this.activePlayer];
    const move = await player.getMove(this.board.clone());

    const { nextPlayer } = this.board.sow(this.activePlayer, move);
    this.activePlayer = nextPlayer;

    this.emitEvent('move', { move, board: this.board.clone() });

    if (this.board.isGameOver()) {
      this.state = 'over';
      this.emitEvent('game_over', {
        winner: this.getWinner(),
        finalScores: [...this.board.captured]
      });
    }
  }

  pause(): void {
    this.state = 'paused';
    this.emitEvent('pause', {});
  }

  resume(): void {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.emitEvent('resume', {});
    }
  }

  private getWinner(): number | null {
    const [s1, s2] = this.board.captured;
    return s1 > s2 ? 0 : s2 > s1 ? 1 : null;
  }

  private emitEvent(type: GameEventType, data: any): void {
    this.onEvent?.({ type, data });
  }
}
