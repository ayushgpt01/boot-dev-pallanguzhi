import { Container, Graphics, Sprite, Assets } from "pixi.js";

const pits = [];
let seedIdCounter = 0;

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

  const topPits = [];
  const bottomPits = [];

  for (let i = 0; i < 7; i++) {
    const x = startX + i * spacingX;

    const pitTop = createPit(x, topRowY, pitRadius, seedAssets);
    const pitBottom = createPit(x, bottomRowY, pitRadius, seedAssets);

    topPits.push(pitTop);
    bottomPits.push(pitBottom);

    // pits.push(pitTop);
    // pits.push(pitBottom);

    container.addChild(pitTop);
    container.addChild(pitBottom);
  }

  for (let i = 0; i < 7; i++) {
    pits.push(topPits[i]);
  }

  for (let i = 6; i >= 0; i--) {
    pits.push(bottomPits[i]);
  }

  return container;
}

function createPit(x, y, radius, seedAssets) {
  const pit = new Container();

  pit.eventMode = "static";
  pit.cursor = "pointer";
  pit.on("pointerdown", () => distributeSeeds(pit));

  const circle = new Graphics()
    .circle(0, 0, radius)
    .fill({ color: 0xffffff })
    .stroke({ width: 4, color: 0x000000 });

  pit.addChild(circle);

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

        seedSprite.seedId = seedIdCounter++;

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

// function handlePitClick(pit) {
//   const index = pits.indexOf(pit);
//   if (index == -1) return;

//   if (seedsInHand.length === 0) {
//     pickSeeds(pit, index);
//   } else {
//     placeSeed(pit, index);
//   }
// }

function pickSeeds(pit, index) {
  const seedSprites = pit.children.slice(1);

  if (seedSprites.length === 0) {
    console.log("No seeds to pick.");
    return;
  }

  seedsInHand = seedSprites;
  for (const seed of seedSprites) {
    pit.removeChild(seed);
  }

  currentPitIndex = index;
  nextAllowedPitIndex = (index + 1) % pits.length;

  console.log(`Picked ${seedsInHand.length} seeds from pit ${index}`);
}

function placeSeed(pit, index) {
  if (index !== nextAllowedPitIndex) {
    console.log(`Invalid move. Place in pit ${nextAllowedPitIndex}`);
    return;
  }

  const seed = seedsInHand.shift();
  if (!seed) return;

  const radius = 60;
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * (radius - 15);
  seed.x = Math.cos(angle) * r;
  seed.y = Math.sin(angle) * r;

  pit.addChild(seed);
  console.log(`Placed seed ${seed.seedId} into pit ${index}`);

  if (seedsInHand.length > 0) {
    nextAllowedPitIndex = (index + 1) % pits.length;
  } else {
    console.log("All seeds placed. Turn done.");
    currentPitIndex = null;
    nextAllowedPitIndex = null;

    // Check captures, change turns etc.
    // - [ ] checkCapturesOrSwitchTurn(index)
  }
}

let seedsInHand = [];
let currentPitIndex = null;
let nextAllowedPitIndex = null;

function distributeSeeds(clickedPit) {
  const clickedIndex = pits.indexOf(clickedPit);
  if (clickedIndex === -1) return;

  // If no seeds in hand, pick up from clicked pit
  if (seedsInHand.length === 0) {
    const seedSprites = clickedPit.children.slice(1); // Skip the circle
    if (seedSprites.length === 0) return;

    // Pick up all seeds
    seedsInHand = seedSprites;
    for (const seed of seedSprites) {
      clickedPit.removeChild(seed);
    }

    currentPitIndex = clickedIndex;
    nextAllowedPitIndex = (clickedIndex + 1) % pits.length;
    console.log(
      `Picked up ${seedsInHand.length} seeds from pit ${clickedIndex}`
    );
    return;
  }

  // Seeds are in hand: only allow placing in correct next pit
  if (clickedIndex !== nextAllowedPitIndex) {
    console.log("clickedIndex: ", clickedIndex);
    console.log(`Invalid move. Must place in pit ${nextAllowedPitIndex}`);
    return;
  }

  // Drop one seed into the clicked pit
  const seed = seedsInHand.shift(); // Take one seed
  if (!seed) return;

  // Position it randomly within the pit (like createPit)
  const radius = 60;
  const angle = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * (radius - 15);
  seed.x = Math.cos(angle) * r;
  seed.y = Math.sin(angle) * r;

  clickedPit.addChild(seed);
  console.log(`Placed seed ${seed.seedId} into pit ${clickedIndex}`);

  // If seeds remain in hand, update nextAllowedPitIndex
  if (seedsInHand.length > 0) {
    nextAllowedPitIndex = (clickedIndex + 1) % pits.length;
  } else {
    // Finished placing
    console.log("All seeds placed. Ready for next turn.");
    currentPitIndex = null;
    nextAllowedPitIndex = null;
  }
}
