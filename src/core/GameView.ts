import {
  Application,
  Sprite,
  Container,
  Graphics,
  Text,
  Texture,
  TextStyle
} from 'pixi.js';
import { Game } from './Game';
import { GameController } from './GameController';

interface SeedAssets {
  [key: string]: Texture;
}

export interface GameView {
  render(gameState: Game): void;
  highlightValidMoves(positions: Position[]): void;
  animateSowing(from: Position, to: Position): Promise<void>;
  showCapture(positions: Position[]): Promise<void>;
  registerPitSprite(position: Position, sprite: Container): void;
  registerScoreText(player: string, text: Text): void;
  registerTurnText(text: Text): void;
  updatePitSeeds(pit: Container, targetCount: number, gameState: Game): void;
  onOpponentJoined(playerName: string): void;
  onOpponentDisconnected(): void;
  onOpponentReconnected(): void;
  onGamePaused(pausedBy: string): void;
  onGameResumed(resumedBy: string): void;
  onGameEnded(reason: 'vote' | 'disconnect' | string): void;
}

interface HandAssets {
  hand_open: Texture;
  hand_closed: Texture;
}

declare module 'pixi.js' {
  interface Container {
    beadCountText?: Text;
  }
}

export class PixiGameView implements GameView {
  private app: Application;
  private pitSprites: Map<string, Container> = new Map();
  private storeSprites: Map<string, Container> = new Map();
  private scoreTexts: Map<string, Text> = new Map();
  private turnText: Text | null = null;
  private seedAssets: SeedAssets;
  private handAssets: HandAssets;
  private inHandText: Text;

  constructor(
    app: Application,
    seedAssets: SeedAssets,
    handAssets: HandAssets
  ) {
    this.app = app;
    this.seedAssets = seedAssets;
    this.handAssets = handAssets;
    const style = new TextStyle({
      fill: 0xffffff,
      fontSize: 20,
      fontFamily: 'Playwrite US Trad'
    });

    const text = new Text({
      text: 'Seeds in Hand: 0',
      style
    });

    this.inHandText = text;
    this.inHandText.position.set(50, 30);
    this.app.stage.addChild(this.inHandText);
    this.setupBoard();
  }
  onOpponentJoined(playerName: string): void {
    // Update player list
  }
  onOpponentDisconnected(): void {
    // Update player list
  }
  onOpponentReconnected(): void {
    // Update player list
  }
  onGamePaused(pausedBy: string): void {
    // Update UI
  }
  onGameResumed(resumedBy: string): void {
    // Update UI
  }
  onGameEnded(reason: 'vote' | 'disconnect' | string): void {
    // Update UI
  }

  // handled in board.ts
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
            activePits[player][pit],
            gameState
          );
        }
      }
    }

    // Update stores
    this.updateStoreVisual('player1', stores[0]);
    this.updateStoreVisual('player2', stores[1]);

    this.updateInHandText(gameState.getInHandBeads().toString());

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
    isActive: boolean,
    gameState: Game
  ): void {
    // Update visual representation based on game state
    const circle = sprite.children[0] as Graphics;
    if (!isActive) {
      circle.tint = 0x666666; // Gray out inactive pits
    } else {
      circle.tint = 0xffffff;
    }

    // Update seed count
    this.updatePitSeeds(sprite, count, gameState);
  }

  public updatePitSeeds(
    pit: Container,
    targetCount: number,
    gameState: Game
  ): void {
    const currentSeeds = pit.children.slice(2); // All children except the circle
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
      const radius = 60;
      const placedSeeds: { x: number; y: number }[] = [];

      for (let i = 0; i < toAdd; i++) {
        let placed = false;
        let attempts = 0;

        while (!placed && attempts < 50) {
          attempts++;
          const angle = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random()) * (radius - 15);
          const sx = Math.cos(angle) * r;
          const sy = Math.sin(angle) * r;

          let tooClose = false;
          for (const pos of placedSeeds) {
            const dx = pos.x - sx;
            const dy = pos.y - sy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 25) {
              tooClose = true;
              break;
            }
          }

          if (!tooClose) {
            const seedSprite = Sprite.from(
              Object.values(this.seedAssets)[
                Math.floor(Math.random() * Object.keys(this.seedAssets).length)
              ]
            );
            seedSprite.anchor.set(0.5);
            seedSprite.scale.set(0.15);
            seedSprite.x = sx;
            seedSprite.y = sy;
            pit.addChild(seedSprite);
            placedSeeds.push({ x: sx, y: sy });
            placed = true;
          }

          // if (!placed) {
          //   // Just place it anyway without checking
          //   const sx = Math.random() * 2 * radius - radius;
          //   const sy = Math.random() * 2 * radius - radius;
          //   const seedSprite = Sprite.from(
          //     Object.values(this.seedAssets)[
          //       Math.floor(Math.random() * Object.keys(this.seedAssets).length)
          //     ]
          //   );

          //   seedSprite.x = sx;
          //   seedSprite.y = sy;
          //   pit.addChild(seedSprite);
          // }
        }
      }
    }

    // Update hand visibility after seed changes
    const position = Array.from(this.pitSprites.entries()).find(
      ([_, sprite]) => sprite === pit
    )?.[0];
    if (position) {
      const pos = position.split('-');
      this.updateHandVisibility(
        {
          player: pos[0] as 'player1' | 'player2',
          pitIndex: parseInt(pos[1])
        },
        gameState
      );
    }

    const beadText = (pit as any).beadCountText;
    if (beadText) {
      beadText.text = `${targetCount}`;
    }
  }

  private updateHandVisibility(position: Position, gameState: Game): void {
    const key = `${position.player}-${position.pitIndex}`;
    const pit = this.pitSprites.get(key);
    if (!pit) return;

    const handSprite = pit.children[1] as Sprite; // Hand is second child

    if (!gameState) return;

    const board = gameState.getBoard();
    const currentPlayer = gameState.getCurrentPlayer();

    if (gameState.getGamePhase() === 'picking') {
      if (
        position.player == currentPlayer.getPlayerSide() &&
        board.isPitActive(position) &&
        !board.isPitEmpty(position)
      ) {
        handSprite.texture = this.handAssets.hand_open;
        handSprite.visible = true;
      } else {
        handSprite.visible = false;
      }
    } else if (gameState.getGamePhase() === 'sowing') {
      const lastSowPosition = gameState.getLastSowPosition();
      if (lastSowPosition && gameState.getInHandBeads() > 0) {
        const nextPosition = board.getNextPosition(lastSowPosition);
        if (
          position.player === nextPosition.player &&
          position.pitIndex === nextPosition.pitIndex
        ) {
          handSprite.texture = this.handAssets.hand_closed;
          handSprite.visible = true;
        } else {
          handSprite.visible = false;
        }
      } else {
        handSprite.visible = false;
      }
    } else {
      handSprite.visible = false;
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

  private updateInHandText(count: string): void {
    this.inHandText.text = `Seeds in Hand: ${count}`;
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
