// Pallankuli (Aluguli Mane) Game Rules - Based on the provided video and common variations

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
// 6. Play continues until all the BEADs have been captured.

export class Board {
  pits: number[][];
  captured: number[]; // Index 0 = Player 1 score, 1 = Player 2

  constructor(initialSeeds: number = 6) {
    this.pits = [
      new Array(7).fill(initialSeeds), // Player 1 side
      new Array(7).fill(initialSeeds) // Player 2 side
    ];
    this.captured = [0, 0];
  }

  sow(player: number, pitIndex: number): { nextPlayer: number } {
    // Game logic: sow seeds and update `pits`, `captured`
    return { nextPlayer: player }; // Or switched if turn ends
  }

  isGameOver(): boolean {
    return (
      this.pits[0].every((p) => p === 0) || this.pits[1].every((p) => p === 0)
    );
  }

  clone(): Board {
    const clone = new Board();
    clone.pits = this.pits.map((row) => [...row]);
    clone.captured = [...this.captured];
    return clone;
  }
}
