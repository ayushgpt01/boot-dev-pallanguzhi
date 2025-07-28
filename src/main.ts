import { initApp } from './pixi/initApp';
import { createBoard } from './pixi/pixiboard';
import { createSeeds } from './pixi/seeds.js';
import { createTitleText } from './pixi/textBanner.js';
import { Assets, Sprite, Texture } from 'pixi.js';
import { createPlayer, Player } from './core/Player';
import { GameController } from './core/GameController';
import { PixiGameView } from './core/GameView';

interface SeedAssets {
  [key: string]: Texture;
}

(async () => {
  try {
    console.log('1. Starting game initialization...');

    const app = await initApp();
    console.log('2. PIXI app initialized');

    await Assets.init({ manifest: '/manifest.json' });
    console.log('3. Assets initialized');

    const seedAssets: SeedAssets = await Assets.loadBundle('seeds');
    console.log('4. Seed assets loaded');

    const handAssets = await Assets.loadBundle('hands');
    console.log('5. Hand Assets loaded');

    const swordAssets = await Assets.loadBundle('swords');
    console.log('6. Sword Assets loaded');

    const texture = await Assets.load(
      '/images/backgrounds/background_one.webp'
    );
    console.log('7. Background texture loaded');

    const bgSprite = new Sprite({
      texture,
      width: app.screen.width,
      height: app.screen.height
    });

    app.stage.addChild(bgSprite);
    console.log('8. Backgrouund added to stage');

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

    // let gameView = new PixiGameView(app, seedAssets, handAssets, null as any); // Temporary null controller
    console.log('9. gameView initialized');

    let controller = null as any;

    controller = new GameController(
      player1,
      player2,
      app,
      seedAssets,
      null as any,
      config,
      handAssets
    );
    console.log('10. GameController initialized');

    const gameView = new PixiGameView(app, seedAssets, handAssets, controller); // Reassign with real controller
    controller.gameView = gameView;

    // Create board without game controller for now
    const board = createBoard(
      app,
      seedAssets,
      handAssets,
      swordAssets,
      controller
    );
    app.stage.addChild(board);
    console.log('11. Board added to stage');

    controller.updateView();

    // to force an initial render
    // controller.gameView.render(
    //   controller.getGameState()
    //   // controller.handAssets
    // );

    // - [ ] TODO: Clarity purpose; may be redundant with board.ts
    // const seeds = await createSeeds(app);
    // seeds.forEach((seed) => app.stage.addChild(seed));
    const title = createTitleText(app);

    // seeds.forEach((seed) => app.stage.addChild(seed));
    app.stage.addChild(title);

    console.log('12. Game setup complete!');
  } catch (error) {
    console.error('Error during game initialization:', error);
  }
})();
