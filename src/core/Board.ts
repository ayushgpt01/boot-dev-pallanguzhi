// Pallankuli (Aluguli Mane) Game Rules -

// Core Game Elements:
// - 2 players
// - 14 pits (or "houses"): 7 active pits per player (total 14)
// - Starts with 5 seeds in each of the 14 active pits. (Total 70 seeds at start of a round).

// How to Play
// 1. In turns, a player picks up all the BEADs from any of the holes on their side of
//    the board and redistributes them 1 BEAD per hole in counter-clockwise direction,
//    including onto spaces on their opponent’s side of the board.
// 2. Captures happen when the play space next to the last BEAD redistributed is empty.
//    The player captures all the BEADs in the hole after the empty hole, and all
//    the BEADs in the space opposite the hole BEADs were captured from. If the space
//    next to the last BEAD redistributed is empty and at the end of a row, the player
//    will have only one pit to capture the BEADs from.
// 3. If a capture cannot be made the same player starts redistributing BEADs from the
//    next play space and continues in the same direction.
// 4. If while distributing the BEADs the total number of BEADs in a hole becomes 4 the
//    player captures it respectively to their sides.
// 5. After the second redistribution, the turn is over regardless of whether a player
//    has made a capture or not.
// 6. Play continues until all the BEADs have been captured marking the end of a round.

// Losing a House (Pauper Logic):
// - This rule is typically applied between rounds, when players are refilling their pits.
// - If a player does not have enough captured seeds (e.g., less than 5 seeds per
//   active pit) to refill all of their 7 pits for the new round, the pits they cannot
//   refill become "lost houses" or "pauper pits."
// - These lost houses cannot be used for play in subsequent rounds (cannot be chosen
//   to start a sow from, and usually seeds are not dropped into them during sowing).
// - The game continues with fewer pits for that player.

// 7. The player with the higher captured score wins. Alternatively, if one player loses
//    all their houses (becomes a "pauper" with 0 active pits), they lose

export class Board {
  private pits: number[][]; // [player1Pits, player2Pits]
  private stores: number[]; // [player1Store, player2Store]
  private activePits: boolean[][]; // [player1Active, player2Active]
  private config: GameConfig;

  constructor(config: GameConfig) {
    this.config = config;
    this.pits = [
      new Array(this.config.pitsPerPlayer).fill(this.config.initialBeads),
      new Array(this.config.pitsPerPlayer).fill(this.config.initialBeads)
    ];
    this.stores = [0, 0];
    this.activePits = [
      new Array(this.config.pitsPerPlayer).fill(true),
      new Array(this.config.pitsPerPlayer).fill(true)
    ];
  }

  private getPlayerIndex(player: 'player1' | 'player2'): number {
    return this.getPlayerIndex(player);
  }

  // Pit operations
  getPitCount(position: Position): number {
    const playerIndex = this.getPlayerIndex(position.player);
    return this.pits[playerIndex][position.pitIndex];
  }

  setPitCount(position: Position, count: number): void {
    const playerIndex = this.getPlayerIndex(position.player);
    this.pits[playerIndex][position.pitIndex] = count;
  }

  incrementPit(position: Position): void {
    const playerIndex = this.getPlayerIndex(position.player);
    this.pits[playerIndex][position.pitIndex]++;
  }

  emptyPit(position: Position): number {
    const beads = this.getPitCount(position);
    this.setPitCount(position, 0);
    return beads;
  }

  isPitEmpty(position: Position): boolean {
    return this.getPitCount(position) === 0;
  }

  isPitActive(position: Position): boolean {
    const playerIndex = this.getPlayerIndex(position.player);
    return this.activePits[playerIndex][position.pitIndex];
  }

  deactivatePit(position: Position): void {
    const playerIndex = this.getPlayerIndex(position.player);
    this.activePits[playerIndex][position.pitIndex] = false;
  }

  // Store operations
  getStoreCount(player: 'player1' | 'player2'): number {
    return this.stores[this.getPlayerIndex(player)];
  }

  updateStoreCount(player: 'player1' | 'player2', count: number): void {
    this.stores[this.getPlayerIndex(player)] = count;
  }

  addToStore(player: 'player1' | 'player2', count: number): void {
    this.stores[this.getPlayerIndex(player)] += count;
  }

  // Utility methods
  getOppositePosition(position: Position): Position {
    const oppositePlayer =
      position.player === 'player1' ? 'player2' : 'player1';
    const oppositePitIndex = this.config.pitsPerPlayer - 1 - position.pitIndex;
    return { player: oppositePlayer, pitIndex: oppositePitIndex };
  }

  getNextPosition(currentPosition: Position): Position {
    const nextPitIndex = currentPosition.pitIndex + 1;

    if (nextPitIndex < this.config.pitsPerPlayer) {
      return { player: currentPosition.player, pitIndex: nextPitIndex };
    } else {
      const nextPlayer =
        currentPosition.player === 'player1' ? 'player2' : 'player1';
      return { player: nextPlayer, pitIndex: 0 };
    }
  }

  getTotalBeadsOnBoard(): number {
    return (
      this.pits[0].reduce((a, b) => a + b, 0) +
      this.pits[1].reduce((a, b) => a + b, 0)
    );
  }

  getBoardState(): BoardState {
    return {
      pits: [[...this.pits[0]], [...this.pits[1]]],
      stores: [...this.stores],
      activePits: [[...this.activePits[0]], [...this.activePits[1]]]
    };
  }

  applyBoardState(state: BoardState): void {
    this.pits = state.pits.map((row) => [...row]);
    this.stores = [...state.stores];
    this.activePits = state.activePits.map((row) => [...row]);
  }
}
