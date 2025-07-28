import { Position } from '../types/GameTypes';
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

  // For AI players only - human players use direct mouse events
  abstract makeMove(gameState: Game): Promise<Position>;

  // Check if this player type requires waiting for user input
  abstract isHuman(): boolean;

  getActivePitCount(gameState: Game): number {
    const board = gameState.getBoard();
    let count = 0;

    for (let i = 0; i < 7; i++) {
      const position: Position = { player: this.playerSide, pitIndex: i };
      if (board.isPitActive(position)) {
        count++;
      }
    }

    return count;
  }
}

export class HumanPlayer extends Player {
  isHuman(): boolean {
    return true;
  }

  // This method should never be called for human players
  // Human moves are handled through handleSowClick/handlePickClick in Controller
  async makeMove(gameState: Game): Promise<Position> {
    throw new Error(
      'HumanPlayer.makeMove() should not be called. Use mouse event handlers instead.'
    );
  }

  // Helper method to check if player can make a move (for UI)
  canMakeMove(gameState: Game): boolean {
    if (gameState.getGamePhase() !== 'picking') {
      return false;
    }

    const board = gameState.getBoard();
    for (let i = 0; i < 7; i++) {
      const position: Position = { player: this.playerSide, pitIndex: i };
      if (board.isPitActive(position) && !board.isPitEmpty(position)) {
        return true;
      }
    }

    return false;
  }

  // Get all valid pick positions for this player
  getValidPickPositions(gameState: Game): Position[] {
    if (gameState.getGamePhase() !== 'picking') {
      return [];
    }

    const board = gameState.getBoard();
    const validPositions: Position[] = [];

    for (let i = 0; i < 7; i++) {
      const position: Position = { player: this.playerSide, pitIndex: i };
      if (board.isPitActive(position) && !board.isPitEmpty(position)) {
        validPositions.push(position);
      }
    }

    return validPositions;
  }
}

export class RemotePlayer extends Player {
  constructor(id: string, name: string, side: 'player1' | 'player2') {
    super(id, name, side);
  }

  isHuman(): boolean {
    return true; // Remote players are human players
  }

  async makeMove(gameState: Game): Promise<Position> {
    throw new Error('RemotePlayer moves are handled via WebSocket messages');
  }
}

export class AIPlayer extends Player {
  private difficulty: 'easy' | 'medium' | 'hard';

  constructor(
    id: string,
    name: string,
    side: 'player1' | 'player2',
    difficulty: 'easy' | 'medium' | 'hard' = 'hard'
  ) {
    super(id, name, side);
    this.difficulty = difficulty;
  }

  isHuman(): boolean {
    return false;
  }

  async makeMove(gameState: Game): Promise<Position> {
    // Add a small delay to make AI moves feel more natural
    await new Promise((resolve) => setTimeout(resolve, 500));

    const validMoves = this.getValidMoves(gameState);

    if (validMoves.length === 0) {
      throw new Error('No valid moves available for AI');
    }

    switch (this.difficulty) {
      case 'easy':
        return this.makeRandomMove(validMoves);
      case 'medium':
        return this.makeGreedyMove(gameState, validMoves);
      case 'hard':
        return this.makeBestMove(gameState, validMoves);
      default:
        return validMoves[0];
    }
  }

  private getValidMoves(gameState: Game): Position[] {
    const board = gameState.getBoard();
    const validMoves: Position[] = [];

    for (let i = 0; i < 7; i++) {
      const position: Position = { player: this.playerSide, pitIndex: i };
      if (board.isPitActive(position) && !board.isPitEmpty(position)) {
        validMoves.push(position);
      }
    }

    return validMoves;
  }

  private makeRandomMove(validMoves: Position[]): Position {
    const randomIndex = Math.floor(Math.random() * validMoves.length);
    return validMoves[randomIndex];
  }

  private makeGreedyMove(gameState: Game, validMoves: Position[]): Position {
    const board = gameState.getBoard();

    // Prefer moves with more beads (more sowing opportunities)
    let bestMove = validMoves[0];
    let maxBeads = board.getPitCount(bestMove);

    for (const move of validMoves) {
      const beadCount = board.getPitCount(move);
      if (beadCount > maxBeads) {
        maxBeads = beadCount;
        bestMove = move;
      }
    }

    return bestMove;
  }

  private makeBestMove(gameState: Game, validMoves: Position[]): Position {
    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    for (const move of validMoves) {
      const score = this.evaluateMove(gameState, move);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  private evaluateMove(gameState: Game, move: Position): number {
    const board = gameState.getBoard();
    let score = 0;

    // Simulate the move to evaluate its potential
    const beadCount = board.getPitCount(move);

    // Base score: more beads = more opportunities, so we want to prioritize moves with
    // more beads
    score += beadCount * 2;

    // THis we might need to look later.
    const simulatedEndPosition = this.simulateMove(gameState, move);
    if (simulatedEndPosition) {
      const nextPos = board.getNextPosition(simulatedEndPosition);
      if (board.isPitEmpty(nextPos)) {
        score += 10; // Potential capture bonus
      }
    }

    // Prefer moves from pits with fewer neighbors to avoid picking from only one pit
    if (move.pitIndex === 0 || move.pitIndex === 6) {
      score += 3;
    }

    return score;
  }

  private simulateMove(gameState: Game, move: Position): Position | null {
    const board = gameState.getBoard();
    const beadCount = board.getPitCount(move);

    if (beadCount === 0) return null;

    // Simple simulation: just calculate where the last bead would land
    let currentPos = move;
    for (let i = 0; i < beadCount; i++) {
      currentPos = board.getNextPosition(currentPos);
    }

    return currentPos;
  }

  // AI-specific method to get the next sow position during automatic sowing
  getNextSowPosition(gameState: Game): Position | null {
    if (gameState.getInHandBeads() <= 0) {
      return null;
    }

    const board = gameState.getBoard();
    const lastPosition = gameState.getLastSowPosition();

    if (!lastPosition) {
      return null;
    }

    return board.getNextPosition(lastPosition);
  }
}

// Factory function to create players easily
export function createPlayer(
  type: 'human' | 'ai',
  id: string,
  name: string,
  side: 'player1' | 'player2',
  aiDifficulty?: 'easy' | 'medium' | 'hard'
): Player {
  if (type === 'human') {
    return new HumanPlayer(id, name, side);
  } else {
    return new AIPlayer(id, name, side, aiDifficulty || 'hard');
  }
}

// Type guards for easier type checking
export function isHumanPlayer(player: Player): player is HumanPlayer {
  return player.isHuman();
}

export function isAIPlayer(player: Player): player is AIPlayer {
  return !player.isHuman();
}
