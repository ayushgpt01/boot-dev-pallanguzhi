import {
  Application,
  Graphics,
  TextStyle,
  Text,
  Sprite,
  Assets,
} from "pixi.js";

const gameState = "beginning";

(async () => {
  const app = new Application();

  await app.init({ background: "#4E342E", resizeTo: window });

  document.getElementById("pixi-container").appendChild(app.canvas);

  const bg = await Assets.load("/images/background.webp");
  const bgSprite = Sprite.from(bg);
  bgSprite.width = app.screen.width;
  bgSprite.height = app.screen.height;
  app.stage.addChild(bgSprite);

  const seed = await Assets.load("/assets/seed.svg");
  const seedSprite = Sprite.from(seed);
  seedSprite.scale.set(0.3, 0.3);

  const style = new TextStyle({
    fill: 0xffffff,
    fontSize: 72,
    fontFamily: "Sans Serif",
  });

  const text = new Text({
    text: "Alaguli Mane/Pallanguzhi",
    style,
  });

  text.position.set(120, 30);
  text.anchor.set(0.5, 0);
  text.x = app.screen.width / 2;
  text.y = 30;

  app.stage.addChild(text);

  const boardWidth = 724 * 1.5;
  const boardHeight = 300 * 1.5;
  const boardX = (app.screen.width - boardWidth) / 2;
  const boardY = 250;

  const board = new Graphics()
    .rect(boardX, boardY, boardWidth, boardHeight)
    .fill({ color: 0x8d6e63 })
    .stroke({ width: 10, color: 0x5d4037 });

  app.stage.addChild(board);

  const pitRadius = 40 * 1.5;
  const spacingX = 100 * 1.5;
  const startX = boardX + 60 * 1.5;
  const topRowY = boardY + 60 * 1.5;
  const bottomRowY = boardY + boardHeight - 60 * 1.5;

  const dividerHeight = 8;
  const dividerWidth = boardWidth - 20;
  const dividerX = boardX + 10;
  const dividerY = app.screen.height / 2 - dividerHeight / 2 + 18;

  const divider = new Graphics()
    .rect(dividerX, dividerY, dividerWidth, dividerHeight)
    .fill({ color: 0x4e342e })
    .stroke({ width: 2, color: 0x3e2723 });

  app.stage.addChild(divider);

  for (let i = 0; i < 7; i++) {
    const x = startX + i * spacingX;

    const pitTop = new Graphics()
      .circle(x, topRowY, pitRadius)
      .fill({ color: 0xffffff })
      .stroke({ width: 4, color: 0x000000 });

    app.stage.addChild(pitTop);
    addSeeds(x, topRowY);
  }

  for (let i = 0; i < 7; i++) {
    const x = startX + i * spacingX;

    const pitBottom = new Graphics()
      .circle(x, bottomRowY, pitRadius)
      .fill({ color: 0xffffff })
      .stroke({ width: 4, color: 0x000000 });

    app.stage.addChild(pitBottom);
    addSeeds(x, bottomRowY);
  }

  seedSprite.eventMode = "static";

  seedSprite.cursor = "pointer";

  seedSprite.on("mousedown", moveSeed);

  function moveSeed() {
    seedSprite.x -= 5;
    seedSprite.y += 5;
  }

  function addSeeds(x, y) {
    const seedRadius = 12;
    const spacing = 24;

    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5;
      const seedX = x + Math.cos(angle) * spacing;
      const seedY = y + Math.sin(angle) * spacing;

      const seedCircle = new Graphics()
        .circle(seedX, seedY, seedRadius)
        .fill({ color: 0x000000 });

      app.stage.addChild(seedCircle);
    }
  }

  // - [ ] Add interactivity to the seed sprite
  app.stage.addChild(seedSprite);
})();
