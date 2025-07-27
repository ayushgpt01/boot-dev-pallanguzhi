import { initApp } from './pixi/initApp';
import { createBoard } from './pixi/board.js';
import { createSeeds } from './pixi/seeds.js';
import { setupSeedInteractivity } from './pixi/interactivity.js';
import { createTitleText } from './pixi/textBanner.js';
import { Assets, TilingSprite, Sprite } from 'pixi.js';

(async () => {
  try {
    console.log('Starting game initialization...');

    const app = await initApp();
    console.log('PIXI app initialized');

    await Assets.init({ manifest: '/manifest.json' });
    console.log('Assets initialized');

    const seedAssets = await Assets.loadBundle('seeds');
    console.log('Seed assets loaded');

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

    // Create board without game controller for now
    const board = createBoard(app, seedAssets);
    app.stage.addChild(board);
    console.log('Board added to stage');

    const seeds = await createSeeds(app);
    const title = createTitleText(app);

    seeds.forEach((seed) => app.stage.addChild(seed));
    app.stage.addChild(title);
    console.log('Seeds and title added to stage');

    setupSeedInteractivity(seeds[0]);
    setupSeedInteractivity(seeds[1]);
    setupSeedInteractivity(seeds[2]);
    setupSeedInteractivity(seeds[3]);
    setupSeedInteractivity(seeds[4]);
    console.log('Game setup complete!');
  } catch (error) {
    console.error('Error during game initialization:', error);
  }
})();
