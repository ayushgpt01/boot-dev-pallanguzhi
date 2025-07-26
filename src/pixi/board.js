import { Container, Graphics, Sprite, Assets } from "pixi.js";

export function createBoard(app, seedAssets) {
  const container = new Container();

  const boardWidth = 724 * 1.5;
  const boardHeight = 300 * 1.5;
  const boardX = (app.screen.width - boardWidth) / 2;
  const boardY = 250;

  const board = new Graphics()
    .rect(boardX, boardY, boardWidth, boardHeight)
    .fill({ color: 0x8d6e63 })
    .stroke({ width: 10, color: 0x5d4037 });

  // Divider bar
  const divider = new Graphics()
    .rect(boardX + 10, app.screen.height / 2 - 4 + 18, boardWidth - 20, 8)
    .fill({ color: 0x4e342e })
    .stroke({ width: 2, color: 0x3e2723 });

  app.stage.addChild(board);
  app.stage.addChild(divider);

  const pitRadius = 60;
  const spacingX = 150;
  const startX = boardX + 90;
  const topRowY = boardY + 90;
  const bottomRowY = boardY + boardHeight - 90;

  for (let i = 0; i < 7; i++) {
    const x = startX + i * spacingX;

    const pitTop = createPit(x, topRowY, pitRadius, seedAssets);
    const pitBottom = createPit(x, bottomRowY, pitRadius, seedAssets);

    container.addChild(pitTop);
    container.addChild(pitBottom);
  }

  return container;
}

function createPit(x, y, radius, seedAssets) {
  const pit = new Container();

  const circle = new Graphics()
    .circle(0, 0, radius)
    .fill({ color: 0xffffff })
    .stroke({ width: 4, color: 0x000000 });

  pit.addChild(circle);

  // for (let i = 0; i < 5; i++) {
  //   const angle = Math.random() * Math.PI * 2;
  //   const r = Math.random() * (radius - 15);
  //   const sx = Math.cos(angle) * r;
  //   const sy = Math.sin(angle) * r;

  //   const seedSprite = Sprite.from(
  //     Object.values(seedAssets)[
  //       Math.floor(Math.random() * Object.keys(seedAssets).length)
  //     ]
  //   );

  //   seedSprite.anchor.set(0.5);
  //   seedSprite.scale.set(0.15);

  //   seedSprite.x = sx;
  //   seedSprite.xy = sy;

  //   pit.addChild(seedSprite);
  // }

  const placedSeeds = [];

  for (let i = 0; i < 5; i++) {
    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 10) {
      attempts++;
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * (radius - 15); // Better spread
      const sx = Math.cos(angle) * r;
      const sy = Math.sin(angle) * r;

      let tooClose = false;
      for (const pos of placedSeeds) {
        const dx = pos.x - sx;
        const dy = pos.y - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 20) {
          // Adjust min distance as needed
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        const seedSprite = Sprite.from(
          Object.values(seedAssets)[
            Math.floor(Math.random() * Object.keys(seedAssets).length)
          ]
        );

        seedSprite.anchor.set(0.5);
        seedSprite.scale.set(0.15);

        seedSprite.x = sx;
        seedSprite.y = sy;

        pit.addChild(seedSprite);
        placedSeeds.push({ x: sx, y: sy });
        placed = true;
      }
    }
  }

  pit.x = x;
  pit.y = y;

  return pit;
}
