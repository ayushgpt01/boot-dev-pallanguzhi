import { initApp } from "./pixi/initApp.js";
import { createBoard } from "./pixi/board.js";
import { createSeeds } from "./pixi/seeds.js";
import { setupSeedInteractivity } from "./pixi/interactivity.js";
import { createTitleText } from "./pixi/textBanner.js";
import { Assets } from "pixi.js";

(async () => {
  const app = await initApp();
  await Assets.init({ manifest: "/manifest.json" });
  const seedAssets = await Assets.loadBundle("seeds");

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
