import { initApp } from "./pixi/initApp.js";
import { createBoard } from "./pixi/board.js";
import { createSeeds } from "./pixi/seeds.js";
import { setupSeedInteractivity } from "./pixi/interactivity.js";
import { createTitleText } from "./pixi/textBanner.js";
import { Assets, TilingSprite, Sprite } from "pixi.js";

(async () => {
  const app = await initApp();
  await Assets.init({ manifest: "/manifest.json" });
  const seedAssets = await Assets.loadBundle("seeds");

  const texture = await Assets.load("/images/backgrounds/background_one.webp");

  const bgSprite = new Sprite({
    texture,
    width: app.screen.width,
    height: app.screen.height,
  // Append the application canvas to the document body
  document.getElementById("pixi-container")?.appendChild(app.canvas);

  // Load the bunny texture
  const texture = await Assets.load("/assets/bunny.png");

  // Create a bunny Sprite
  const bunny = new Sprite(texture);

  // Center the sprite's anchor point
  bunny.anchor.set(0.5);

  // Move the sprite to the center of the screen
  bunny.position.set(app.screen.width / 2, app.screen.height / 2);

  // Add the bunny to the stage
  app.stage.addChild(bunny);

  // Listen for animate update
  app.ticker.add((time) => {
    // Just for fun, let's rotate mr rabbit a little.
    // * Delta is 1 if running at 100% performance *
    // * Creates frame-independent transformation *
    bunny.rotation += 0.1 * time.deltaTime;
  });

  app.stage.addChild(bgSprite);

  const board = createBoard(app, seedAssets);
  app.stage.addChild(board);

  const seeds = await createSeeds(app);
  const title = createTitleText(app);

  seeds.forEach((seed) => app.stage.addChild(seed));
  app.stage.addChild(title);

  setupSeedInteractivity(seeds[0]);
  setupSeedInteractivity(seeds[1]);
  setupSeedInteractivity(seeds[2]);
  setupSeedInteractivity(seeds[3]);
  setupSeedInteractivity(seeds[4]);
})();
