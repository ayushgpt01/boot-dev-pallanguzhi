import { initApp } from './pixi/initApp';
import { createBoard } from './pixi/pixiboard';
import { createSeeds } from './pixi/seeds.js';
import { createTitleText } from './pixi/textBanner.js';
import { Assets, Sprite } from 'pixi.js';
import { createPlayer, Player } from './core/Player';
import { GameController } from './core/GameController';
import { PixiGameView } from './core/GameView';

(async () => {
  try {
    console.log('Starting game initialization...');

    const app = await initApp();
    console.log('PIXI app initialized');

    await Assets.init({ manifest: '/manifest.json' });
    console.log('Assets initialized');

    const seedAssets = await Assets.loadBundle('seeds');
    console.log('Seed assets loaded');

    const handAssets = await Assets.loadBundle('hands');
    console.log('Hand Assets loaded');

    const swordAssets = await Assets.loadBundle('swords');
    console.log('Sword Assets loaded');

    const texture = await Assets.load(
      '/images/backgrounds/background_one.webp'
    );
    console.log('Background texture loaded');

    const bgSprite = new Sprite({
      texture,
      width: app.screen.width,
      height: app.screen.height
    });

    app.stage.addChild(bgSprite);
    console.log('Background added to stage');

    const player1: Player = createPlayer(
      'human',
      'player1',
      'Player 1',
      'player1'
    );
    const player2: Player = createPlayer(
      'ai',
      'player2',
      'Player 2',
      'player2',
      'medium'
    );
    const config: GameConfig = {
      pitsPerPlayer: 7,
      initialSeeds: 5,
      maxDistributions: 2
    };

    const gameView = new PixiGameView(app, seedAssets);
    console.log('PixiGameView initialized');

    const controller = new GameController(
      player1,
      player2,
      app,
      seedAssets,
      gameView,
      config
    );
    console.log('Board added to stage');

    // Create board without game controller for now
    const board = createBoard(
      app,
      seedAssets,
      handAssets,
      swordAssets,
      controller
    );
    app.stage.addChild(board);
    console.log('Board added to stage');

    // - [ ] TODO: Clarity purpose; may be redundant with board.ts
    const seeds = await createSeeds(app);
    const title = createTitleText(app);

    seeds.forEach((seed) => app.stage.addChild(seed));
    app.stage.addChild(title);
    console.log('Seeds and title added to stage');

    console.log('Game setup complete!');
  } catch (error) {
    console.error('Error during game initialization:', error);
  }
})();
