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
    console.log('Starting game initialization...');

    const app = await initApp();
    console.log('PIXI app initialized');

    await Assets.init({ manifest: '/manifest.json' });
    console.log('Assets initialized');

    const seedAssets: SeedAssets = await Assets.loadBundle('seeds');
    const handAssets = await Assets.loadBundle('hands');
    const swordAssets = await Assets.loadBundle('swords');

    const texture = await Assets.load('/images/backgrounds/background_one.webp');
    const bgSprite = new Sprite({
      texture,
      width: app.screen.width,
      height: app.screen.height
    });
    app.stage.addChild(bgSprite);
    console.log('Background set');

    const player1: Player = createPlayer('human', 'player1', 'Player 1', 'player1');
    const player2: Player = createPlayer('ai', 'player2', 'Player 2', 'player2', 'medium');

    const config: GameConfig = {
      pitsPerPlayer: 7,
      initialBeads: 5,
      maxDistributions: 2
    };

    const gameView = new PixiGameView(app, seedAssets, handAssets);
    const controller = new GameController(player1, player2, gameView, config);

    gameView.render(controller.getGameInstance());

    const title = createTitleText(app);
    app.stage.addChild(title);

    console.log('Game setup complete!');

    app.ticker.add(() => {
      gameView.render(controller.getGameInstance());
    });


  } catch (error) {
    console.error('Error during game initialization:', error);
  }
})();
