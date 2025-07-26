import { Game } from './Game';

export abstract class Player {
  protected id: string;
  protected name: string;
  protected playerSide: 'player1' | 'player2';

  constructor(id: string, name: string, side: 'player1' | 'player2') {
    this.id = id;
    this.name = name;
    this.playerSide = side;
  }

  getId(): string {
    return this.id;
  }
  getName(): string {
    return this.name;
  }
  getPlayerSide(): 'player1' | 'player2' {
    return this.playerSide;
  }

  abstract makeMove(gameState: Game): Promise<Position>;

  getActivePitCount(): number {
    // This will be called by GameState, implement based on board access
    return 7; // Placeholder
  }
}

export class HumanPlayer extends Player {
  private pendingMove: ((position: Position) => void) | null = null;

  async makeMove(gameState: Game): Promise<Position> {
    return new Promise((resolve) => {
      this.pendingMove = resolve;
      // UI will call this.submitMove() when player clicks
    });
  }

  submitMove(position: Position): void {
    if (this.pendingMove) {
      this.pendingMove(position);
      this.pendingMove = null;
    }
  }
}

export class AIPlayer extends Player {
  async makeMove(gameState: Game): Promise<Position> {
    // Simple AI: pick first available pit
    const board = gameState.getBoard();

    for (let i = 0; i < 7; i++) {
      const position: Position = { player: this.playerSide, pitIndex: i };
      if (board.isPitActive(position) && !board.isPitEmpty(position)) {
        return position;
      }
    }

    throw new Error('No valid moves available');
  }
}
