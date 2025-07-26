import { initApp } from "./pixi/initApp.js";
import { createBoard } from "./pixi/board.js";
import { createSeeds } from "./pixi/seeds.js";
import { setupSeedInteractivity } from "./pixi/interactivity.js";
import { createTitleText } from "./pixi/textBanner.js";

(async () => {
  const app = await initApp();

  const bg = createBoard(app);
  app.stage.addChild(bg);

  const seeds = await createSeeds(app);
  const title = createTitleText(app);

  seeds.forEach((seed) => app.stage.addChild(seed));
  app.stage.addChild(title);

  setupSeedInteractivity(seeds[0]);
})();
