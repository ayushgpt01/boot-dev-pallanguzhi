import { Application, Assets, Sprite } from "pixi.js";

(async () => {
  // Create Pixi application
  const app = new Application();
  await app.init({
    width: 400,
    height: 300,
    background: "#1099bb",
  });

  // Add canvas to container
  document.getElementById("pixi-container").appendChild(app.canvas);

  // Load texture
  const texture = await Assets.load("/assets/bunny.png");
  const bunny = new Sprite(texture);
  bunny.anchor.set(0.5);
  bunny.position.set(app.screen.width / 2, app.screen.height / 2);
  app.stage.addChild(bunny);

  // Rotate bunny
  app.ticker.add((time) => {
    bunny.rotation += 0.1 * time.deltaTime;
  });
})();
