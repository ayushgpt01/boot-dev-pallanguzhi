import { Application, Sprite, Container, Graphics, Text } from 'pixi.js';
import { Game } from './Game';

export interface GameView {
  render(gameState: Game): void;
  highlightValidMoves(positions: Position[]): void;
  animateSowing(from: Position, to: Position): Promise<void>;
  showCapture(positions: Position[]): Promise<void>;
  registerPitSprite(position: Position, sprite: Container): void;
  registerScoreText(player: string, text: Text): void;
  registerTurnText(text: Text): void;
}

export class PixiGameView implements GameView {
  private app: Application;
  private pitSprites: Map<string, Container> = new Map();
  private storeSprites: Map<string, Container> = new Map();
  private scoreTexts: Map<string, Text> = new Map();
  private turnText: Text | null = null;

  constructor(app: Application) {
    this.app = app;
    this.setupBoard();
  }

  private setupBoard(): void {
    // This will be called by the board creation in main.ts
    // The actual board setup is handled in the board.ts file
  }

  render(gameState: Game): void {
    const { activePits, pits, stores } = gameState.getBoard().getBoardState();

    // Update pit counts and visuals
    for (let player = 0; player < 2; player++) {
      const playerSide = player === 0 ? 'player1' : 'player2';
      for (let pit = 0; pit < pits[player].length; pit++) {
        const key = `${playerSide}-${pit}`;
        const sprite = this.pitSprites.get(key);
        if (sprite) {
          this.updatePitVisual(
            sprite,
            pits[player][pit],
            activePits[player][pit]
          );
        }
      }
    }

    // Update stores
    this.updateStoreVisual('player1', stores[0]);
    this.updateStoreVisual('player2', stores[1]);

    // Update turn display
    this.updateTurnDisplay(gameState);

    // Highlight current player's valid moves
    if (gameState.getGamePhase() === 'picking') {
      this.highlightCurrentPlayerPits(gameState);
    }
  }

  private updatePitVisual(
    sprite: Container,
    count: number,
    isActive: boolean
  ): void {
    // Update visual representation based on game state
    const circle = sprite.children[0] as Graphics;
    if (!isActive) {
      circle.tint = 0x666666; // Gray out inactive pits
    } else {
      circle.tint = 0xffffff;
    }

    // Update seed count
    this.updatePitSeeds(sprite, count);
  }

  private updatePitSeeds(pit: Container, targetCount: number): void {
    const currentSeeds = pit.children.slice(1); // All children except the circle
    const currentCount = currentSeeds.length;

    if (currentCount === targetCount) {
      return; // No change needed
    }

    if (currentCount > targetCount) {
      // Remove excess seeds
      const toRemove = currentCount - targetCount;
      for (let i = 0; i < toRemove; i++) {
        if (currentSeeds[i]) {
          pit.removeChild(currentSeeds[i]);
        }
      }
    } else {
      // Add more seeds
      const toAdd = targetCount - currentCount;
      for (let i = 0; i < toAdd; i++) {
        // Create new seed sprite (placeholder)
        const seedSprite = new Sprite();
        // Position randomly within pit
        const radius = 60;
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * (radius - 15);
        seedSprite.x = Math.cos(angle) * r;
        seedSprite.y = Math.sin(angle) * r;
        seedSprite.scale.set(0.15);
        pit.addChild(seedSprite);
      }
    }
  }

  private updateStoreVisual(player: string, count: number): void {
    // Update store display
    const scoreText = this.scoreTexts.get(player);
    if (scoreText) {
      scoreText.text = `Score: ${count}`;
    }
  }

  private updateTurnDisplay(gameState: Game): void {
    if (this.turnText) {
      const currentPlayer = gameState.getCurrentPlayer();
      const playerName = currentPlayer.getName();
      const gamePhase = gameState.getGamePhase();
      this.turnText.text = `Turn: ${playerName} (${gamePhase})`;
    }
  }

  private highlightCurrentPlayerPits(gameState: Game): void {
    const validPositions: Position[] = [];
    const currentPlayer = gameState.getCurrentPlayer();
    const board = gameState.getBoard();

    for (let i = 0; i < 7; i++) {
      const position: Position = {
        player: currentPlayer.getPlayerSide(),
        pitIndex: i
      };
      if (board.isPitActive(position) && !board.isPitEmpty(position)) {
        validPositions.push(position);
      }
    }

    this.highlightValidMoves(validPositions);
  }

  highlightValidMoves(positions: Position[]): void {
    // Reset all pit highlights
    this.pitSprites.forEach((sprite) => {
      const circle = sprite.children[0] as Graphics;
      circle.tint = 0xffffff;
    });

    // Highlight valid positions
    positions.forEach((position) => {
      const key = `${position.player}-${position.pitIndex}`;
      const sprite = this.pitSprites.get(key);
      if (sprite) {
        const circle = sprite.children[0] as Graphics;
        circle.tint = 0xffff00; // Yellow highlight for valid moves
      }
    });
  }

  async animateSowing(from: Position, to: Position): Promise<void> {
    // Implement sowing animation
    return new Promise((resolve) => setTimeout(resolve, 300));
  }

  async showCapture(positions: Position[]): Promise<void> {
    // Implement capture animation
    return new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Method to register pit sprites from board creation
  registerPitSprite(position: Position, sprite: Container): void {
    const key = `${position.player}-${position.pitIndex}`;
    this.pitSprites.set(key, sprite);
  }

  // Method to register score texts
  registerScoreText(player: string, text: Text): void {
    this.scoreTexts.set(player, text);
  }

  // Method to register turn text
  registerTurnText(text: Text): void {
    this.turnText = text;
  }
}
