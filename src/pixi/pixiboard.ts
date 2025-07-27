import {
  Container,
  Graphics,
  Sprite,
  Assets,
  Text,
  TextStyle,
  Application,
  Texture
} from 'pixi.js';
import { GameController } from '../core/GameController';
import { PixiGameView } from '../core/GameView';

interface SeedAssets {
  [key: string]: Texture;
}

interface HandAssets {
  hand_open: Texture;
  hand_closed: Texture;
}

export function createBoard(
  app: Application,
  seedAssets: SeedAssets,
  handAssets: HandAssets,
  swordAssets: any, // Unused but kept for compatibility
  controller: GameController // Require controller to enforce core/ integration
): Container {
  const gameView = controller.gameView as PixiGameView;
  const container = new Container();

  // Board dimensions and positioning
  const boardWidth = 724 * 1.5;
  const boardHeight = 300 * 1.5;
  const boardX = (app.screen.width - boardWidth) / 2;
  const boardY = 250;

  // Draw board
  const board = new Graphics()
    .roundRect(boardX, boardY, boardWidth, boardHeight, 20)
    .fill({ color: 0x8d6e63 })
    .stroke({ width: 10, color: 0x5d4037 });

  // Draw divider bar
  const divider = new Graphics()
    .roundRect(
      boardX + 10,
      app.screen.height / 2 - 4 + 18,
      boardWidth - 20,
      8,
      4
    )
    .fill({ color: 0x4e342e });

  app.stage.addChild(board);
  app.stage.addChild(divider);

  // Create hand sprites
  const handOpenSprite = Sprite.from(handAssets.hand_open);
  const handClosedSprite = Sprite.from(handAssets.hand_closed);

  handOpenSprite.anchor.set(0.5);
  handOpenSprite.scale.set(0.3);
  handOpenSprite.visible = false;

  handClosedSprite.anchor.set(0.5);
  handClosedSprite.scale.set(0.3);
  handClosedSprite.visible = false;

  // Store hand sprites in app for access
  (app as any).handOpenSprite = handOpenSprite;
  (app as any).handClosedSprite = handClosedSprite;

  // Mouse tracking for hand sprites
  app.stage.eventMode = 'static';
  app.stage.on('pointermove', (event) => {
    handOpenSprite.x = event.global.x;
    handOpenSprite.y = event.global.y;
    handClosedSprite.x = event.global.x;
    handClosedSprite.y = event.global.y;
  });

  // Create pits (7 per player, matching Board.ts)
  const pitRadius = 60;
  const spacingX = 150;
  const startX = boardX + 90;
  const topRowY = boardY + 90;
  const bottomRowY = boardY + boardHeight - 90;

  const topPits: Container[] = []; // player1 pits (0–6)
  const bottomPits: Container[] = []; // player2 pits (0–6)

  for (let i = 0; i < 7; i++) {
    const x = startX + i * spacingX;
    const pitTop = createPit(
      x,
      topRowY,
      pitRadius,
      seedAssets,
      'player1',
      i,
      app,
      controller
    );
    const pitBottom = createPit(
      x,
      bottomRowY,
      pitRadius,
      seedAssets,
      'player2',
      i,
      app,
      controller
    );

    topPits.push(pitTop);
    bottomPits.push(pitBottom);

    container.addChild(pitTop);
    container.addChild(pitBottom);

    // Register pits with GameView
    gameView.registerPitSprite({ player: 'player1', pitIndex: i }, pitTop);
    gameView.registerPitSprite({ player: 'player2', pitIndex: i }, pitBottom);
  }

  // Text style
  const style = new TextStyle({
    fill: 0x000000,
    fontSize: 72,
    fontFamily: 'Cinzel-SemiBold'
  });

  // Player names
  const playerA_name = new Text({ text: 'Player A', style });
  playerA_name.x = boardX - 350;
  playerA_name.y = boardY - 10;

  const playerB_name = new Text({ text: 'Player B', style });
  playerB_name.x = boardX + boardWidth + 20;
  playerB_name.y = boardY + boardHeight - 15;

  // Score texts
  const scoreTextA = new Text({ text: 'Score: 0', style });
  scoreTextA.x = boardX - 350;
  scoreTextA.y = boardY + 70;

  const bgPlateA = new Graphics()
    .roundRect(scoreTextA.x - 20, scoreTextA.y - 10, 180, 60, 12)
    .fill({ color: 0x000000, alpha: 0.4 });
  container.addChild(bgPlateA);
  container.setChildIndex(bgPlateA, 0);

  const scoreTextB = new Text({ text: 'Score: 0', style });
  scoreTextB.x = boardX + boardWidth + 20;
  scoreTextB.y = boardY + boardHeight + 50;

  const bgPlateB = new Graphics()
    .roundRect(scoreTextB.x - 20, scoreTextB.y - 10, 180, 60, 12)
    .fill({ color: 0x000000, alpha: 0.4 });
  container.addChild(bgPlateB);
  container.setChildIndex(bgPlateB, 0);

  // Turn text
  const turnText = new Text({ text: 'Turn: Player A (picking)', style });
  turnText.anchor.set(0.5);
  turnText.x = app.screen.width / 2;
  turnText.y = boardY - 50;

  const bgTurn = new Graphics()
    .roundRect(turnText.x - 180, turnText.y - 35, 360, 70, 20)
    .fill({ color: 0x000000, alpha: 0.5 });
  container.addChild(bgTurn);
  container.setChildIndex(bgTurn, 0);

  container.addChild(
    playerA_name,
    playerB_name,
    scoreTextA,
    scoreTextB,
    turnText
  );

  // Register score and turn texts with GameView
  gameView.registerScoreText('player1', scoreTextA);
  gameView.registerScoreText('player2', scoreTextB);
  gameView.registerTurnText(turnText);

  // Add hand sprites to stage (on top)
  app.stage.addChild(handOpenSprite);
  app.stage.addChild(handClosedSprite);

  // Initial render
  gameView.render(controller.getGameState());

  return container;
}

function createPit(
  x: number,
  y: number,
  radius: number,
  seedAssets: SeedAssets,
  playerSide: 'player1' | 'player2',
  pitIndex: number,
  app: Application,
  controller: GameController
): Container {
  const pit = new Container();
  pit.eventMode = 'static';
  pit.cursor = 'pointer';
  (pit as any).playerSide = playerSide;
  (pit as any).pitIndex = pitIndex;

  const gameView = controller.gameView as PixiGameView;
  const gameState = controller.getGameState();

  // Event handlers
  pit.on('pointerover', () => {
    const circle = pit.children[0] as Graphics;
    circle.tint = 0x584d47;

    const phase = gameState.getGamePhase();
    const inHandBeads = gameState.getInHandBeads();
    if (
      phase === 'picking' &&
      inHandBeads === 0 &&
      controller.isCurrentPlayerHuman()
    ) {
      showHandOpen(app);
    } else if (phase === 'sowing' && controller.isCurrentPlayerHuman()) {
      showHandClosed(app);
    }
  });

  pit.on('pointerout', () => {
    const circle = pit.children[0] as Graphics;
    circle.tint = 0xffffff;
    hideHands(app);
  });

  pit.on('pointerdown', () => {
    const position: Position = { player: playerSide, pitIndex };
    const currentPlayer = gameState.getCurrentPlayer();

    if (gameState.getGamePhase() === 'picking') {
      if (controller.handlePickClick(currentPlayer, position)) {
        gameView.animateSowing(position, position).then(() => {
          gameView.render(gameState);
        });
      }
    } else if (gameState.getGamePhase() === 'sowing') {
      if (controller.handleSowClick(position)) {
        const lastPosition = gameState.getLastSowPosition()!;
        gameView.animateSowing(lastPosition, position).then(() => {
          gameView.render(gameState);
        });
      }
    }
  });

  // Draw pit
  const circle = new Graphics()
    .circle(0, 0, radius)
    .fill({ color: 0x795548 })
    .stroke({ width: 4, color: 0x000000 });
  pit.addChild(circle);

  // Initialize seeds based on Board state
  const initialSeeds = gameState
    .getBoard()
    .getPitCount({ player: playerSide, pitIndex });
  const placedSeeds: { x: number; y: number }[] = [];

  for (let i = 0; i < initialSeeds; i++) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 10) {
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
          Object.values(seedAssets)[
            Math.floor(Math.random() * Object.keys(seedAssets).length)
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
    }
  }

  pit.x = x;
  pit.y = y;
  return pit;
}

function showHandOpen(app: Application) {
  const handOpenSprite = (app as any).handOpenSprite;
  const handClosedSprite = (app as any).handClosedSprite;
  if (handOpenSprite && handClosedSprite) {
    handOpenSprite.visible = true;
    handClosedSprite.visible = false;
  }
}

function showHandClosed(app: Application) {
  const handOpenSprite = (app as any).handOpenSprite;
  const handClosedSprite = (app as any).handClosedSprite;
  if (handOpenSprite && handClosedSprite) {
    handOpenSprite.visible = false;
    handClosedSprite.visible = true;
  }
}

function hideHands(app: Application) {
  const handOpenSprite = (app as any).handOpenSprite;
  const handClosedSprite = (app as any).handClosedSprite;
  if (handOpenSprite && handClosedSprite) {
    handOpenSprite.visible = false;
    handClosedSprite.visible = false;
  }
}
