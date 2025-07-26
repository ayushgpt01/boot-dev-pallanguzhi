import { Container, Graphics } from "pixi.js";

export function createBoard(app) {
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

    const pitTop = new Graphics()
      .circle(x, topRowY, pitRadius)
      .fill({ color: 0xffffff })
      .stroke({ width: 4, color: 0x000000 });

    const pitBottom = new Graphics()
      .circle(x, bottomRowY, pitRadius)
      .fill({ color: 0xffffff })
      .stroke({ width: 4, color: 0x000000 });

    container.addChild(pitTop);
    container.addChild(pitBottom);
  }

  return container;
}
