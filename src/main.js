import { Application, Graphics, TextStyle, Text } from "pixi.js";

(async () => {
  const app = new Application();

  await app.init({ background: "#4E342E", resizeTo: window });
  // await app.init({ resizeTo: window });

  document.getElementById("pixi-container").appendChild(app.canvas);

  // const bg = await Assets.load("/images/background.webp");
  // const bgSprite = PIXI.Sprite.from(bg);
  // bgSprite.width = app.screen.width;
  // bgSprite.height = app.screen.height;
  // app.stage.addChild(bgSprite);

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

  const boardWidth = 724;
  const boardHeight = 300;
  const boardX = (app.screen.width - boardWidth) / 2;
  const boardY = 250;

  const board = new Graphics()
    .rect(boardX, boardY, boardWidth, boardHeight)
    .fill({ color: 0x8d6e63 })
    .stroke({ width: 10, color: 0x5d4037 });

  app.stage.addChild(board);

  const pitRadius = 40;
  const spacingX = 100;
  const startX = boardX + 60;
  const topRowY = boardY + 60;
  const bottomRowY = boardY + boardHeight - 60;

  for (let i = 0; i < 7; i++) {
    const x = startX + i * spacingX;

    const pitTop = new Graphics()
      .circle(x, topRowY, pitRadius)
      .fill({ color: 0xffffff })
      .stroke({ width: 4, color: 0x000000 });

    app.stage.addChild(pitTop);
  }

  for (let i = 0; i < 7; i++) {
    const x = startX + i * spacingX;

    const pitBottom = new Graphics()
      .circle(x, bottomRowY, pitRadius)
      .fill({ color: 0xffffff })
      .stroke({ width: 4, color: 0x000000 });

    app.stage.addChild(pitBottom);
  }
})();
