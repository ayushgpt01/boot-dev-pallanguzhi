import { Container } from 'pixi.js';
import { Board } from './Board';

export class GameView {
  stage: Container;

  constructor(stage: Container) {
    this.stage = stage;
    // initialize pit sprites, score text, overlays, etc.
  }

  renderBoard(board: Board) {
    // Draw pits, seeds, scores using PixiJS
  }

  updateBoard(board: Board) {
    // Animate pit changes and scores based on new board state
  }

  showPauseOverlay() {
    // Display semi-transparent overlay with pause elements
  }

  hidePauseOverlay() {
    // Remove pause overlay by handling the click
  }

  showWinner(winner: number | null) {
    // Render win/draw screen
  }
}
