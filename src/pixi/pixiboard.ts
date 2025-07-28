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
import { Game } from '../core/Game';

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
  controller: GameController // Require controller to enforce core/ integration
): Container {
  const gameView = controller.getGameViewInstance() as PixiGameView;
  const container = new Container();

  // Board dimensions and positioning
  const boardWidth = 724 * 1.5;
  const boardHeight = 300 * 1.5;
  const boardX = (app.screen.width - boardWidth) / 2;
  // const boardY = 250;
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
      app,
      { player: 'player1', pitIndex: i },
      controller.getGameInstance(),
      seedAssets,
      handAssets,
      controller
    );

    const pitBottom = createPit(
      app,
      { player: 'player2', pitIndex: i },
      controller.getGameInstance(),
      seedAssets,
      handAssets,
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
  gameView.render(controller.getGameInstance());

  return container;
}

function createPit(
  app: Application,
  position: Position,
  gameState: Game,
  seedAssets: SeedAssets,
  handAssets: HandAssets,
  controller: GameController
): Container {
  const pit = new Container();
  const { player, pitIndex } = position;

  pit.x = 500 + pitIndex * 150;
  pit.y = player === 'player1' ? 360 : 600;

  const pitRadius = 60;
  const initialSeeds = gameState.getBoard().getPitCount(position);

  const circle = new Graphics()
    .circle(0, 0, pitRadius)
    .fill({ color: 0x8b4513 });
  pit.addChild(circle);

  const beadText = new Text({
    text: initialSeeds.toString(),
    style: new TextStyle({ fill: 0xffffff, fontSize: 20 })
  });
  beadText.anchor.set(0.5);
  beadText.position.set(0, 0);
  pit.addChild(beadText);
  pit['beadCountText'] = beadText;

  controller.getGameViewInstance().updatePitSeeds(pit, initialSeeds, gameState);

  const handSprite = Sprite.from(handAssets.hand_open);
  handSprite.anchor.set(0.5);
  handSprite.scale.set(1.5);
  // handSprite.tint = 0xffc107;
  handSprite.tint = 0xffd700;
  handSprite.position.set(0, -pitRadius - 20); // Above pit
  handSprite.visible = false;
  pit.addChild(handSprite);

  const beadCountText = new Text({
    text: `${initialSeeds}`,
    style: new TextStyle({
      fill: 0xffffff,
      fontSize: 32,
      fontWeight: 'bold',
      align: 'center'
    })
  });
  beadCountText.anchor.set(0.5);
  beadCountText.position.set(0, pitRadius + 25);

  (pit as any).beadCountText = beadCountText;

  pit.addChild(beadCountText);

  // Store hand sprite in app for global cursor tracking
  (app as any)[`${player}-${pitIndex}-hand`] = handSprite;

  // Update seed visuals
  controller.getGameViewInstance().updatePitSeeds(pit, initialSeeds, gameState);

  // Add interactivity
  pit.eventMode = 'static';
  pit.cursor = 'pointer';

  pit.on('pointerdown', () => {
    if (controller.isCurrentPlayerHuman()) {
      const player = controller.getCurrentPlayerInfo();
      if (player.isHuman) {
        controller.handlePickClick(position);
      }
      if (controller.getGameInstance().getGamePhase() === 'sowing') {
        controller.handleSowClick(position);
      }
    }
  });

  pit.on('pointerover', () => {
    updateHandVisibility(app, position, controller, handAssets);
  });

  pit.on('pointerout', () => {
    handSprite.visible = false;
  });

  return pit;
}

function updateHandVisibility(
  app: Application,
  position: Position,
  controller: GameController,
  handAssets: HandAssets
): void {
  const { player, pitIndex } = position;
  const handSprite = (app as any)[`${player}-${pitIndex}-hand`] as Sprite;
  const gameState = controller.getGameInstance();
  const board = gameState.getBoard();
  const currentPlayer = gameState.getCurrentPlayer();

  if (gameState.getGamePhase() === 'picking') {
    // Show open hand on valid pits for current player
    if (
      position.player === currentPlayer.getPlayerSide() &&
      board.isPitActive(position) &&
      !board.isPitEmpty(position)
    ) {
      handSprite.texture = handAssets.hand_open;
      handSprite.visible = true;
    } else {
      handSprite.visible = false;
    }
  } else if (gameState.getGamePhase() === 'sowing') {
    // Show closed hand on next valid sow position when holding seeds
    const lastSowPosition = gameState.getLastSowPosition();
    if (lastSowPosition && gameState.getInHandBeads() > 0) {
      const nextPosition = board.getNextPosition(lastSowPosition);
      if (
        position.player === nextPosition.player &&
        position.pitIndex === nextPosition.pitIndex
      ) {
        handSprite.texture = handAssets.hand_closed;
        handSprite.visible = true;
      } else {
        handSprite.visible = false;
      }
    } else {
      handSprite.visible = false;
    }
  } else {
    // Hide hand in ended phase
    handSprite.visible = false;
  }
}
