# Todos

- [ ] Add /assets/hand/hand_open.png and /assets/hand/hand_close.png for picking up and sowing BEADS
- [ ] Add BEADS count on the hand - which should update dynamically on SOWING and PICKING
- [ ] Change the color of the hand assets to match the board and background color
- [ ] Add BEADS count on each PIT

- [ ] update the pixi/board.ts to not use any local variables for game state management

## Notes

? What are the caputure logic for beeds on the core/ dir

### Core

```txt
// src/core/board.ts

export class board
getPitCount(position: Position): number;
setPitCount(position: Position, count: number): void;
incrementPit(position: Position): void;
emptyPit(position: Position): number;
isPitEmpty(position: Position): boolean;
isPitActive(position: Position): boolean;
deactivePit(position: Position): void;

// store operations
getStoreCount(player: 'player1' | 'player2'): number;
addToStore(player: 'player1` | 'player2', count: number): void;

// utility methods
getOppositePosition(position: Positoin): Position;
getNextPosition(currentPosition: Position): Position;
getTotalbeadsOnboard(): number;
getBoardState();
```

```txt
core/Game.ts

export class Game
private board: Board;
private currrentPlayer: Player;
private players: Map
```

### GameController.ts
