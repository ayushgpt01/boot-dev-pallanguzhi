import { Container, Graphics, Sprite, Assets, Text, TextStyle } from "pixi.js";

// - [x] Make the game go anti-clock wise
// - [ ] Add capturing logic
// what it should do is just remove the captured number of seeds from the board
// (i.e., the pit next to the empty one and the pit on the other side of the same pit). and update the score of the player with the number of seeds captured.

const pits = [];
let seedIdCounter = 0;
let playerA_score = 0;
let playerB_score = 0;
let turn = null;
let scoreTextA, scoreTextB, turnText;

export function createBoard(app, seedAssets) {
  turn = "A";

  const container = new Container();

  const boardWidth = 724 * 1.5;
  const boardHeight = 300 * 1.5;
  const boardX = (app.screen.width - boardWidth) / 2;
  const boardY = 250;

  const board = new Graphics()
    // .rect(boardX, boardY, boardWidth, boardHeight)
    .roundRect(boardX, boardY, boardWidth, boardHeight, 20)
    .fill({ color: 0x8d6e63 })
    .stroke({ width: 10, color: 0x5d4037 });

  // Divider bar
  const divider = new Graphics()
    // .rect(boardX + 10, app.screen.height / 2 - 4 + 18, boardWidth - 20, 8)
    .roundRect(
      boardX + 10,
      app.screen.height / 2 - 4 + 18,
      boardWidth - 20,
      8,
      4
    )
    .fill({ color: 0x4e342e });
  // .stroke({ width: 2, color: 0x3e2723 });

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

  const style = new TextStyle({
    fill: 0x000000,
    fontSize: 72,
    fontFamily: "Cinzel-SemiBold",
  });

  const playerA_name = new Text({
    text: "Player A",
    style,
  });

  playerA_name.x = boardX - 350;
  playerA_name.y = boardY - 10;

  const playerB_name = new Text({
    text: "Player B",
    style,
  });

  playerB_name.x = boardX + boardWidth + 20;
  playerB_name.y = boardY + boardHeight - 15;

  scoreTextA = new Text({
    text: `Score: ${playerA_score}`,
    style,
  });

  scoreTextA.x = boardX - 350;
  scoreTextA.y = boardY + 70;

  const bgPlateA = new Graphics()
    .roundRect(scoreTextA.x - 20, scoreTextA.y - 10, 180, 60, 12)
    .fill({ color: 0x000000, alpha: 0.4 });
  container.addChild(bgPlateA);
  container.setChildIndex(bgPlateA, 0);

  scoreTextB = new Text({
    text: `Score: ${playerB_score}`,
    style,
  });
  scoreTextB.x = boardX + boardWidth + 20;
  scoreTextB.y = boardY + boardHeight + 50;

  const bgPlateB = new Graphics()
    .roundRect(scoreTextB.x - 20, scoreTextB.y - 10, 180, 60, 12)
    .fill({ color: 0x000000, alpha: 0.4 });
  container.addChild(bgPlateB);
  container.setChildIndex(bgPlateB, 0);

  turnText = new Text({
    text: "Turn: Player A",
    style,
  });
  turnText.anchor.set(0.5);
  turnText.x = app.screen.width / 2;
  turnText.y = boardY - 50;

  const bgTurn = new Graphics()
    .roundRect(turnText.x - 180, turnText.y - 35, 360, 70, 20)
    .fill({ color: 0x000000, alpha: 0.5 });
  container.addChild(bgTurn);
  container.setChildIndex(bgTurn, 0);

  container.addChild(
    playerA_name,
    playerB_name,
    scoreTextA,
    scoreTextB,
    turnText
  );

  return container;
}

function createPit(x, y, radius, seedAssets) {
  const pit = new Container();

  pit.eventMode = "static";
  pit.cursor = "pointer";

  pit.on("pointerover", () => {
    circle.tint = 0x584d47;
  });

  pit.on("pointerout", () => {
    circle.tint = 0xffffff;
  });

  pit.on("pointerdown", () => distributeSeeds(pit));

  const circle = new Graphics()
    .circle(0, 0, radius)
    .fill({ color: 0x795548 }) // 0x8b6941
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
        if (dist < 25) {
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

let seedsInHand = [];
let currentPitIndex = null;
let nextAllowedPitIndex = null;
let isEmpty = false;

function distributeSeeds(clickedPit) {
  const clickedIndex = pits.indexOf(clickedPit);

  console.log("seedsInHand.length === 0: ", seedsInHand.length === 0);
  console.log("isEmpty: ", isEmpty);

  if (isEmpty && seedsInHand.length === 0) {
    console.log("YOUR TURN IS DONE.");
    captureSeeds();
    switchTurn();
    return;
  }

  if (clickedPit.children.length === 1 && seedsInHand.length === 0) {
    isEmpty = true;
  }

  if (clickedIndex === undefined || clickedIndex === -1) return;
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
    nextAllowedPitIndex = (clickedIndex - 1 + pits.length) % pits.length;
    console.log(
      `Picked up ${seedsInHand.length} seeds from pit ${clickedIndex}`
    );
    return;
  }

  // Seeds are in hand: only allow placing in correct next pit
  if (clickedIndex !== nextAllowedPitIndex) {
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

  // If seeds remain in hand, update nextAllowedPitIndex
  if (seedsInHand.length > 0) {
    nextAllowedPitIndex = (clickedIndex - 1 + pits.length) % pits.length;
  } else {
    const lastPit = clickedPit;
    const lastIndex = clickedIndex;
    const lastPitSeeds = lastPit.children.slice(1);

    let didCapture = false;

    if (lastPitSeeds.length === 1) {
      const nextIndex = (lastIndex - 1 + pits.length) % pits.length;
      const nextPit = pits[nextIndex];
      const nextPitSeeds = nextPit.children.slice(1);

      const oppositeIndex = pits.length - 1 - nextIndex;
      const oppotisePit = pits[oppositeIndex];
      const oppotisePitSeeds = oppotisePit.children.slice(1);

      let captured = [];

      if (nextPitSeeds.length > 0) {
        captured = captured.concat(nextPitSeeds);
        for (const seed of nextPitSeeds) {
          nextPit.removeChild(seed);
        }
      }

      if (oppotisePitSeeds.length > 0) {
        captured = captured.concat(oppotisePitSeeds);
        for (const seed of oppotisePitSeeds) {
          oppotisePit.removeChild(seed);
        }
      }

      // Update Score
      if (captured.length > 0) {
        if (turn === "A") {
          playerA_score += captured.length;
        } else {
          playerB_score += captured.length;
        }
        updateScoreText();
      }

      didCapture = captured.length > 0;
    }

    currentPitIndex = null;
    nextAllowedPitIndex = null;
    isEmpty = false;

    if (!didCapture) {
      switchTurn();
    }
  }
}

// to give control back and forth between two players
function switchTurn() {
  console.log("It's you turn Player B");
  turn = turn === "A" ? "B" : "A";
  updateTurnNext();
  console.log(`Turn switched Now it's Player ${turn}'s turn.`);
}

// function to capture seeds that the user has won
function captureSeeds() {
  console.log("CAPTURING SEEDS");
}

function updateScoreText() {
  scoreTextA.text = `Score: ${playerA_score}`;
  scoreTextB.text = `Score: ${playerB_score}`;
}

function updateTurnNext() {
  turnText.text = `Turn: Player ${turn}`;
}
